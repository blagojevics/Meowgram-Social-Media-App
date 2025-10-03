import { useState, useEffect } from "react";
import placeholderImg from "../../assets/placeholderImg.jpg";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import "./search.scss";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentSearches(saved);
  }, []);

  // Save recent searches when userResults change
  useEffect(() => {
    if (searchQuery.trim() !== "" && userResults.length > 0) {
      const newSearches = [
        { query: searchQuery, timestamp: Date.now() },
        ...recentSearches.filter((s) => s.query !== searchQuery),
      ].slice(0, 5); // keep last 5
      setRecentSearches(newSearches);
      localStorage.setItem("recentSearches", JSON.stringify(newSearches));
    }
    // eslint-disable-next-line
  }, [userResults]);

  // Fetch recommended users when search is empty
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const usersRef = collection(db, "users");
        // Example: get 5 most recent users
        const q = query(usersRef, orderBy("createdAt", "desc"), limit(5));
        const snap = await getDocs(q);
        const recUsers = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecommendedUsers(recUsers);
      } catch (err) {
        console.error("Error fetching recommended users:", err);
      }
    };

    if (searchQuery.trim() === "") {
      fetchRecommended();
    }
  }, [searchQuery]);

  // Debounced search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim() !== "") {
        fetchSearchResults(searchQuery.trim());
      } else {
        setUserResults([]);
        setPostResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const fetchSearchResults = async (queryText) => {
    setLoading(true);
    setError(null);
    try {
      const lowerCaseQuery = queryText.toLowerCase();

      const usersRef = collection(db, "users");

      // Search by username (most common search)
      const usernameQuery = query(
        usersRef,
        where("username", ">=", lowerCaseQuery),
        where("username", "<=", lowerCaseQuery + "\uf8ff"),
        limit(10)
      );

      // Search by display name (case insensitive)
      const displayNameQuery = query(
        usersRef,
        where("displayName", ">=", queryText),
        where("displayName", "<=", queryText + "\uf8ff"),
        limit(10)
      );

      const [usernameSnap, displayNameSnap] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(displayNameQuery),
      ]);

      // Combine results and remove duplicates
      const fetchedUsersMap = new Map();

      usernameSnap.docs.forEach((doc) => {
        const userData = doc.data();
        if (userData.username && userData.displayName) {
          fetchedUsersMap.set(doc.id, { id: doc.id, ...userData });
        }
      });

      displayNameSnap.docs.forEach((doc) => {
        const userData = doc.data();
        if (userData.username && userData.displayName) {
          fetchedUsersMap.set(doc.id, { id: doc.id, ...userData });
        }
      });

      // Additional client-side filtering for better results
      const allUsers = Array.from(fetchedUsersMap.values());
      const filteredUsers = allUsers.filter((user) => {
        const username = (user.username || "").toLowerCase();
        const displayName = (user.displayName || "").toLowerCase();
        return (
          username.includes(lowerCaseQuery) ||
          displayName.includes(lowerCaseQuery)
        );
      });

      setUserResults(filteredUsers);

      // Search posts by caption - improved query
      const postsRef = collection(db, "posts");
      const postsQuery = query(
        postsRef,
        where("caption", ">=", queryText),
        where("caption", "<=", queryText + "\uf8ff"),
        orderBy("caption"),
        limit(20)
      );

      const postSnap = await getDocs(postsQuery);
      const fetchedPosts = postSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (post) =>
            post.caption && post.caption.toLowerCase().includes(lowerCaseQuery)
        );

      setPostResults(fetchedPosts);
    } catch (err) {
      console.error("Error fetching search results:", err);
      setError("Failed to fetch search results. Please try again.");
      setUserResults([]);
      setPostResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <input
          type="text"
          placeholder="Search for users and posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="clear-search-btn"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {loading && (
        <LoadingSpinner text="Searching users and posts..." size="medium" />
      )}
      {error && <div className="error-message">{error}</div>}

      <div className="search-results">
        {/* Show recommended + recent when empty */}
        {searchQuery.trim() === "" && (
          <>
            {recentSearches.length > 0 && (
              <>
                <div className="section-header">
                  <h3>Recent Searches</h3>
                  <button onClick={clearRecentSearches} className="clear-btn">
                    Clear All
                  </button>
                </div>
                <ul className="recent-searches">
                  {recentSearches.map((searchItem, i) => (
                    <li
                      key={i}
                      onClick={() => setSearchQuery(searchItem.query)}
                    >
                      <span className="search-icon">🔍</span>
                      <span className="search-text">{searchItem.query}</span>
                      <span className="search-time">
                        {new Date(searchItem.timestamp).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {recommendedUsers.length > 0 && (
              <>
                <h3>Suggested Users</h3>
                <div className="user-results-list">
                  {recommendedUsers.map((user) => (
                    <Link
                      to={`/profile/${user.id}`}
                      key={user.id}
                      className="user-search-item"
                    >
                      <img
                        src={user.avatarUrl || user.photoURL || placeholderImg}
                        alt={user.username}
                        className="user-avatar"
                      />
                      <span>
                        {user.displayName || user.username} (@{user.username})
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Normal search results */}
        {searchQuery.trim() !== "" &&
          !loading &&
          userResults.length === 0 &&
          postResults.length === 0 && (
            <div className="no-results-message">No results found.</div>
          )}

        {userResults.length > 0 && (
          <>
            <h3>Users</h3>
            <div className="user-results-list">
              {userResults.map((user) => (
                <Link
                  to={`/profile/${user.id}`}
                  key={user.id}
                  className="user-search-item"
                >
                  <img
                    src={user.avatarUrl || user.photoURL || placeholderImg}
                    alt={user.username}
                    className="user-avatar"
                  />
                  <span>
                    {user.displayName || user.username} (@{user.username})
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        {postResults.length > 0 && (
          <>
            <h3>Posts</h3>
            <div className="post-results-list">
              {postResults.map((post) => (
                <Link
                  to={`/post/${post.id}`}
                  key={post.id}
                  className="post-search-item"
                >
                  {post.imgUrl && (
                    <img
                      src={post.imgUrl}
                      alt={post.caption || "Post image"}
                      className="post-thumbnail"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <div className="post-content">
                    <p>{post.caption || "No caption"}</p>
                    <span className="post-owner-link">
                      By: @{post.username || "Unknown user"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

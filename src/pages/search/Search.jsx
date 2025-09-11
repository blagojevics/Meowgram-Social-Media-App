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
import { db } from "../../config/firebase";
import { Link } from "react-router-dom";
import "./search.scss";

export default function Search({ currentUser }) {
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
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
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
    // eslint-disable-next-line
  }, [searchQuery]);

  const fetchSearchResults = async (queryText) => {
    setLoading(true);
    setError(null);
    try {
      const lowerCaseQuery = queryText.toLowerCase();

      const usersRef = collection(db, "users");

      const usernameQuery = query(
        usersRef,
        where("username", ">=", lowerCaseQuery),
        where("username", "<=", lowerCaseQuery + "~"),
        limit(10)
      );

      const displayNameQuery = query(
        usersRef,
        where("displayNameLowercase", ">=", lowerCaseQuery),
        where("displayNameLowercase", "<=", lowerCaseQuery + "~"),
        limit(10)
      );

      const [usernameSnap, displayNameSnap] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(displayNameQuery),
      ]);

      const fetchedUsersMap = new Map();
      usernameSnap.docs.forEach((doc) => {
        fetchedUsersMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
      displayNameSnap.docs.forEach((doc) => {
        fetchedUsersMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      const fetchedUsers = Array.from(fetchedUsersMap.values());
      setUserResults(fetchedUsers);

      const postsRef = collection(db, "posts");
      const postsQuery = query(
        postsRef,
        where("caption", ">=", queryText),
        where("caption", "<=", queryText + "~"),
        limit(10)
      );
      const postSnap = await getDocs(postsQuery);
      const fetchedPosts = postSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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

  return (
    <div className="search-page">
      <input
        type="text"
        placeholder="Search for users and posts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />

      {loading && <div className="loading-message">Searching...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="search-results">
        {/* Show recommended + recent when empty */}
        {searchQuery.trim() === "" && (
          <>
            {recentSearches.length > 0 && (
              <>
                <h3>Recent Searches</h3>
                <ul className="recent-searches">
                  {recentSearches.map((s, i) => (
                    <li key={i} onClick={() => setSearchQuery(s)}>
                      <img
                        src={s.avatarUrl || placeholderImg}
                        alt={s.username}
                        className="user-avatar"
                      />
                      {s}
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
                        src={user.avatarUrl || placeholderImg}
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
                    src={user.avatarUrl || placeholderImg}
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
                <div key={post.id} className="post-search-item">
                  <img
                    src={post.imgUrl}
                    alt={post.caption}
                    className="post-thumbnail"
                  />
                  <p>{post.caption}</p>
                  <Link
                    to={`/profile/${post.userId}`}
                    className="post-owner-link"
                  >
                    By: {post.username}
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

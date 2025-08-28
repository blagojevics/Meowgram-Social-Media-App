import "./home.scss";
import Stories from "../../components/stories/Stories";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import Post from "../../components/post/Post"; // Make sure the path is correct

export default function Home({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      setError(null);

      try {
        const postsCollectionRef = collection(db, "posts");
        // For now, fetch all posts ordered by creation time
        const q = query(postsCollectionRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        // Map document snapshots to plain JavaScript objects
        const postsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id, // Important to include the document ID
          ...doc.data(), // Spread all other fields from the document
        }));
        setPosts(postsArray);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(err.message || "Failed to load posts from server.");
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
    // Re-run if currentUser changes, useful for future personalized feeds
  }, [currentUser]);

  // Conditional Rendering for Loading, Error, Empty State
  if (loadingPosts) {
    return <div className="loading-message">Loading posts...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="no-posts-message">
        No posts yet. Be the first to add one!
      </div>
    );
  }

  // Main Home Page Content
  return (
    <div className="home-container">
      <Stories /> {/* Your Stories component */}
      <div className="posts-feed">
        {/* Map through the fetched posts and render a Post component for each */}
        {posts.map((post) => (
          <Post key={post.id} post={post} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}

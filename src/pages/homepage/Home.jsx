import "./home.scss";
import Stories from "../../components/stories/Stories";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import Post from "../../components/post/Post";

export default function Home({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    setError(null);

    try {
      const postsCollectionRef = collection(db, "posts");
      const q = query(postsCollectionRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const postsArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsArray);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err.message || "Failed to load posts from server.");
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentUser]);

  const handlePostActionComplete = ({ type, postId, newCaption }) => {
    if (type === "delete") {
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } else if (type === "edit") {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, caption: newCaption } : post
        )
      );
    }
  };

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

  return (
    <div className="home-container">
      <Stories />
      <div className="posts-feed">
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            currentUser={currentUser}
            onPostActionComplete={handlePostActionComplete}
          />
        ))}
      </div>
    </div>
  );
}

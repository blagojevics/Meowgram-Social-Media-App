import "./home.scss";
import Stories from "../../components/stories/Stories";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import Post from "../../components/post/Post";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { authUser, userDoc } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authUser) return;

    setLoadingPosts(true);
    setError(null);

    try {
      const postsCollectionRef = collection(db, "posts");
      const q = query(postsCollectionRef, orderBy("createdAt", "desc"));

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const postsArray = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt || null,
            };
          });
          setPosts(postsArray);
          setLoadingPosts(false);
        },
        (err) => {
          console.error("Error fetching posts:", err);
          setError(err.message || "Failed to load posts from server.");
          setLoadingPosts(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.error("Error setting up listener:", err);
      setError(err.message || "Failed to load posts from server.");
      setLoadingPosts(false);
    }
  }, [authUser]);

  if (!authUser || !userDoc) {
    return <div className="loading-message">Loading user...</div>;
  }

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
      <div className="home-header">MEOWGRAM</div>
      <Stories />
      <div className="posts-feed">
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            currentUser={{ ...authUser, ...userDoc }}
          />
        ))}
      </div>
    </div>
  );
}

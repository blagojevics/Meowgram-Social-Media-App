import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import Post from "../../components/post/Post";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../loading/LoadingSpinner";

export default function PostPage() {
  const { postId } = useParams();
  const { authUser } = useAuth();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "posts", postId), (snap) => {
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsub();
  }, [postId]);

  if (!post) return <LoadingSpinner text="Loading post..." size="large" />;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-primary)",
        minHeight: "100vh",
        paddingTop: "20px",
      }}
    >
      <Post post={post} currentUser={authUser} />
    </div>
  );
}

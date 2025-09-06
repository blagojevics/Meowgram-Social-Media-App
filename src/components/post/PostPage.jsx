import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import Post from "../../components/post/Post";
import { useAuth } from "../../context/AuthContext";

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

  if (!post) return <p>Loading...</p>;

  return <Post post={post} currentUser={authUser} />;
}

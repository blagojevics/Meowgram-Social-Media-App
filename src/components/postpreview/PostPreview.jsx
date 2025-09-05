import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Link } from "react-router-dom";
import "./postPreview.scss";

export default function PostPreview({ postId }) {
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      const snap = await getDoc(doc(db, "posts", postId));
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      }
    };
    fetchPost();
  }, [postId]);

  if (!post) return null;

  return (
    <Link to={`/post/${postId}`} className="post-preview">
      {post.imageUrl ? (
        <img src={post.imageUrl} alt="Post preview" />
      ) : (
        <div className="post-text-preview">{post.caption || "No caption"}</div>
      )}
    </Link>
  );
}

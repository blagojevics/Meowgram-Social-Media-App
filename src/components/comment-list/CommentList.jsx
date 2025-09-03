import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { Link } from "react-router-dom";
import "./commentList.scss";

export default function CommentList({ postId, currentUser, isPostOwner }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt || { toDate: () => new Date(0) },
          };
        })
      );
    });
    return () => unsub();
  }, [postId]);

  const handleDelete = async (comment) => {
    if (isPostOwner || comment.authorId === currentUser.uid) {
      await deleteDoc(doc(db, "comments", comment.id));
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(-1),
      });
    }
  };

  return (
    <div className="comments-list">
      {comments.map((c) => (
        <div key={c.id} className="comment">
          <Link to={`/profile/${c.authorId}`} className="comment-user-link">
            <img
              src={c.avatarUrl || "https://via.placeholder.com/24"}
              alt={c.username || "Unknown"}
              className="comment-avatar"
            />
            <span className="comment-username">{c.username || "Unknown"}</span>
          </Link>
          <span className="comment-text">{c.text}</span>
          {(isPostOwner || c.authorId === currentUser.uid) && (
            <button onClick={() => handleDelete(c)} className="delete-btn">
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

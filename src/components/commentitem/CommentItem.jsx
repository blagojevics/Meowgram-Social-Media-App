import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Link } from "react-router-dom";
import "./commentItem.scss";

export default function CommentItem({
  comment,
  currentUser,
  isPostOwner,
  onDelete,
}) {
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", comment.authorId), (snap) => {
      setAuthor(snap.data());
    });
    return unsub;
  }, [comment.authorId]);

  return (
    <div className="comment">
      <Link to={`/profile/${comment.authorId}`} className="comment-user-link">
        <img
          src={author?.avatarUrl || "https://via.placeholder.com/24"}
          alt={author?.username || "Unknown"}
          className="comment-avatar"
        />
        <span className="comment-username">
          {author?.username || "Unknown"}
        </span>
      </Link>
      <span className="comment-text">{comment.text}</span>
      {(isPostOwner || comment.authorId === currentUser.uid) && (
        <button onClick={() => onDelete(comment)} className="delete-btn">
          x
        </button>
      )}
    </div>
  );
}

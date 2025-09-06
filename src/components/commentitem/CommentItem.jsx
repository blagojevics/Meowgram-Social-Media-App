import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Link } from "react-router-dom";
import "./commentItem.scss";
import placeholderImg from "../../assets/placeholderImg.jpg";
import formatTimeAgo from "../../config/timeFormat";

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
      <div className="comment-flexbox">
        <Link to={`/profile/${comment.authorId}`} className="comment-user-link">
          <img
            src={author?.avatarUrl || placeholderImg}
            alt={author?.username || "Unknown"}
            className="comment-avatar"
          />
          <span className="comment-username">
            {author?.username || "Unknown"}
          </span>
        </Link>
        <span className="comment-text">{comment.text}</span>
        {comment.createdAt?.toDate && (
          <span className="comment-time">
            •{formatTimeAgo(comment.createdAt.toDate())}
          </span>
        )}
      </div>
      {(isPostOwner || comment.authorId === currentUser.uid) && (
        <button onClick={() => onDelete(comment)} className="delete-btn">
          x
        </button>
      )}
    </div>
  );
}

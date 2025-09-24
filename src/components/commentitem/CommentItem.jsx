import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { Link } from "react-router-dom";
import { FaPaw } from "react-icons/fa";
import "./commentItem.scss";
import placeholderImg from "../../assets/placeholderImg.jpg";
import formatTimeAgo from "../../../config/timeFormat";

export default function CommentItem({
  comment,
  currentUser,
  isPostOwner,
  onDelete,
  post,
}) {
  const [author, setAuthor] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [optimisticLikes, setOptimisticLikes] = useState(null);

  // Use optimistic likes if available, otherwise use comment.likes
  const commentLikes =
    optimisticLikes !== null ? optimisticLikes : comment.likes || [];
  const hasLiked = commentLikes.includes(currentUser?.uid);
  const likesCount = commentLikes.length;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", comment.authorId), (snap) => {
      setAuthor(snap.data());
    });
    return unsub;
  }, [comment.authorId]);

  // Reset optimistic state when comment data changes from Firestore
  useEffect(() => {
    setOptimisticLikes(null);
  }, [comment.likes]);

  // Handle comment like/unlike
  const handleLike = async () => {
    if (!currentUser?.uid || isLiking) return;

    setIsLiking(true);

    // Get current state for optimistic update
    const currentLikes = comment.likes || [];
    const wasLiked = currentLikes.includes(currentUser.uid);

    // Immediate optimistic update
    if (wasLiked) {
      // Optimistically remove like
      setOptimisticLikes(currentLikes.filter((uid) => uid !== currentUser.uid));
    } else {
      // Optimistically add like
      setOptimisticLikes([...currentLikes, currentUser.uid]);
    }

    try {
      const commentRef = doc(db, "comments", comment.id);

      if (wasLiked) {
        // Unlike the comment
        await updateDoc(commentRef, {
          likes: arrayRemove(currentUser.uid),
        });
        console.log("Successfully unliked comment");
      } else {
        // Like the comment
        await updateDoc(commentRef, {
          likes: arrayUnion(currentUser.uid),
        });
        console.log("Successfully liked comment");

        // Create notification for comment like (only if not liking own comment)
        if (comment.authorId !== currentUser.uid) {
          await addDoc(collection(db, "notifications"), {
            userId: comment.authorId, // Who gets the notification
            fromUserId: currentUser.uid, // Who performed the action
            type: "commentLike",
            postId: comment.postId,
            commentId: comment.id,
            commentText: comment.text,
            createdAt: serverTimestamp(),
            read: false,
          });
        }
      }
    } catch (error) {
      console.error("Error updating comment like:", error);
      console.error("Comment data:", comment);
      console.error("Current user:", currentUser?.uid);
      // Revert optimistic state on error
      setOptimisticLikes(currentLikes);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="comment">
      <Link to={`/profile/${comment.authorId}`} className="comment-user-link">
        <img
          src={author?.avatarUrl || author?.photoURL || placeholderImg}
          alt={author?.username || "Unknown"}
          className="comment-avatar"
          onError={(e) => {
            if (e.target.src !== placeholderImg) {
              e.target.src = placeholderImg;
            }
          }}
        />
        <span className="comment-username">
          {author?.username || "Unknown"}
        </span>
      </Link>
      <span className="comment-text">{comment.text}</span>
      <div className="comment-actions">
        {comment.createdAt?.toDate && (
          <span className="comment-time">
            • {formatTimeAgo(comment.createdAt.toDate())}
          </span>
        )}
        <button
          onClick={handleLike}
          className={`comment-like-btn ${hasLiked ? "liked" : ""}`}
          disabled={isLiking}
        >
          <FaPaw className="comment-like-icon" />
          {likesCount > 0 && (
            <span className="comment-like-count">{likesCount}</span>
          )}
        </button>
        {(isPostOwner || comment.authorId === currentUser.uid) && (
          <button onClick={() => onDelete(comment)} className="delete-btn">
            x
          </button>
        )}
      </div>
    </div>
  );
}

import React from "react";
import "./commentsModal.scss";
import CommentList from "../comment-list/CommentList";

export default function CommentsModal({
  isOpen,
  onClose,
  postId,
  currentUser,
  isPostOwner,
}) {
  if (!isOpen) return null;

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div
        className="comments-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
        <CommentList
          postId={postId}
          currentUser={currentUser}
          isPostOwner={isPostOwner}
        />
      </div>
    </div>
  );
}

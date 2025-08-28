import { Link } from "react-router-dom";
import { FaPaw, FaComment } from "react-icons/fa";
import { useState, useEffect } from "react";
import { format } from "date-fns"; // For formatting Firestore timestamps
import "./post.scss"; // Your styles

export default function Post({ post, currentUser }) {
  // State for like status and count (will be dynamic with Firestore later)
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showOptions, setShowOptions] = useState(false); // For the "•••" menu

  // Format the Firestore timestamp for display
  // post.createdAt is a Firestore Timestamp object, convert it to a JS Date first
  const formattedDate = post.createdAt
    ? format(post.createdAt.toDate(), "MMM d, yyyy 'at' h:mm a")
    : "";

  // Handle like button click (will interact with Firestore later)
  const handleLike = async () => {
    // Placeholder logic for now
    setIsLiked(!isLiked);
    setLikesCount((prev) => prev + (isLiked ? -1 : 1));
  };

  // Handle post options menu toggle
  const handleOpenOptions = () => {
    setShowOptions((prev) => !prev);
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.userId}`} className="post-header-user-link">
          <img
            src={post.userAvatar || "https://via.placeholder.com/50"} // Fallback placeholder
            alt="User Avatar"
            className="post-header-avatar"
          />
          <span className="post-header-username">
            {post.username || "Unknown User"}
          </span>{" "}
          {/* Fallback */}
        </Link>
        {/* Only show options if it's the current user's post */}
        {currentUser && currentUser.uid === post.userId && (
          <span onClick={handleOpenOptions} className="post-options-trigger">
            •••
          </span>
        )}
        {showOptions && (
          <div className="post-options-menu">
            <button className="post-options-menu-item">Edit Description</button>
            <button className="post-options-menu-item">Delete Post</button>
          </div>
        )}
      </div>
      <div className="post-image-container">
        <img
          src={post.imageUrl || "https://via.placeholder.com/600x400"} // Fallback placeholder
          alt={post.caption || `Post by ${post.username || "Unknown User"}`}
          className="post-image"
        />
      </div>

      <div className="post-actions">
        <button onClick={handleLike} className="post-action-button">
          <FaPaw style={{ color: isLiked ? "red" : "gray" }} />
        </button>
        <span className="post-likes-count">{likesCount} Paws</span>
        <button className="post-action-button">
          <FaComment />
        </button>
        <span className="post-comments-count">{post.commentsCount || 0}</span>
      </div>
      <div className="post-caption">
        <span className="post-caption-username">
          {post.username || "Unknown User"}
        </span>
        <span className="post-caption-text">
          {post.caption || "No caption."}
        </span>
      </div>
      <div className="post-timestamp">
        <span className="post-timestamp-text">
          {formattedDate || "Date N/A"}
        </span>
      </div>
    </div>
  );
}

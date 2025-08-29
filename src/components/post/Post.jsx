import { Link } from "react-router-dom";
import { FaPaw, FaComment } from "react-icons/fa";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import "./post.scss";
import {
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db } from "../../config/firebase";

export default function Post({ post, currentUser, onPostActionComplete }) {
  const [isLiked, setIsLiked] = useState(
    currentUser &&
      post.likedByUsers &&
      post.likedByUsers.includes(currentUser.uid)
  );
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption || "");
  const [editingError, setEditingError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setEditedCaption(post.caption || "");

    setIsLiked(
      currentUser &&
        post.likedByUsers &&
        post.likedByUsers.includes(currentUser.uid)
    );
    setLikesCount(post.likesCount || 0);
  }, [post, currentUser]);

  const formattedDate = post.createdAt
    ? format(post.createdAt.toDate(), "MMM d, yyyy 'at' h:mm a")
    : "";

  const handleLike = async () => {
    if (!currentUser) {
      console.log("User must be logged in to like posts.");

      return;
    }

    const postDocRef = doc(db, "posts", post.id);
    const userId = currentUser.uid;

    try {
      if (isLiked) {
        await updateDoc(postDocRef, {
          likesCount: increment(-1),
          likedByUsers: arrayRemove(userId),
        });
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        await updateDoc(postDocRef, {
          likesCount: increment(1),
          likedByUsers: arrayUnion(userId),
        });
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error updating like:", err);
    }
  };

  const handleOpenOptions = () => {
    setShowOptions((prev) => !prev);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedCaption(post.caption || "");
    setEditingError(null);
  };

  const handleEditedCaptionChange = (e) => {
    setEditedCaption(e.target.value);
  };

  const handleSaveEdit = async () => {
    setEditingError(null);

    if (editedCaption.trim() === "") {
      setEditingError("Caption cannot be empty.");
      return;
    }

    if (editedCaption === post.caption) {
      setIsEditing(false);
      return;
    }

    try {
      const postDocRef = doc(db, "posts", post.id);
      await updateDoc(postDocRef, { caption: editedCaption });

      if (onPostActionComplete) {
        onPostActionComplete({
          type: "edit",
          postId: post.id,
          newCaption: editedCaption,
        });
      }

      setIsEditing(false);
    } catch (err) {
      console.error("Error saving caption:", err);
      setEditingError(err.message || "Failed to update caption.");
    }
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    setShowOptions(false);

    try {
      const postDocRef = doc(db, "posts", post.id);
      await deleteDoc(postDocRef);

      if (onPostActionComplete) {
        onPostActionComplete({ type: "delete", postId: post.id });
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.userId}`} className="post-header-user-link">
          <img
            src={
              post.userAvatar ||
              "https://via.placeholder.com/50/CCCCCC/FFFFFF?text=AV"
            }
            alt="User Avatar"
            className="post-header-avatar"
          />
          <span className="post-header-username">
            {post.username || "Unknown User"}
          </span>
        </Link>
        {currentUser && currentUser.uid === post.userId && (
          <span onClick={handleOpenOptions} className="post-options-trigger">
            •••
          </span>
        )}
        {showOptions && (
          <div
            className="post-options-menu"
            style={{
              position: "absolute",
              top: "55px",
              right: "5px",
              backgroundColor: "white",
              border: "1px solid lightgray",
              borderRadius: "5px",
              boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <button
              onClick={handleEditClick}
              className="post-options-menu-item"
              style={{
                background: "none",
                border: "none",
                padding: "8px 15px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "14px",
                whiteSpace: "nowrap",
                color: "black",
              }}
            >
              Edit Description
            </button>
            <button
              onClick={handleDeletePost}
              className="post-options-menu-item"
              disabled={isDeleting}
              style={{
                background: "none",
                border: "none",
                padding: "8px 15px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "14px",
                whiteSpace: "nowrap",
                color: "black",
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Post"}
            </button>
          </div>
        )}
      </div>
      <div className="post-image-container">
        <img
          src={
            post.imageUrl ||
            "https://via.placeholder.com/600x400/CCCCCC/FFFFFF?text=No%20Image"
          }
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
        {isEditing ? (
          <div style={{ padding: "10px" }}>
            <textarea
              value={editedCaption}
              onChange={handleEditedCaptionChange}
              rows="3"
              style={{
                width: "100%",
                minHeight: "70px",
                padding: "8px",
                border: "1px solid lightgray",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            ></textarea>
            {editingError && (
              <p style={{ color: "red", fontSize: "12px" }}>{editingError}</p>
            )}
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "5px",
              }}
            >
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: "5px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                }}
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: "5px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: "#f0f0f0",
                  color: "black",
                  border: "none",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="post-caption-username">
              {post.username || "Unknown User"}
            </span>
            <span className="post-caption-text">
              {post.caption || "No caption."}
            </span>
          </>
        )}
      </div>
      <div className="post-timestamp">
        <span className="post-timestamp-text">
          {formattedDate || "Date N/A"}
        </span>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { FaPaw, FaComment } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import CommentsModal from "../commentsmodal/CommentsModal";
import LikesListModal from "../likeslistmodal/LikesListModal";
import "./post.scss";
import CommentInput from "../comment-input/CommentInput";
import CommentItem from "../commentitem/CommentItem";
import formatTimeAgo from "../../config/timeFormat";
import {
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
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

  const [previewComments, setPreviewComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [showFullComments, setShowFullComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);

  const [postUser, setPostUser] = useState(null);

  const optionsRef = useRef(null);

  useEffect(() => {
    setEditedCaption(post.caption || "");
    setIsLiked(
      currentUser &&
        post.likedByUsers &&
        post.likedByUsers.includes(currentUser.uid)
    );
    setLikesCount(post.likesCount || 0);
  }, [post, currentUser]);

  useEffect(() => {
    if (!post.userId) return;
    const ref = doc(db, "users", post.userId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setPostUser(snap.data());
      }
    });
    return () => unsub();
  }, [post.userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions]);

  const handleLike = async () => {
    if (!currentUser) return;
    const postDocRef = doc(db, "posts", post.id);
    const userId = currentUser.uid;
    try {
      if (isLiked) {
        await updateDoc(postDocRef, {
          likesCount: increment(-1),
          likedByUsers: arrayRemove(userId),
        });
      } else {
        await updateDoc(postDocRef, {
          likesCount: increment(1),
          likedByUsers: arrayUnion(userId),
        });
        if (post.userId !== currentUser.uid) {
          await addDoc(collection(db, "notifications"), {
            userId: post.userId,
            fromUserId: currentUser.uid,
            type: "like",
            postId: post.id,
            createdAt: serverTimestamp(),
            read: false,
          });
        }
      }
    } catch (err) {
      console.error("Error updating like:", err);
    }
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

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", post.id),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt || { toDate: () => new Date(0) },
        };
      });
      setTotalComments(all.length);
      setPreviewComments(all.slice(0, all.length < 10 ? 1 : 2));
    });
    return () => unsub();
  }, [post.id]);

  const handleDeleteComment = async (comment) => {
    if (
      post.userId === currentUser.uid ||
      comment.authorId === currentUser.uid
    ) {
      await deleteDoc(doc(db, "comments", comment.id));
      await updateDoc(doc(db, "posts", post.id), {
        commentsCount: increment(-1),
      });
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.userId}`} className="post-header-user-link">
          <img
            src={
              postUser?.avatarUrl ||
              "https://via.placeholder.com/50/CCCCCC/FFFFFF?text=AV"
            }
            alt="User Avatar"
            className="post-header-avatar"
          />
          <span className="post-username-header">
            {postUser?.username || "Unknown User"}
          </span>
          <span className="post-time">
            {post.createdAt?.toDate
              ? `· ${formatTimeAgo(post.createdAt.toDate())}`
              : "· just now"}
          </span>
        </Link>
        {currentUser && currentUser.uid === post.userId && (
          <span
            onClick={() => setShowOptions((p) => !p)}
            className="post-options-trigger"
          >
            •••
          </span>
        )}
        {showOptions && (
          <div ref={optionsRef} className="post-options-menu">
            <button onClick={handleEditClick}>Edit Description</button>
            <button onClick={handleDeletePost} disabled={isDeleting}>
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
          alt={
            post.caption || `Post by ${postUser?.username || "Unknown User"}`
          }
          className="post-image"
        />
      </div>

      <div className="post-actions">
        <button onClick={handleLike} className="post-action-button">
          <FaPaw style={{ color: isLiked ? "red" : "gray" }} />
        </button>
        <span
          className="post-likes-count"
          onClick={() => setShowLikes(true)}
          style={{ cursor: "pointer" }}
        >
          {likesCount} Paws
        </span>
        <button
          onClick={() => setShowFullComments(true)}
          className="post-action-button"
        >
          <FaComment />
        </button>
        <span className="post-comments-count">{post.commentsCount || 0}</span>
      </div>

      <div className="post-caption">
        {isEditing ? (
          <div>
            <textarea
              value={editedCaption}
              onChange={handleEditedCaptionChange}
              rows="3"
            ></textarea>
            {editingError && <p style={{ color: "red" }}>{editingError}</p>}
            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={handleCancelEdit}>Cancel</button>
          </div>
        ) : (
          <div className="left">
            <>
              <span className="post-caption-username">
                {postUser?.username + " •" || "Unknown User"}
              </span>
              <span className="post-caption-text">
                {post.caption || "No caption."}
              </span>
            </>
          </div>
        )}
      </div>

      <div className="post-comment-section">
        {previewComments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            currentUser={currentUser}
            isPostOwner={post.userId === currentUser.uid}
            onDelete={handleDeleteComment}
          />
        ))}

        {totalComments > previewComments.length && (
          <button
            onClick={() => setShowFullComments(true)}
            className="show-more-comments-btn"
          >
            Show more comments
          </button>
        )}
      </div>

      {showFullComments && (
        <CommentsModal
          isOpen={showFullComments}
          onClose={() => setShowFullComments(false)}
          postId={post.id}
          currentUser={currentUser}
          isPostOwner={post.userId === currentUser.uid}
        />
      )}

      {showLikes && (
        <LikesListModal
          isOpen={showLikes}
          onClose={() => setShowLikes(false)}
          likedByUsers={post.likedByUsers || []}
        />
      )}

      {currentUser ? (
        <CommentInput post={post} postId={post.id} currentUser={currentUser} />
      ) : (
        <div
          style={{
            fontSize: 12,
            color: "#777",
            margin: "0 auto",
            width: "90%",
            height: "50px",
          }}
        >
          Log in to comment
        </div>
      )}
    </div>
  );
}

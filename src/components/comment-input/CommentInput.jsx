import { useState, useRef, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import "./commentInput.scss";
import placeholderImg from "../../assets/placeholderImg.jpg";
import { FaPaperPlane } from "react-icons/fa";

export default function CommentInput({ postId, currentUser, post }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const commentData = {
      postId,
      authorId: currentUser?.uid,
      text: trimmed,
      createdAt: serverTimestamp(),
      likes: [], // Initialize empty likes array
    };

    try {
      await addDoc(collection(db, "comments"), commentData);
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(1),
      });
      if (post.userId !== currentUser.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: post.userId,
          fromUserId: currentUser.uid,
          type: "comment",
          postId,
          commentText: trimmed,
          createdAt: serverTimestamp(),
          read: false,
        });
      }
      setText("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-input">
      <div className="comment-input-container">
        <img
          src={
            currentUser?.avatarUrl || currentUser?.photoURL || placeholderImg
          }
          alt=""
          className="comment-input-avatar"
          onError={(e) => {
            if (e.target.src !== placeholderImg) {
              e.target.src = placeholderImg;
            }
          }}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Write a comment..."
          className="comment-input-field"
          rows={1}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="comment-input-btn"
        >
          <FaPaperPlane />
        </button>
      </div>
    </form>
  );
}

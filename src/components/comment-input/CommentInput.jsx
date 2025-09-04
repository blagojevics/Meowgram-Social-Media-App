import { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import "./commentInput.scss";

export default function CommentInput({ postId, currentUser, post }) {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const commentData = {
      postId,
      authorId: currentUser?.uid,
      text: trimmed,
      createdAt: serverTimestamp(),
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
          createdAt: serverTimestamp(),
          read: false,
        });
      }
      setText("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-input">
      <img
        src={currentUser?.avatarUrl || "https://via.placeholder.com/28"}
        alt=""
        className="comment-input-avatar"
      />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
        className="comment-input-field"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="comment-input-btn"
      >
        Post
      </button>
    </form>
  );
}

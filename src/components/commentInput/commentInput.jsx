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

export default function CommentInput({ postId, currentUser, post }) {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const commentData = {
      authorId: currentUser?.uid,
      username: currentUser?.displayName || currentUser?.username || "",
      avatarUrl: currentUser?.avatarUrl || "",
      text: trimmed,
      createdAt: serverTimestamp(),
      postId: postId,
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
          postId: postId,
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
    <form
      onSubmit={handleSubmit}
      className="comment-input"
      style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8 }}
    >
      <img
        src={currentUser?.avatarUrl || "https://via.placeholder.com/28"}
        alt=""
        style={{ width: 28, height: 28, borderRadius: "50%" }}
      />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
        style={{
          flex: 1,
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #ddd",
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={!text.trim()}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "none",
          background: text.trim() ? "#007bff" : "#ccc",
          color: "white",
          cursor: text.trim() ? "pointer" : "not-allowed",
        }}
      >
        Post
      </button>
    </form>
  );
}

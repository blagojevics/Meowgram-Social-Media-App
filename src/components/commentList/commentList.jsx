import { useState, useEffect } from "react";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";

export default function CommentList({ postId }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setComments(list);
    });
    return () => unsub();
  }, [postId]);

  return (
    <div className="comments-list" aria-label="comments">
      {comments.map((c) => (
        <div
          key={c.id}
          className="comment-item"
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            padding: "6px 0",
          }}
        >
          <img
            src={c.avatarUrl || "https://via.placeholder.com/28"}
            alt=""
            style={{ width: 28, height: 28, borderRadius: "50%" }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{c.username}</div>
            <div style={{ fontSize: 13 }}>{c.text}</div>
            <div style={{ fontSize: 11, color: "#666" }}>
              {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

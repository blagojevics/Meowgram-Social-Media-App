import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import "./likesListModal.scss";
import placeholderImg from "../../assets/placeholderImg.jpg";

export default function LikesListModal({ isOpen, onClose, likedByUsers }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!isOpen || !likedByUsers) return;
    const unsubs = likedByUsers.map((uid) =>
      onSnapshot(doc(db, "users", uid), (snap) => {
        if (snap.exists()) {
          setUsers((prev) => {
            const filtered = prev.filter((u) => u.id !== uid);
            return [...filtered, { id: uid, ...snap.data() }];
          });
        }
      })
    );
    return () => unsubs.forEach((unsub) => unsub());
  }, [isOpen, likedByUsers]);

  if (!isOpen) return null;

  return (
    <div className="likes-modal-overlay" onClick={onClose}>
      <div className="likes-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
        <h3>Liked by</h3>
        <ul className="likes-list">
          {users.map((u) => (
            <li key={u.id} className="like-user">
              <img
                src={u.avatarUrl || placeholderImg}
                alt={u.username || "Unknown"}
                className="like-user-avatar"
              />
              <span className="like-user-name">{u.username || "Unknown"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

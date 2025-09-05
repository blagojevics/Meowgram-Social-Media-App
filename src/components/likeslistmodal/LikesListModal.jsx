import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import "./likesListModal.scss";

export default function LikesListModal({ isOpen, onClose, likedByUsers }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!isOpen || !likedByUsers) return;

    const fetchUsers = async () => {
      const userData = [];
      for (const uid of likedByUsers) {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          userData.push({ id: uid, ...snap.data() });
        }
      }
      setUsers(userData);
    };

    fetchUsers();
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
                src={u.avatarUrl || "https://via.placeholder.com/32"}
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

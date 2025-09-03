import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useNavigate } from "react-router-dom";
import "./followListModal.scss";

export default function FollowListModal({ userId, type, onClose }) {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    const ref = collection(db, "users", userId, type); // "followers" or "following"
    const unsub = onSnapshot(ref, (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [userId, type]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      onClose();
    }
  };

  const handleUserClick = (uid) => {
    onClose(); // close modal first
    navigate(`/profile/${uid}`);
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h2>{type === "followers" ? "Followers" : "Following"}</h2>
        <ul className="user-list">
          {users.length === 0 ? (
            <li className="empty">No {type} yet</li>
          ) : (
            users.map((u) => (
              <li
                key={u.id}
                className="user-list-item"
                onClick={() => handleUserClick(u.uid)}
              >
                <img src={u.avatarUrl} alt={u.username} />
                <span>{u.username}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

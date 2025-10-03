import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import "./likesListModal.scss";
import placeholderImg from "../../assets/placeholderImg.jpg";
import LoadingSpinner from "../loading/LoadingSpinner";

export default function LikesListModal({ isOpen, onClose, likedByUsers }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !likedByUsers || likedByUsers.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setUsers([]);

    let loadedCount = 0;
    const userMap = new Map();
    const totalUsers = likedByUsers.length;

    const unsubs = likedByUsers.map((uid) =>
      onSnapshot(
        doc(db, "users", uid),
        (snap) => {
          if (snap.exists()) {
            const userData = { id: uid, ...snap.data() };
            userMap.set(uid, userData);
          } else {
            userMap.set(uid, {
              id: uid,
              username: "Deleted User",
              avatarUrl: null,
            });
          }

          loadedCount++;
          setUsers(Array.from(userMap.values()));

          if (loadedCount >= totalUsers) {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error fetching user data:", error);
          loadedCount++;
          if (loadedCount >= totalUsers) {
            setLoading(false);
          }
        }
      )
    );

    return () => unsubs.forEach((unsub) => unsub());
  }, [isOpen, likedByUsers?.length]);

  if (!isOpen) return null;

  return (
    <div className="likes-modal-overlay" onClick={onClose}>
      <div className="likes-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
        <h3>Liked by</h3>
        <ul className="likes-list">
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <LoadingSpinner text="Loading likes..." size="medium" />
            </div>
          ) : users.length === 0 ? (
            <li style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              No likes yet
            </li>
          ) : (
            users.map((u) => (
              <li key={u.id} className="like-user">
                <img
                  src={u.avatarUrl || u.photoURL || placeholderImg}
                  alt={u.username || "Unknown"}
                  className="like-user-avatar"
                  onError={(e) => {
                    if (e.target.src !== placeholderImg) {
                      e.target.src = placeholderImg;
                    }
                  }}
                />
                <span className="like-user-name">
                  {u.username || "Unknown"}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

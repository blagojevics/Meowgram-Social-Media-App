import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import "./notifications.scss";

export default function Notifications({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(list);

      const uniqueUserIds = [...new Set(list.map((n) => n.fromUserId))];
      const userData = {};
      for (const uid of uniqueUserIds) {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          userData[uid] = userDoc.data();
        }
      }
      setUsersMap(userData);
    });
    return () => unsub();
  }, [currentUser]);

  const markAsRead = async (id) => {
    const notifRef = doc(db, "notifications", id);
    await updateDoc(notifRef, { read: true });
  };

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul className="notifications-list">
          {notifications.map((n) => {
            const fromUser = usersMap[n.fromUserId];
            const displayName =
              fromUser?.username || fromUser?.displayName || "Someone";
            return (
              <li
                key={n.id}
                onClick={() => markAsRead(n.id)}
                style={{
                  fontWeight: n.read ? "normal" : "bold",
                  cursor: "pointer",
                }}
              >
                {n.type === "like" && (
                  <span>{displayName} liked your post</span>
                )}
                {n.type === "comment" && (
                  <span>{displayName} commented on your post</span>
                )}
                {n.type === "follow" && <span>{displayName} followed you</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

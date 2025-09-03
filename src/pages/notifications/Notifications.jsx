import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../../config/firebase";
import "./notifications.scss";

export default function Notifications({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    if (!currentUser) return;

    // ✅ Order notifications by newest first
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(list);

      // ✅ Fetch sender info (cache in usersMap)
      const uniqueUserIds = [
        ...new Set(list.map((n) => n.fromUserId).filter(Boolean)),
      ];
      const userData = {};
      for (const uid of uniqueUserIds) {
        if (!usersMap[uid]) {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            userData[uid] = userDoc.data();
          }
        }
      }
      setUsersMap((prev) => ({ ...prev, ...userData }));
    });

    return () => unsub();
  }, [currentUser]);

  // ✅ Mark all as read when user visits the page
  useEffect(() => {
    if (notifications.length > 0) {
      notifications.forEach(async (n) => {
        if (!n.read) {
          const notifRef = doc(db, "notifications", n.id);
          await updateDoc(notifRef, { read: true });
        }
      });
    }
  }, [notifications]);

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
                className={`notification-item ${n.read ? "read" : "unread"}`}
              >
                {n.type === "like" && (
                  <span>
                    <Link to={`/profile/${n.fromUserId}`}>{displayName}</Link>{" "}
                    liked your <Link to={`/post/${n.postId}`}>post</Link>
                  </span>
                )}
                {n.type === "comment" && (
                  <span>
                    <Link to={`/profile/${n.fromUserId}`}>{displayName}</Link>{" "}
                    commented on your <Link to={`/post/${n.postId}`}>post</Link>
                  </span>
                )}
                {n.type === "follow" && (
                  <span>
                    <Link to={`/profile/${n.fromUserId}`}>{displayName}</Link>{" "}
                    followed you
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

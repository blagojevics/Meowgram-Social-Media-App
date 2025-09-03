import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
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

    // Debug log: check current user UID
    console.log("Current user UID:", currentUser.uid);

    // TEMP: no orderBy to avoid index issues
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log("Fetched notifications:", list); // Debug log

      setNotifications(list);

      // Fetch sender info
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

      // Mark all as read
      list.forEach(async (n) => {
        if (!n.read) {
          const notifRef = doc(db, "notifications", n.id);
          await updateDoc(notifRef, { read: true });
        }
      });
    });

    return () => unsub();
  }, [currentUser]);

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
                style={{
                  fontWeight: n.read ? "normal" : "bold",
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

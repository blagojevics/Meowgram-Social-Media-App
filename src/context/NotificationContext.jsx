import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { NotificationContext } from "../contexts/NotificationContext";

export function NotificationProvider({ currentUser, children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      where("read", "==", false) // only unread
    );

    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size); // number of unread docs
    });

    return () => unsub();
  }, [currentUser]);

  return (
    <NotificationContext.Provider value={{ unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

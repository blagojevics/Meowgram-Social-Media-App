import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { Link } from "react-router-dom";
import formatTimeAgo from "../../config/timeFormat";
import { useAuth } from "../../context/AuthContext";
import "./notifications.scss";
import placeholderImg from "../../assets/placeholderImg.jpg";
import PostPreview from "../../components/postpreview/PostPreview";

const PAGE_SIZE = 10;

export default function Notifications() {
  const { authUser: currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    loadMore();
    markAsRead();
  }, [currentUser]);

  const markAsRead = async () => {
    if (!currentUser) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    snap.forEach(async (docSnap) => {
      await updateDoc(doc(db, "notifications", docSnap.id), { read: true });
    });
  };

  const loadMore = async () => {
    if (!currentUser || loading || !hasMore) return;
    setLoading(true);

    let q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );

    if (lastDoc) {
      q = query(
        collection(db, "notifications"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
    }

    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const userData = {};
    for (const n of list) {
      if (n.fromUserId && !usersMap[n.fromUserId]) {
        const userDoc = await getDoc(doc(db, "users", n.fromUserId));
        if (userDoc.exists()) {
          userData[n.fromUserId] = userDoc.data();
        }
      }
    }

    setUsersMap((prev) => ({ ...prev, ...userData }));
    setNotifications((prev) => [...prev, ...list]);
    setLastDoc(snap.docs[snap.docs.length - 1]);
    setHasMore(list.length === PAGE_SIZE);
    setLoading(false);
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
            const avatar = fromUser?.avatarUrl || placeholderImg;

            return (
              <li key={n.id} className="notification-item">
                <Link to={`/profile/${n.fromUserId}`} className="notif-user">
                  <img
                    src={avatar}
                    alt={displayName}
                    className="notif-avatar"
                  />
                </Link>
                <div className="notif-text">
                  <Link
                    to={`/profile/${n.fromUserId}`}
                    className="notif-username"
                  >
                    {displayName}
                  </Link>
                  {n.type === "like" && (
                    <div className="notif-row">
                      <span>liked your post</span>
                      {n.postId && <PostPreview postId={n.postId} />}
                    </div>
                  )}
                  {n.type === "comment" && (
                    <div className="notif-row">
                      <span>commented on your post</span>
                      {n.postId && <PostPreview postId={n.postId} />}
                    </div>
                  )}
                  {n.type === "follow" && <span>followed you</span>}
                  <div className="notif-time">
                    {n.createdAt?.toDate
                      ? formatTimeAgo(n.createdAt.toDate())
                      : "just now"}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <button onClick={loadMore} disabled={loading} className="load-more-btn">
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}

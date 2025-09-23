import { useEffect, useState, useCallback } from "react";
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
import { db } from "../../../config/firebase";
import { Link } from "react-router-dom";
import formatTimeAgo from "../../../config/timeFormat";
import { useAuth } from "../../hooks/useAuth";
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
  const [initialLoad, setInitialLoad] = useState(false);

  // Initial load effect - only runs once when currentUser changes
  useEffect(() => {
    if (!currentUser || initialLoad) return;

    const initializeNotifications = async () => {
      setNotifications([]);
      setUsersMap({});
      setLastDoc(null);
      setHasMore(true);
      setInitialLoad(true);

      // Load first batch and mark as read
      await Promise.all([loadMoreNotifications(true), markAsRead()]);
    };

    initializeNotifications();
  }, [currentUser]);

  const markAsRead = useCallback(async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", currentUser.uid),
        where("read", "==", false)
      );
      const snap = await getDocs(q);

      // Batch update all unread notifications
      const updatePromises = snap.docs.map((docSnap) =>
        updateDoc(doc(db, "notifications", docSnap.id), { read: true })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }, [currentUser]);

  const loadMoreNotifications = useCallback(
    async (isInitialLoad = false) => {
      if (!currentUser || loading || (!hasMore && !isInitialLoad)) return;

      setLoading(true);

      try {
        let q = query(
          collection(db, "notifications"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        );

        if (lastDoc && !isInitialLoad) {
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

        // Get user data for notifications that don't have it yet
        const newUserData = {};
        const userFetchPromises = [];

        for (const n of list) {
          if (
            n.fromUserId &&
            !usersMap[n.fromUserId] &&
            !newUserData[n.fromUserId]
          ) {
            userFetchPromises.push(
              getDoc(doc(db, "users", n.fromUserId)).then((userDoc) => {
                if (userDoc.exists()) {
                  newUserData[n.fromUserId] = userDoc.data();
                }
              })
            );
          }
        }

        await Promise.all(userFetchPromises);

        // Update state
        setUsersMap((prev) => ({ ...prev, ...newUserData }));
        setNotifications((prev) => (isInitialLoad ? list : [...prev, ...list]));
        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(list.length === PAGE_SIZE);
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, loading, hasMore, lastDoc, usersMap]
  );

  // Wrapper function for the load more button
  const handleLoadMore = () => {
    loadMoreNotifications(false);
  };

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>
      {!initialLoad ? (
        <div className="loading-message">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul className="notifications-list">
          {notifications.map((n, idx) => {
            const fromUser = usersMap[n.fromUserId];
            const displayName =
              fromUser?.username || fromUser?.displayName || "Someone";
            const avatar =
              fromUser?.avatarUrl || fromUser?.photoURL || placeholderImg;

            return (
              <li key={n.id + "-" + idx} className="notification-item">
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

      {hasMore && initialLoad && (
        <button
          onClick={handleLoadMore}
          disabled={loading}
          className="load-more-btn"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}

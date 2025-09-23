import "./leftbar.scss";
import Logo from "../../assets/logoo.webp";
import { Link, useLocation } from "react-router-dom";
import { db } from "../../../config/firebase";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import placeholderImg from "../../assets/placeholderImg.jpg";

// ✅ Import icons
import {
  FaHome,
  FaSearch,
  FaUser,
  FaBell,
  FaPlusSquare,
  FaCog,
} from "react-icons/fa";

export default function Leftbar() {
  const { authUser, userDoc } = useAuth();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  const profileLink = authUser ? `/profile/${authUser.uid}` : "/login";

  // More stable avatar selection - avoid unnecessary re-evaluations
  const avatarUrl = userDoc?.avatarUrl || authUser?.photoURL;
  const hasValidAvatar = avatarUrl && avatarUrl.trim() !== "";

  // Reset error state when avatar URL changes
  useEffect(() => {
    if (hasValidAvatar) {
      setAvatarError(false);
    }
  }, [hasValidAvatar, avatarUrl]);

  // Handle avatar load errors - only for real URLs
  const handleAvatarError = () => {
    if (hasValidAvatar) {
      console.log("Avatar failed to load:", avatarUrl);
      setAvatarError(true);
    }
  };

  const handleAvatarLoad = () => {
    if (hasValidAvatar) {
      setAvatarError(false);
    }
  };

  const getDisplayAvatar = () => {
    // If no valid avatar URL exists, always use placeholder
    if (!hasValidAvatar) {
      return placeholderImg;
    }
    // If valid URL but failed to load, use placeholder
    if (avatarError) {
      return placeholderImg;
    }
    // Use the actual avatar
    return avatarUrl;
  };

  const shouldUseErrorHandling = hasValidAvatar && !avatarError;

  useEffect(() => {
    if (!authUser) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", authUser.uid),
      where("read", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });

    return () => unsub();
  }, [authUser]);

  return (
    <div className="container">
      <div className="logo-container">
        <img src={Logo} alt="Meowgram Logo" />
      </div>
      <div className="items-container">
        <ul>
          <li>
            <Link to="/">
              <FaHome className="menu-icon" />
              <span className="menu-label">Home</span>
            </Link>
          </li>
          <li>
            <Link to="/search">
              <FaSearch className="menu-icon" />
              <span className="menu-label">Search</span>
            </Link>
          </li>
          <li>
            {authUser ? (
              <Link to={profileLink} className="profile-link-with-avatar">
                <img
                  src={getDisplayAvatar()}
                  alt="User Avatar"
                  className="profile-avatar-thumbnail"
                  onError={
                    shouldUseErrorHandling ? handleAvatarError : undefined
                  }
                  onLoad={shouldUseErrorHandling ? handleAvatarLoad : undefined}
                  key={hasValidAvatar ? avatarUrl : "placeholder-static"}
                />
                <span className="menu-label">Profile</span>
              </Link>
            ) : (
              <Link to="/login" className="profile-link-with-avatar">
                <img
                  src={placeholderImg}
                  alt="Placeholder"
                  className="profile-avatar-thumbnail"
                />
                <span className="menu-label">Profile</span>
              </Link>
            )}
          </li>
          <li>
            <Link to="/notifications" className="notifications-link">
              <FaBell className="menu-icon" />
              <span className="menu-label">Notifications</span>
              {unreadCount > 0 && location.pathname !== "/notifications" && (
                <span className="notif-badge">{unreadCount}</span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/addpost">
              <FaPlusSquare className="menu-icon" />
              <span className="menu-label">Add Post</span>
            </Link>
          </li>
          <li>
            <Link to="/settings">
              <FaCog className="menu-icon" />
              <span className="menu-label">Settings</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

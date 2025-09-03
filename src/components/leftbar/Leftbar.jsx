import "./leftbar.scss";
import Logo from "../../assets/logoo.webp";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

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
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);

  const profileLink = authUser ? `/profile/${authUser.uid}` : "/login";
  const avatarToDisplay = userDoc?.avatarUrl || authUser?.photoURL || Logo;

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
                  src={avatarToDisplay}
                  alt="User Avatar"
                  className="profile-avatar-thumbnail"
                />
                <span className="menu-label">Profile</span>
              </Link>
            ) : (
              <Link to="/login" className="profile-link-with-avatar">
                <img
                  src={Logo}
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

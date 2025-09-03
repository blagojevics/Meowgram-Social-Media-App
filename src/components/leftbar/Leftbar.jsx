import "./leftbar.scss";
import Logo from "../../assets/logoo.webp";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="container">
      <div className="logo-container">
        <img src={Logo} alt="Meowgram Logo" />
      </div>
      <div className="items-container">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/search">Search</Link>
          </li>
          <li>
            {authUser ? (
              <Link to={profileLink} className="profile-link-with-avatar">
                <img
                  src={avatarToDisplay}
                  alt="User Avatar"
                  className="profile-avatar-thumbnail"
                />
                Profile
              </Link>
            ) : (
              <Link to="/login" className="profile-link-with-avatar">
                <img
                  src={Logo}
                  alt="Placeholder"
                  className="profile-avatar-thumbnail"
                />
                Profile
              </Link>
            )}
          </li>
          <li>
            <Link to="/notifications" className="notifications-link">
              Notifications
              {unreadCount > 0 && location.pathname !== "/notifications" && (
                <span className="notif-badge">{unreadCount}</span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/addpost">Add Post</Link>
          </li>
          <li>
            <Link to="/settings">Settings</Link>
          </li>
          <li>
            <button onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
    </div>
  );
}

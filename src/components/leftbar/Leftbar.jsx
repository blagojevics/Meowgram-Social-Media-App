import "./leftbar.scss";
import Logo from "../../assets/logoo.webp";
import { Link } from "react-router-dom";

export default function Leftbar({ currentUser }) {
  const profileLink = currentUser ? `/profile/${currentUser.uid}` : "/login";
  const avatarToDisplay =
    currentUser && currentUser.avatarUrl ? currentUser.avatarUrl : Logo;

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
            {currentUser ? (
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
            <Link to="/addpost">Add Post</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

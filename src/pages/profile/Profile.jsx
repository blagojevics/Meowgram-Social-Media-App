import "./profile.scss";
import storyImg from "../../assets/story.png";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";

export default function Profile({ currentUser }) {
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorPosts, setErrorPosts] = useState(null);

  const { id: userId } = useParams();
  const isOwnProfile = currentUser && currentUser.uid === userId;

  useEffect(() => {
    const fetchUserProfileDetails = async () => {
      setLoadingProfile(true);
      setErrorProfile(null);

      if (!userId) {
        setErrorProfile("User ID not found in URL.");
        setLoadingProfile(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setProfileData(userDocSnap.data());
        } else {
          setErrorProfile("User Profile not found.");
        }
      } catch (err) {
        console.error("Error fetching profile details: ", err);
        setErrorProfile("Failed to load user profile");
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchUserPosts = async () => {
      setLoadingPosts(true);
      setErrorPosts(null);

      if (!userId) {
        setLoadingPosts(false);
        return;
      }

      try {
        const postsCollectionRef = collection(db, "posts");
        const q = query(
          postsCollectionRef,
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const postsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProfilePosts(postsArray);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setErrorPosts("Failed to load posts.");
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchUserProfileDetails();
    fetchUserPosts();
  }, [userId]);

  if (loadingProfile || loadingPosts) {
    return <div className="loading-message">Loading profile...</div>;
  }
  if (errorProfile) {
    return <div className="error-message">Error: {errorProfile}</div>;
  }

  if (!profileData) {
    return <div className="no-profile-found">Profile not found.</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <img
            src={profileData.avatarUrl || storyImg}
            alt="User Avatar"
            className="profile-avatar"
          />
        </div>

        <div className="profile-info-container">
          <div className="profile-username-actions">
            <span className="profile-username">
              {profileData.username || "No Username"}
            </span>
            {isOwnProfile ? (
              <button className="edit-profile-button">Edit Profile</button>
            ) : (
              <button className="follow-button">Follow</button>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{profileData.postsCount || 0}</span>
              <span className="stat-label">posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {profileData.followersCount || 0}
              </span>
              <span className="stat-label">followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {profileData.followingCount || 0}
              </span>
              <span className="stat-label">following</span>
            </div>
          </div>

          <div className="profile-bio">
            {profileData.bio &&
              profileData.bio
                .split("\n")
                .map((line, index) => <p key={index}>{line}</p>)}
          </div>

          <div className="followed-by">
            Followed by <span className="mutual-users"></span>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <div className="tab-item active">
          <svg
            aria-label=""
            color="#ffffff"
            fill="#ffffff"
            height="12"
            role="img"
            viewBox="0 0 24 24"
            width="12"
          >
            <path d="M1 0H0V24H24V1H1ZM23 23H1V1H23ZM6.5 16.5C7.328 16.5 8 15.828 8 15S7.328 13.5 6.5 13.5C5.672 13.5 5 14.172 5 15S5.672 16.5 6.5 16.5ZM17.5 7.5C16.672 7.5 16 8.172 16 9S16.672 10.5 17.5 10.5C18.328 10.5 19 9.828 19 9S18.328 7.5 17.5 7.5Z"></path>
          </svg>
          <span className="tab-label">POSTS</span>
        </div>
      </div>

      <div className="profile-posts-grid">
        {loadingPosts ? (
          <div className="loading-posts">Loading posts...</div>
        ) : errorPosts ? (
          <div className="error-posts">Error loading posts: {errorPosts}</div>
        ) : profilePosts.length === 0 ? (
          <div className="no-posts-message">No posts to display yet.</div>
        ) : (
          profilePosts.map((post) => (
            <div key={post.id} className="post-grid-item">
              <img
                src={post.imageUrl}
                alt={post.caption || `Post by ${profileData.username}`}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

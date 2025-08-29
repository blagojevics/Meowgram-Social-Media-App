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
  addDoc,
  deleteDoc,
  setDoc,
  increment,
  serverTimestamp,
  updateDoc, // <<< ADDED THIS IMPORT
} from "firebase/firestore";
import { db } from "../../config/firebase";
import Post from "../../components/post/Post";

export default function Profile({ currentUser }) {
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorPosts, setErrorPosts] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  const { id: userId } = useParams();
  const isOwnProfile = currentUser && currentUser.uid === userId;

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

  const checkFollowStatus = async () => {
    if (!currentUser || isOwnProfile) {
      setIsFollowing(false);
      return;
    }

    try {
      const followsCollectionRef = collection(db, "followers");
      const q = query(
        followsCollectionRef,
        where("followerId", "==", currentUser.uid),
        where("followingId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      setIsFollowing(!querySnapshot.empty);
    } catch (err) {
      console.error("Error checking follow status:", err);
    }
  };

  useEffect(() => {
    fetchUserProfileDetails();
    fetchUserPosts();
    checkFollowStatus();
  }, [userId, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      console.error("User must be logged in to follow.");
      return;
    }
    if (isOwnProfile) {
      console.error("Cannot follow/unfollow yourself.");
      return;
    }

    setLoadingFollow(true);
    try {
      const followerDocRef = doc(db, "users", currentUser.uid);
      const followingDocRef = doc(db, "users", userId);
      const followDocId = `${currentUser.uid}_${userId}`;

      if (isFollowing) {
        await deleteDoc(doc(db, "followers", followDocId));
        await updateDoc(followerDocRef, { followingCount: increment(-1) });
        await updateDoc(followingDocRef, { followersCount: increment(-1) });
        setIsFollowing(false);
        setProfileData((prev) => ({
          ...prev,
          followersCount: (prev.followersCount || 0) - 1,
        }));
      } else {
        await setDoc(doc(db, "followers", followDocId), {
          followerId: currentUser.uid,
          followingId: userId,
          timestamp: serverTimestamp(),
        });
        await updateDoc(followerDocRef, { followingCount: increment(1) });
        await updateDoc(followingDocRef, { followersCount: increment(1) });
        setIsFollowing(true);
        setProfileData((prev) => ({
          ...prev,
          followersCount: (prev.followersCount || 0) + 1,
        }));
      }
    } catch (err) {
      console.error("Error following/unfollowing:", err);
    } finally {
      setLoadingFollow(false);
    }
  };

  const handlePostActionComplete = (actionDetails) => {
    if (actionDetails.type === "delete") {
      setProfilePosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== actionDetails.postId)
      );
      setProfileData((prev) => ({
        ...prev,
        postsCount: (prev.postsCount || 0) - 1,
      }));
    } else if (actionDetails.type === "edit") {
      setProfilePosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === actionDetails.postId
            ? { ...post, caption: actionDetails.newCaption }
            : post
        )
      );
    }
  };

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
              {profileData.username || profileData.displayName || "No Username"}
            </span>
            {isOwnProfile ? (
              <button className="edit-profile-button">Edit Profile</button>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={loadingFollow}
                className="follow-button"
              >
                {loadingFollow
                  ? "Loading..."
                  : isFollowing
                  ? "Following"
                  : "Follow"}
              </button>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{profilePosts.length || 0}</span>
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
            <Post
              key={post.id}
              post={post}
              currentUser={currentUser}
              onPostActionComplete={handlePostActionComplete}
            />
          ))
        )}
      </div>
    </div>
  );
}

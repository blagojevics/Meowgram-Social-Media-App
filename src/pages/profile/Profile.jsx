import "./profile.scss";
import storyImg from "../../assets/story.png";
import { useState, useEffect } from "react";
import EditProfile from "../../components/editProfile/EditProfile";
import { useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
  deleteDoc,
  setDoc,
  increment,
  serverTimestamp,
  updateDoc,
  addDoc,
  onSnapshot,
  getDoc,
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null); // for modal

  const { id: userId } = useParams();
  const isOwnProfile = currentUser && currentUser.uid === userId;

  // Real-time profile listener
  useEffect(() => {
    if (!userId) return;
    setLoadingProfile(true);
    const userDocRef = doc(db, "users", userId);
    const unsub = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          setProfileData(snap.data());
          setErrorProfile(null);
        } else {
          setErrorProfile("User Profile not found.");
        }
        setLoadingProfile(false);
      },
      () => {
        setErrorProfile("Failed to load user profile");
        setLoadingProfile(false);
      }
    );
    return () => unsub();
  }, [userId]);

  // Fetch posts once
  const fetchUserPosts = async () => {
    setLoadingPosts(true);
    setErrorPosts(null);
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
      setErrorPosts("Failed to load posts.");
    } finally {
      setLoadingPosts(false);
    }
  };

  // Check follow status
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
    } catch (err) {}
  };

  useEffect(() => {
    fetchUserPosts();
    checkFollowStatus();
  }, [userId, currentUser]);

  // Follow/unfollow toggle
  const handleFollowToggle = async () => {
    if (!currentUser || isOwnProfile || loadingFollow) return;
    setLoadingFollow(true);

    const followerDocRef = doc(db, "users", currentUser.uid);
    const followingDocRef = doc(db, "users", userId);
    const followDocId = `${currentUser.uid}_${userId}`;
    const followDocRef = doc(db, "followers", followDocId);

    try {
      const followDocSnap = await getDoc(followDocRef);

      if (followDocSnap.exists()) {
        // Unfollow
        await deleteDoc(followDocRef);
        await updateDoc(followerDocRef, { followingCount: increment(-1) });
        await updateDoc(followingDocRef, { followersCount: increment(-1) });
        setIsFollowing(false);
      } else {
        // Follow
        await setDoc(followDocRef, {
          followerId: currentUser.uid,
          followingId: userId,
          timestamp: serverTimestamp(),
        });
        await updateDoc(followerDocRef, { followingCount: increment(1) });
        await updateDoc(followingDocRef, { followersCount: increment(1) });
        setIsFollowing(true);

        // Create follow notification
        if (userId !== currentUser.uid) {
          await addDoc(collection(db, "notifications"), {
            userId: userId,
            fromUserId: currentUser.uid,
            type: "follow",
            createdAt: serverTimestamp(),
            read: false,
          });
        }
      }
    } catch (err) {
      console.error("Follow/unfollow error:", err);
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
              {profileData.username || "No Username"}
            </span>
            <span className="profile-displayname">
              {profileData.displayName || ""}
            </span>
            {isOwnProfile ? (
              <>
                <button
                  className="edit-profile-button"
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Profile
                </button>
                {showEditModal && (
                  <EditProfile
                    currentUser={currentUser}
                    onClose={() => setShowEditModal(false)}
                  />
                )}
              </>
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
        </div>
      </div>
      <div className="profile-tabs">
        <div className="tab-item active">
          <span className="tab-label">POSTS</span>
        </div>
      </div>

      {/* --- Instagram-style grid --- */}
      <div className="profile-posts-grid">
        {loadingPosts ? (
          <div className="loading-posts">Loading posts...</div>
        ) : errorPosts ? (
          <div className="error-posts">Error loading posts: {errorPosts}</div>
        ) : profilePosts.length === 0 ? (
          <div className="no-posts-message">No posts to display yet.</div>
        ) : (
          profilePosts.map((post) => (
            <div
              key={post.id}
              className="post-grid-item"
              onClick={() => setSelectedPost(post)}
            >
              <img src={post.imageUrl} alt={post.caption || "Post"} />
            </div>
          ))
        )}
      </div>

      {/* --- Modal with full Post --- */}
      {selectedPost && (
        <div className="post-modal">
          <div className="post-modal-content">
            <button className="close-btn" onClick={() => setSelectedPost(null)}>
              X
            </button>
            <Post
              post={selectedPost}
              currentUser={currentUser}
              onPostActionComplete={handlePostActionComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
}

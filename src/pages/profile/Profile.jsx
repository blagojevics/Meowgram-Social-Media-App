import "./profile.scss";
import placeholderImg from "../../assets/placeholderImg.jpg";
import { FaPaw, FaComment } from "react-icons/fa";
import { useState, useEffect } from "react";
import EditProfile from "../../components/editProfile/EditProfile";
import { useParams } from "react-router-dom";
import formatTimeAgo from "../../config/timeFormat";
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
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import CommentList from "../../components/comment-list/CommentList";
import CommentInput from "../../components/comment-input/CommentInput";
import DropdownMenu from "../../components/dropdownmenu/DropdownMenu";
import FollowListModal from "../../components/followlistmodal/FollowListModal";
import LikesListModal from "../../components/likeslistmodal/LikesListModal";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { authUser, userDoc } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorPosts, setErrorPosts] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [postUserData, setPostUserData] = useState(null);
  const [showLikesModal, setShowLikesModal] = useState(false);

  const { id: userId } = useParams();
  const isOwnProfile = authUser && authUser.uid === userId;

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

  useEffect(() => {
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
        const postsArray = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt || { toDate: () => new Date(0) },
          };
        });
        setProfilePosts(postsArray);
      } catch (err) {
        setErrorPosts("Failed to load posts.");
      } finally {
        setLoadingPosts(false);
      }
    };
    if (userId) fetchUserPosts();
  }, [userId]);

  useEffect(() => {
    if (!authUser || isOwnProfile) {
      setIsFollowing(false);
      return;
    }
    const followDocRef = doc(db, "users", authUser.uid, "following", userId);
    const unsub = onSnapshot(followDocRef, (snap) => {
      setIsFollowing(snap.exists());
    });
    return () => unsub();
  }, [authUser, userId, isOwnProfile]);

  useEffect(() => {
    if (!selectedPost) return;
    const unsubPost = onSnapshot(doc(db, "posts", selectedPost.id), (snap) => {
      if (snap.exists()) {
        setSelectedPost({ id: snap.id, ...snap.data() });
      }
    });
    const unsubUser = onSnapshot(
      doc(db, "users", selectedPost.userId),
      (snap) => {
        if (snap.exists()) {
          setPostUserData(snap.data());
        }
      }
    );
    return () => {
      unsubPost();
      unsubUser();
    };
  }, [selectedPost]);

  const handleFollowToggle = async () => {
    if (!authUser || isOwnProfile || loadingFollow) return;
    setLoadingFollow(true);
    const currentUserRef = doc(db, "users", authUser.uid);
    const targetUserRef = doc(db, "users", userId);
    const followingRef = doc(db, "users", authUser.uid, "following", userId);
    const followerRef = doc(db, "users", userId, "followers", authUser.uid);
    try {
      if (isFollowing) {
        await deleteDoc(followingRef);
        await deleteDoc(followerRef);
        await updateDoc(currentUserRef, { followingCount: increment(-1) });
        await updateDoc(targetUserRef, { followersCount: increment(-1) });
      } else {
        await setDoc(followingRef, {
          uid: userId,
          username: profileData.username,
          avatarUrl: profileData.avatarUrl,
          followedAt: new Date(),
        });
        await setDoc(followerRef, {
          uid: authUser.uid,
          username: userDoc?.username,
          avatarUrl: userDoc?.avatarUrl,
          followedAt: new Date(),
        });
        await updateDoc(currentUserRef, { followingCount: increment(1) });
        await updateDoc(targetUserRef, { followersCount: increment(1) });
        if (userId !== authUser.uid) {
          await addDoc(collection(db, "notifications"), {
            userId: userId,
            fromUserId: authUser.uid,
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

  const handleLikeToggle = async (post) => {
    if (!authUser) return;
    const postRef = doc(db, "posts", post.id);
    const alreadyLiked = post.likedByUsers?.includes(authUser.uid);
    try {
      if (alreadyLiked) {
        await updateDoc(postRef, {
          likedByUsers: arrayRemove(authUser.uid),
          likesCount: increment(-1),
        });
      } else {
        await updateDoc(postRef, {
          likedByUsers: arrayUnion(authUser.uid),
          likesCount: increment(1),
        });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
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
    <>
      <div className="profile-page">
        <div className="profile-header">
          <div className="profile-avatar-container">
            <img
              src={profileData.avatarUrl || placeholderImg}
              alt="User Avatar"
              className="profile-avatar"
            />
          </div>
          <div className="profile-info-container">
            <div className="profile-username-actions">
              <div className="profile-names">
                <span className="profile-username">
                  {profileData.username || "No Username"}
                </span>
                <span className="profile-displayname">
                  {profileData.displayName || ""}
                </span>
              </div>
              {isOwnProfile ? (
                <>
                  <div className="temp-div">
                    <button
                      className="edit-profile-button"
                      onClick={() => setShowEditModal(true)}
                    >
                      Edit Profile
                    </button>
                  </div>
                  {showEditModal && (
                    <EditProfile
                      currentUser={{ ...authUser, ...userDoc }}
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
              <div
                className="stat-item"
                onClick={() => setModalType("followers")}
              >
                <span className="stat-value">
                  {profileData.followersCount || 0}
                </span>
                <span className="stat-label">followers</span>
              </div>
              <div
                className="stat-item"
                onClick={() => setModalType("following")}
              >
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
      </div>

      {selectedPost && (
        <div
          className="lightbox-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("lightbox-overlay")) {
              setSelectedPost(null);
            }
          }}
        >
          <div className="lightbox-box">
            <button
              className="lightbox-close"
              onClick={() => setSelectedPost(null)}
            >
              ✕
            </button>
            <div className="lightbox-content">
              <div className="lightbox-photo">
                <img src={selectedPost.imageUrl} alt={selectedPost.caption} />
              </div>
              <div className="lightbox-details">
                <div className="lightbox-header">
                  <div className="lightbox-header-flex">
                    <img
                      src={postUserData?.avatarUrl || placeholderImg}
                      alt=""
                      className="lightbox-avatar"
                    />
                    <div className="lightbox-userinfo">
                      <span className="lightbox-username">
                        {postUserData?.username || "Unknown"}
                      </span>
                    </div>
                  </div>
                  {authUser?.uid === selectedPost.userId && (
                    <DropdownMenu
                      options={[
                        {
                          label: "Edit Description",
                          onClick: () => {
                            const newCaption = prompt(
                              "Edit your description:",
                              selectedPost.caption || ""
                            );
                            if (newCaption !== null) {
                              updateDoc(doc(db, "posts", selectedPost.id), {
                                caption: newCaption,
                              });
                              setSelectedPost((prev) => ({
                                ...prev,
                                caption: newCaption,
                              }));
                            }
                          },
                        },
                        {
                          label: "Delete Post",
                          onClick: async () => {
                            try {
                              await deleteDoc(
                                doc(db, "posts", selectedPost.id)
                              );
                              setSelectedPost(null);
                              setProfilePosts((prev) =>
                                prev.filter((p) => p.id !== selectedPost.id)
                              );
                            } catch (err) {
                              console.error("Failed to delete post:", err);
                            }
                          },
                        },
                      ]}
                    />
                  )}
                </div>
                <div className="lightbox-helper-div">
                  <div className="lightbox-stats">
                    <span
                      className="likes"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeToggle(selectedPost);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <FaPaw
                        style={{
                          color: selectedPost.likedByUsers?.includes(
                            authUser?.uid
                          )
                            ? "#e63946"
                            : "gray",
                        }}
                      />{" "}
                      {selectedPost.likesCount || 0}
                    </span>
                    <span
                      className="likes-list"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLikesModal(true);
                      }}
                    >
                      Paws
                    </span>
                    <span className="comments">
                      <FaComment style={{ color: "#555" }} />{" "}
                      {selectedPost.commentsCount || 0}
                    </span>
                  </div>
                  <div className="lightbox-time">
                    {selectedPost.createdAt?.toDate
                      ? `· ${formatTimeAgo(selectedPost.createdAt.toDate())}`
                      : ""}
                  </div>
                </div>
                <div className="lightbox-caption">{selectedPost.caption}</div>
                <div className="lightbox-comments">
                  <CommentList
                    postId={selectedPost.id}
                    currentUser={{ ...authUser, ...userDoc }}
                    isPostOwner={selectedPost.userId === authUser.uid}
                    onClose={() => setSelectedPost(null)}
                  />
                </div>
                <CommentInput
                  postId={selectedPost.id}
                  currentUser={{ ...authUser, ...userDoc }}
                  post={selectedPost}
                />
              </div>
            </div>
          </div>
          {showLikesModal && (
            <LikesListModal
              isOpen={showLikesModal}
              onClose={() => setShowLikesModal(false)}
              likedByUsers={selectedPost?.likedByUsers || []}
            />
          )}
        </div>
      )}

      {modalType && (
        <FollowListModal
          userId={userId}
          type={modalType}
          onClose={() => setModalType(null)}
        />
      )}
    </>
  );
}

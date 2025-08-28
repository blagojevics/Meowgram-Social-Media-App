import { useEffect, useState } from "react";
import "./addpost.scss";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Ensure addDoc, serverTimestamp are imported
import { db } from "../../config/firebase";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "../../config/cloudinary";

export default function AddPost({ currentUser }) {
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleCaptionChange = (e) => {
    setCaption(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    // --- Frontend Input Validation ---
    if (!imageFile && caption.trim() === "") {
      setError("Please add an image or write a caption.");
      setLoading(false);
      return;
    }
    if (!currentUser || !currentUser.uid) {
      setError("Authentication error: No user ID found.");
      setLoading(false);
      return;
    }
    // Also validate if currentUser has necessary info for the post (username, avatar)
    if (!currentUser.username && !currentUser.displayName) {
      setError("User profile incomplete: missing username.");
      setLoading(false);
      return;
    }

    let imageUrl = "";

    try {
      // --- Cloudinary Image Upload (if an image is selected) ---
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error.message ||
              `Cloudinary upload failed with status ${response.status}`
          );
        }
        const data = await response.json();
        imageUrl = data.secure_url;
      }

      // --- Save Post Data to Firestore ---
      const postsCollectionRef = collection(db, "posts");

      await addDoc(postsCollectionRef, {
        userId: currentUser.uid, // CORRECT: this is what Profile.jsx expects for the link
        username:
          currentUser.username || currentUser.displayName || "Unknown User", // CORRECTED: ensure we get a displayable name
        userAvatar: currentUser.avatarUrl || "https://via.placeholder.com/50", // CORRECTED: ensure an avatar URL
        caption: caption, // CORRECT: this matches the state and Post.jsx
        imageUrl: imageUrl, // CORRECT: this matches the state and Post.jsx
        createdAt: serverTimestamp(), // CORRECT: Firestore Timestamp
        likesCount: 0,
        commentsCount: 0,
      });

      // --- Success: Redirect User ---
      navigate("/");
    } catch (err) {
      console.error("Failed to add post:", err);
      setError(err.message || "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="add-post-page">
      <h1>Create New Post</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="image-upload">Upload Image:</label>
        <input
          type="file"
          id="image-upload"
          onChange={handleFileChange}
          accept="image/*"
        />
        <label htmlFor="post-caption">Caption:</label> {/* Corrected label */}
        <textarea
          value={caption}
          id="post-caption"
          onChange={handleCaptionChange}
          rows={4}
          placeholder="Write a caption for your pet's moment..."
        ></textarea>
        {loading && <p>Posting...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Add Post"}
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import "./addpost.scss";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "../../config/cloudinary";
import { useAuth } from "../../context/AuthContext";

export default function AddPost() {
  const { authUser, userDoc } = useAuth();
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    }
  }, [authUser, navigate]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    if (!imageFile && caption.trim() === "") {
      setError("Please add an image or write a caption.");
      setLoading(false);
      return;
    }
    if (!authUser || !authUser.uid) {
      setError("Authentication error: No user ID found.");
      setLoading(false);
      return;
    }

    let imageUrl = "";

    try {
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

      const postsCollectionRef = collection(db, "posts");

      await addDoc(postsCollectionRef, {
        userId: authUser.uid,
        username: userDoc?.username || authUser.displayName || "Unknown User",
        userAvatar:
          userDoc?.avatarUrl ||
          authUser.photoURL ||
          "https://via.placeholder.com/50",
        caption: caption,
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        likedByUsers: [],
      });

      navigate("/");
    } catch (err) {
      console.error("Failed to add post:", err);
      setError(err.message || "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!authUser || !userDoc) {
    return <div>Loading user...</div>;
  }

  return (
    <div className="add-post-page">
      <h1>Create New Post</h1>
      <form onSubmit={handleSubmit} className="add-post-form">
        <label htmlFor="image-upload">Upload Image:</label>
        <input
          type="file"
          id="image-upload"
          onChange={handleFileChange}
          accept="image/*"
        />

        {previewUrl && (
          <div className="image-preview-container">
            <img src={previewUrl} alt="Preview" className="image-preview" />
            <button
              type="button"
              className="clear-image-btn"
              onClick={handleClearImage}
            >
              ✕
            </button>
          </div>
        )}

        <label htmlFor="post-caption">Caption:</label>
        <textarea
          value={caption}
          id="post-caption"
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          placeholder="Write a caption for your pet's moment..."
        ></textarea>

        {loading && <p>Posting...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        <button
          type="submit"
          disabled={loading || (!imageFile && caption.trim() === "")}
        >
          {loading ? "Posting..." : "Add Post"}
        </button>
      </form>
    </div>
  );
}

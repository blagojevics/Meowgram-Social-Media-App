import { useEffect, useState } from "react";
import "./addpost.scss";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "../../../config/cloudinary";
import { useAuth } from "../../hooks/useAuth";
import {
  uploadWithModeration,
  getModerationMessage,
  checkAnimalContent,
} from "../../services/imageModeration";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import {
  moderateImageWithAI,
  preloadAIModeration,
} from "../../services/aiModeration";

export default function AddPost() {
  const { authUser, userDoc } = useAuth();
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moderationMessage, setModerationMessage] = useState("");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    }

    // Preload AI moderation model in background
    preloadAIModeration().then((success) => {
      if (success) {
        console.log("🤖 AI moderation ready!");
      }
    });
  }, [authUser, navigate]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      // Quick keyword-based check first
      const animalCheck = checkAnimalContent(file.name, caption);
      setModerationMessage(getModerationMessage(animalCheck));

      // Run AI analysis in background
      setAiAnalyzing(true);
      try {
        const aiResult = await moderateImageWithAI(file, caption);
        setModerationMessage(
          aiResult.isAllowed
            ? `🤖 AI Analysis: ${aiResult.reason}`
            : `🚫 AI Detected: ${aiResult.reason}`
        );

        // Store AI result for use in submit
        setImageFile((prev) => {
          if (prev) {
            prev.aiModerationResult = aiResult;
          }
          return prev;
        });
      } catch (error) {
        console.error("AI analysis failed:", error);
        setModerationMessage("⚠️ AI analysis unavailable, using basic checks");
      } finally {
        setAiAnalyzing(false);
      }
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setModerationMessage("");
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
        // Check AI moderation result first
        if (
          imageFile.aiModerationResult &&
          !imageFile.aiModerationResult.isAllowed
        ) {
          setError(`AI Moderation: ${imageFile.aiModerationResult.reason}`);
          setLoading(false);
          return;
        }

        // Check environment variables first
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
          throw new Error(
            "Cloudinary configuration missing. Please check environment variables."
          );
        }

        // Direct Cloudinary upload with better error handling
        console.log("🚀 Starting Cloudinary upload...");
        console.log("Cloud name:", CLOUDINARY_CLOUD_NAME);
        console.log("Upload preset:", CLOUDINARY_UPLOAD_PRESET);
        console.log("File size:", imageFile.size, "bytes");
        console.log("File type:", imageFile.type);

        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        // Add file size check (max 10MB)
        if (imageFile.size > 10 * 1024 * 1024) {
          throw new Error(
            "File too large. Please choose an image smaller than 10MB."
          );
        }

        // Verify file type
        if (!imageFile.type.startsWith("image/")) {
          throw new Error("Please select a valid image file.");
        }

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        console.log("Upload response status:", response.status);
        console.log("Upload response headers:", response.headers);

        let uploadResult;

        if (!response.ok) {
          let errorMessage;
          try {
            const errorData = await response.json();
            console.error("Cloudinary error JSON:", errorData);
            errorMessage =
              errorData.error?.message ||
              `HTTP ${response.status}: ${response.statusText}`;
          } catch (e) {
            const errorText = await response.text();
            console.error("Cloudinary error text:", errorText);
            errorMessage = `HTTP ${response.status}: ${
              errorText || response.statusText
            }`;
          }
          throw new Error(`Upload failed: ${errorMessage}`);
        }

        try {
          uploadResult = await response.json();
          console.log("Upload successful:", uploadResult);
        } catch (e) {
          console.error("Failed to parse upload response:", e);
          throw new Error("Invalid response from upload service");
        }

        if (!uploadResult.secure_url) {
          console.error("No secure_url in response:", uploadResult);
          throw new Error("Upload completed but no URL received");
        }

        imageUrl = uploadResult.secure_url;
        setModerationMessage("🎉 Upload successful! Welcome to Meowgram!");
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
    return <LoadingSpinner text="Loading user data..." size="large" />;
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
          placeholder="Share your pet's story... 🐱 (AI helps detect animals from mice to giraffes!)"
        ></textarea>

        {(moderationMessage || aiAnalyzing) && (
          <div
            className={`moderation-message ${
              moderationMessage.includes("🎉") ||
              moderationMessage.includes("✅") ||
              moderationMessage.includes("🤖")
                ? "success"
                : moderationMessage.includes("🚫")
                ? "error"
                : "info"
            }`}
          >
            {aiAnalyzing ? "🤖 AI analyzing image..." : moderationMessage}
          </div>
        )}

        {loading && (
          <LoadingSpinner text="Publishing your post..." size="medium" />
        )}
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

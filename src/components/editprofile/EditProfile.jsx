import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "../../../config/cloudinary";
import { moderateImageWithAI } from "../../services/aiModeration";
import "./editProfile.scss";

export default function EditProfile({ currentUser, onClose }) {
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || ""
  );
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moderationMessage, setModerationMessage] = useState("");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // ✅ Upload new avatar to Cloudinary with AI moderation
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setModerationMessage("");
    setAiAnalyzing(true);

    try {
      // Step 1: AI moderation check
      console.log("🤖 Running AI moderation for avatar...");
      const aiResult = await moderateImageWithAI(file, "avatar upload");

      if (!aiResult.isAllowed) {
        setError(`🚫 Upload blocked: ${aiResult.reason}`);
        setModerationMessage(`AI detected inappropriate content`);
        setAiAnalyzing(false);
        return;
      }

      setModerationMessage("🤖 AI approved! Uploading to Cloudinary...");

      // Step 2: Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.secure_url) {
        setAvatarUrl(data.secure_url);
        setModerationMessage("✅ Avatar uploaded successfully!");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setError("Failed to upload avatar. Try again.");
      setModerationMessage("");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleDeleteAvatar = () => {
    setAvatarUrl(""); // clear avatar
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        displayName,
        username,
        bio,
        avatarUrl: avatarUrl || "", // if deleted, reset to empty
      });
      onClose();
    } catch (err) {
      setError("Failed to update profile. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-modal">
      <div className="modal-content">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSave}>
          <label>
            Display Name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>

          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="3"
              placeholder="Write something about yourself..."
            />
          </label>

          <label>
            Avatar
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {aiAnalyzing && (
              <p className="moderation-info">🤖 AI analyzing image...</p>
            )}
            {moderationMessage && (
              <p
                className={`moderation-info ${
                  moderationMessage.includes("🚫") ? "error" : "success"
                }`}
              >
                {moderationMessage}
              </p>
            )}
          </label>

          {avatarUrl && (
            <div className="avatar-preview">
              <img src={avatarUrl} alt="Avatar Preview" />
              <button
                type="button"
                className="delete-avatar-btn"
                onClick={handleDeleteAvatar}
              >
                Remove Avatar
              </button>
            </div>
          )}

          {error && <p className="error">{error}</p>}

          <div className="buttons">
            <button type="button" onClick={onClose} className="cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

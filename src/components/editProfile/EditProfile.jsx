import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "../../config/cloudinary";
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      setAvatarUrl(data.secure_url);
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      setError("Failed to upload avatar. Try again.");
    }
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
        avatarUrl,
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
            />
          </label>

          <label>
            Avatar
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          {avatarUrl && (
            <div className="avatar-preview">
              <img src={avatarUrl} alt="Avatar Preview" />
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

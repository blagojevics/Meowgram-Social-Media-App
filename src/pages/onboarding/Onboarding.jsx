import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../../config/firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "../../../config/cloudinary";
import { moderateImageWithAI } from "../../services/aiModeration";

export default function Onboarding() {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [moderationMessage, setModerationMessage] = useState("");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setErr(null);
    setModerationMessage("");
    setAiAnalyzing(true);

    try {
      // Quick AI moderation check
      const aiResult = await moderateImageWithAI(file, "profile avatar");

      if (!aiResult.isAllowed) {
        setModerationMessage(`🚫 ${aiResult.reason}`);
        setAvatarFile(null); // Clear the file
      } else {
        setModerationMessage("🤖 AI approved! Ready to upload.");
      }
    } catch (error) {
      console.error("AI moderation failed:", error);
      setModerationMessage(
        "⚠️ AI analysis unavailable, upload at your own risk"
      );
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleBioChange = (e) => {
    setBio(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    if (!currentUser) {
      setErr("Authentication error: No user logged in.");
      setLoading(false);
      return;
    }

    try {
      let avatarUrl = "";

      if (avatarFile) {
        // Double-check AI moderation before upload
        const aiResult = await moderateImageWithAI(
          avatarFile,
          "profile avatar"
        );
        if (!aiResult.isAllowed) {
          throw new Error(`Upload blocked: ${aiResult.reason}`);
        }

        const formData = new FormData();
        formData.append("file", avatarFile);
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
          const errorText = await response.text();
          throw new Error(
            `Cloudinary upload failed: ${response.statusText} - ${errorText}`
          );
        }

        const data = await response.json();
        avatarUrl = data.secure_url;
      }

      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userDocRef,
        {
          username: currentUser.displayName || "",
          email: currentUser.email,
          bio: bio,
          avatarUrl: avatarUrl,
          onboardingComplete: true,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigate("/");
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Complete Your Profile!</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="avatar-upload">Upload Avatar:</label>
        <input
          type="file"
          id="avatar-upload"
          onChange={handleFileChange}
          accept="image/*"
        />
        {aiAnalyzing && <p>🤖 AI analyzing image...</p>}
        {moderationMessage && (
          <p
            style={{
              color: moderationMessage.includes("🚫") ? "red" : "green",
              fontSize: "14px",
              margin: "5px 0",
            }}
          >
            {moderationMessage}
          </p>
        )}
        <label htmlFor="user-bio">Bio:</label>
        <textarea
          id="user-bio"
          value={bio}
          onChange={handleBioChange}
          rows="4"
          placeholder="Tell us about your pet!"
        ></textarea>
        {loading && <p>Uploading and Saving...</p>}
        {err && <p style={{ color: "red" }}>{err}</p>}
        <button type="submit" disabled={loading}>
          Save Profile
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../config/firebase";
import { updateDoc, doc } from "firebase/firestore";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "../../config/cloudinary";

export default function Onboarding() {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleFileChange = (e) => {
    setAvatarFile(e.target.files[0]);
    console.log("File selected in handleFileChange:", e.target.files[0]);
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

    console.log("handleSubmit triggered.");
    console.log("avatarFile state at handleSubmit start:", avatarFile);

    try {
      let avatarUrl = "";

      if (avatarFile) {
        console.log(
          "avatarFile is present. Proceeding with Cloudinary upload."
        );
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

        console.log("Cloudinary API Response object:", response);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Cloudinary failed response text:", errorText);
          throw new Error(
            `Cloudinary upload failed: ${response.statusText} - ${errorText}`
          );
        }

        const data = await response.json();
        console.log("Cloudinary API Response data (JSON):", data);
        avatarUrl = data.secure_url;
        console.log("Cloudinary upload successful. URL:", avatarUrl);
      } else {
        console.log(
          "avatarFile is NULL or UNDEFINED. Skipping Cloudinary upload."
        );
      }

      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        bio: bio,
        avatarUrl: avatarUrl,
      });
      console.log("Firestore update successful.");

      navigate("/");
      console.log("Navigation to home initiated.");
    } catch (error) {
      setErr(error.message);
      console.error("Profile setup failed:", error.message);
    } finally {
      setLoading(false);
      console.log("Loading set to false. Form submission complete.");
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

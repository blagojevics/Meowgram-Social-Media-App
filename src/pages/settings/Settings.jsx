import { useState } from "react";
import { auth, db, googleProvider } from "../../config/firebase";
import {
  signOut,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setStatus("Logged out successfully.");
      navigate("/login");
    } catch (err) {
      setStatus("Error logging out: " + err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth.currentUser?.email) {
      setStatus("No email found for this account.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      setStatus("Password reset email sent to " + auth.currentUser.email);
    } catch (err) {
      setStatus("Error sending reset email: " + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Try deleting directly
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      setStatus("Account deleted successfully.");
      navigate("/login");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setStatus("Re-authentication required...");

        try {
          if (user.providerData[0]?.providerId === "password") {
            // Email/Password re-auth
            const password = prompt("Please re-enter your password:");
            if (!password) {
              setStatus("Password required to delete account.");
              return;
            }
            const credential = EmailAuthProvider.credential(
              user.email,
              password
            );
            await reauthenticateWithCredential(user, credential);
          } else if (user.providerData[0]?.providerId === "google.com") {
            // Google re-auth
            await reauthenticateWithPopup(user, googleProvider);
          }

          // Retry deletion after re-auth
          await deleteDoc(doc(db, "users", user.uid));
          await deleteUser(user);
          setStatus("Account deleted successfully.");
          navigate("/login");
        } catch (reauthErr) {
          setStatus("Re-authentication failed: " + reauthErr.message);
        }
      } else {
        setStatus("Error deleting account: " + err.message);
      }
    }
  };

  return (
    <div className="settings-page">
      <h2>Account Settings</h2>

      <div className="settings-actions">
        <button onClick={handlePasswordReset}>Reset Password</button>
        <button onClick={handleLogout}>Log Out</button>
        <button
          onClick={handleDeleteAccount}
          style={{ color: "white", background: "red" }}
        >
          Delete Account
        </button>
      </div>

      {status && <p className="settings-status">{status}</p>}
    </div>
  );
}

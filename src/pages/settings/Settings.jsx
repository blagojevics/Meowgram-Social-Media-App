import { useState } from "react";
import { auth, db } from "../../config/firebase";
import { signOut, sendPasswordResetEmail, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";

export default function Settings() {
  const [status, setStatus] = useState("");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setStatus("Logged out successfully.");
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
    if (!auth.currentUser) return;
    try {
      // Delete Firestore user doc
      await deleteDoc(doc(db, "users", auth.currentUser.uid));
      // Delete Auth user
      await deleteUser(auth.currentUser);
      setStatus("Account deleted successfully.");
    } catch (err) {
      setStatus("Error deleting account: " + err.message);
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

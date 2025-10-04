import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { AuthContext } from "../contexts/AuthContext";
import { authAPI } from "../services/chat/api";

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(undefined); // undefined = still loading
  const [userDoc, setUserDoc] = useState(undefined);
  const [chatUser, setChatUser] = useState(null);
  const [chatToken, setChatToken] = useState(null);

  useEffect(() => {
    let unsubscribeDoc;

    // Listen for auth state changes - keep it simple!
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log(
        "🔐 Auth state changed:",
        user ? "User logged in" : "User logged out"
      );

      // Clean up previous Firestore listener
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (!user) {
        setAuthUser(null);
        setUserDoc(null);
        setChatUser(null);
        setChatToken(null);
        localStorage.removeItem("chatAuthToken");
        return;
      }

      // Set the authenticated user immediately
      setAuthUser(user);

      // Auto-login to MeowChat
      try {
        const firebaseToken = await user.getIdToken();
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          photoURL: user.photoURL,
        };
        const response = await authAPI.loginWithFirebase(
          firebaseToken,
          userData
        );
        console.log("MeowChat response:", response.data);
        if (response.data.token) {
          localStorage.setItem("chatAuthToken", response.data.token);
          const chatUserData = response.data.user || {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL,
          };
          setChatUser(chatUserData);
          setChatToken(response.data.token);
          console.log("✅ MeowChat login successful!", chatUserData);
        }
      } catch (error) {
        console.error("❌ MeowChat login failed:", error);
        setChatUser(null);
        setChatToken(null);
      }

      // Listen to Firestore user document
      try {
        const userDocRef = doc(db, "users", user.uid);
        unsubscribeDoc = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              setUserDoc(snap.data());
              console.log("📄 User document loaded successfully");
            } else {
              // User doc doesn't exist yet (new user), but keep them logged in
              console.warn("⚠️ User document not found - new user?");
              setUserDoc(null);
            }
          },
          (error) => {
            console.error("❌ Firestore listener error:", error);

            // Don't log out users for network errors - only for permission errors
            if (error.code === "permission-denied") {
              console.error("🚫 Permission denied - logging out user");
              auth.signOut();
            } else {
              // For network errors, keep user logged in but clear doc
              console.log("🌐 Network error - keeping user logged in");
              setUserDoc(null);
            }
          }
        );
      } catch (error) {
        console.error("❌ Error setting up Firestore listener:", error);
        // Don't log out user for setup errors
        setUserDoc(null);
      }
    });

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up auth listeners");
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []); // Empty dependency array - only run once

  // Debug logging
  useEffect(() => {
    if (authUser !== undefined) {
      console.log(
        "👤 Auth state:",
        authUser ? `User ${authUser.uid}` : "No user"
      );
    }
  }, [authUser]);

  useEffect(() => {
    if (userDoc !== undefined) {
      console.log(
        "📄 User doc state:",
        userDoc ? "Document loaded" : "No document"
      );
    }
  }, [userDoc]);

  return (
    <AuthContext.Provider value={{ authUser, userDoc, chatUser, chatToken }}>
      {children}
    </AuthContext.Provider>
  );
}

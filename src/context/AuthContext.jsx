import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { AuthContext } from "../contexts/AuthContext";

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(undefined); // undefined = still loading
  const [userDoc, setUserDoc] = useState(undefined);

  useEffect(() => {
    let unsubscribeDoc;

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log(
        "🔐 Auth state changed:",
        user ? "User logged in" : "User logged out"
      );

      if (unsubscribeDoc) unsubscribeDoc();

      if (!user) {
        setAuthUser(null);
        setUserDoc(null);
        return;
      }

      try {
        // Reload to get latest emailVerified and token
        await user.reload();
        setAuthUser(auth.currentUser);

        // Listen to Firestore user doc
        const ref = doc(db, "users", user.uid);
        unsubscribeDoc = onSnapshot(
          ref,
          (snap) => {
            if (snap.exists()) {
              setUserDoc(snap.data());
            } else {
              setUserDoc(null);
            }
          },
          (error) => {
            console.error("❌ Firestore listener error:", error);
            // Don't log out user on Firestore errors, just log the error
          }
        );
      } catch (error) {
        console.error("❌ Error reloading user:", error);
        setAuthUser(null);
        setUserDoc(null);
      }
    });

    // Also listen for token changes (handles token refresh)
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          // Get fresh token
          const token = await user.getIdToken(true);
          console.log("🔑 Token refreshed for user:", user.uid);
        } catch (error) {
          console.error("❌ Token refresh failed:", error);
          // If token refresh fails, the user might need to re-authenticate
        }
      }
    });

    // Set up periodic token refresh (every 50 minutes, tokens expire after 1 hour)
    const tokenRefreshInterval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await currentUser.getIdToken(true); // Force refresh
          console.log("🔄 Periodic token refresh completed");
        } catch (error) {
          console.error("❌ Periodic token refresh failed:", error);
        }
      }
    }, 50 * 60 * 1000); // 50 minutes

    // Refresh token when user returns to the tab
    const handleVisibilityChange = async () => {
      if (!document.hidden && auth.currentUser) {
        try {
          await auth.currentUser.getIdToken(true);
          console.log("🔄 Token refreshed on tab focus");
        } catch (error) {
          console.error("❌ Token refresh on focus failed:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
      clearInterval(tokenRefreshInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  // Log auth state for debugging
  useEffect(() => {
    if (authUser !== undefined) {
      console.log(
        "👤 Current auth user:",
        authUser ? `${authUser.uid} (${authUser.email})` : "None"
      );
    }
  }, [authUser]);

  return (
    <AuthContext.Provider value={{ authUser, userDoc }}>
      {children}
    </AuthContext.Provider>
  );
}

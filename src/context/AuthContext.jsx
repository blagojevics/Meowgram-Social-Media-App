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

    // Network status tracking
    const handleOnline = () => {
      console.log("🌐 Network reconnected");
      // Try to refresh token when back online
      if (auth.currentUser) {
        auth.currentUser
          .getIdToken(true)
          .catch((err) =>
            console.error("❌ Token refresh after reconnect failed:", err)
          );
      }
    };

    const handleOffline = () => {
      console.log("📵 Network disconnected");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

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

        // Listen to Firestore user doc with retry logic
        const ref = doc(db, "users", user.uid);
        unsubscribeDoc = onSnapshot(
          ref,
          (snap) => {
            if (snap.exists()) {
              setUserDoc(snap.data());
            } else {
              // User doc doesn't exist yet, keep auth but set userDoc to null
              console.warn("⚠️ User document not found, keeping auth session");
              setUserDoc(null);
            }
          },
          (error) => {
            console.error("❌ Firestore listener error:", error);
            // Keep user logged in even if Firestore fails
            // This prevents logouts due to temporary network issues
            if (error.code === "permission-denied") {
              console.error(
                "🚫 Permission denied - user may need to re-authenticate"
              );
              // Only log out on permission errors, not network errors
              setAuthUser(null);
              setUserDoc(null);
            }
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
          // Get fresh token silently
          const token = await user.getIdToken(false); // Don't force refresh here
          console.log("🔑 Token available for user:", user.uid);
        } catch (error) {
          console.error("❌ Token access failed:", error);
          // Don't log out user here - this could be temporary
        }
      }
    });

    // Set up periodic token refresh (every 45 minutes, tokens expire after 1 hour)
    const tokenRefreshInterval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          // Only refresh if user is still active and token is close to expiry
          const tokenResult = await currentUser.getIdTokenResult(false);
          const expirationTime = new Date(tokenResult.expirationTime);
          const now = new Date();
          const timeUntilExpiry = expirationTime.getTime() - now.getTime();

          // Only refresh if less than 15 minutes until expiry
          if (timeUntilExpiry < 15 * 60 * 1000) {
            await currentUser.getIdToken(true); // Force refresh
            console.log("🔄 Periodic token refresh completed");
          }
        } catch (error) {
          console.error("❌ Periodic token refresh failed:", error);
          // Don't log out user on refresh failure
        }
      }
    }, 45 * 60 * 1000); // 45 minutes

    // Refresh token when user returns to the tab (but don't be aggressive)
    const handleVisibilityChange = async () => {
      if (!document.hidden && auth.currentUser) {
        try {
          // Check if token needs refresh before forcing it
          const tokenResult = await auth.currentUser.getIdTokenResult(false);
          const expirationTime = new Date(tokenResult.expirationTime);
          const now = new Date();
          const timeUntilExpiry = expirationTime.getTime() - now.getTime();

          // Only refresh if less than 10 minutes until expiry
          if (timeUntilExpiry < 10 * 60 * 1000) {
            await auth.currentUser.getIdToken(true);
            console.log("🔄 Token refreshed on tab focus");
          }
        } catch (error) {
          console.error("❌ Token refresh on focus failed:", error);
          // Don't log out user on focus refresh failure
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
      clearInterval(tokenRefreshInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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

import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function AuthDebugger() {
  const { authUser, userDoc } = useAuth();

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        "🔍 Auth Debug - User:",
        authUser ? "Logged in" : "Not logged in"
      );
      console.log(
        "🔍 Auth Debug - UserDoc:",
        userDoc ? "Loaded" : "Not loaded"
      );

      if (authUser) {
        console.log("🔍 Auth Debug - UID:", authUser.uid);
        console.log("🔍 Auth Debug - Email:", authUser.email);
        console.log("🔍 Auth Debug - Email Verified:", authUser.emailVerified);
      }
    }
  }, [authUser, userDoc]);

  // Don't render anything in production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "8px",
        borderRadius: "4px",
        fontSize: "10px",
        zIndex: 9999,
        fontFamily: "monospace",
      }}
    >
      🔐 Auth: {authUser ? "✅" : "❌"} | Doc: {userDoc ? "✅" : "❌"}
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../../services/chat/api";
import { useAuth } from "../../hooks/useAuth";

const ChatAuthContext = createContext();

export const useChatAuth = () => {
  const context = useContext(ChatAuthContext);
  if (!context) {
    throw new Error("useChatAuth must be used within ChatAuthProvider");
  }
  return context;
};

export const ChatAuthProvider = ({ children }) => {
  const [chatUser, setChatUser] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    authUser: currentUser,
    chatUser: globalChatUser,
    chatToken,
  } = useAuth(); // MeowGram auth

  const API_BASE_URL =
    import.meta.env.VITE_CHAT_API_URL || "http://localhost:5000";

  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.getCurrentUser();
      setChatUser(response.data);
      await fetchAllUsers();
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      // If token invalid, try login
      localStorage.removeItem("chatAuthToken");
      if (currentUser) {
        loginWithFirebase();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-login when MeowGram user is available
  useEffect(() => {
    if (currentUser) {
      if (globalChatUser) {
        // Use the global chat user
        setChatUser(globalChatUser);
        setIsLoading(false);
        fetchAllUsers();
      } else if (!chatUser) {
        // Check if already logged in via token
        const token = localStorage.getItem("chatAuthToken");
        if (token) {
          // Fetch current user
          fetchCurrentUser();
        } else {
          // Login with Firebase
          loginWithFirebase();
        }
      }
    } else {
      setChatUser(null);
      setIsLoading(false);
    }
  }, [currentUser, globalChatUser, chatUser]);

  // Optionally accept a user object to avoid closures where currentUser may be undefined
  const loginWithFirebase = async (userParam) => {
    try {
      setIsLoading(true);
      setError(null);
      const userToUse = userParam || currentUser;

      if (!userToUse) {
        console.warn("loginWithFirebase called but no currentUser available");
        setError("Cannot login to chat: no authenticated MeowGram user found.");
        setIsLoading(false);
        return;
      }

      console.log(
        "🔐 Attempting chat login with Firebase user:",
        userToUse.uid
      );

      // Get Firebase token
      const firebaseToken = await userToUse.getIdToken();
      console.log("🎫 Firebase token obtained, length:", firebaseToken.length);
      const userData = {
        uid: userToUse.uid,
        email: userToUse.email,
        displayName: userToUse.displayName || userToUse.email,
        photoURL: userToUse.photoURL,
      };

      console.log("📡 Sending login request to:", API_BASE_URL);
      const response = await authAPI.loginWithFirebase(firebaseToken, userData);

      if (response.data.token) {
        console.log("✅ Chat login successful!");
        localStorage.setItem("chatAuthToken", response.data.token);
        setChatUser(response.data.user);
        await fetchAllUsers();
      }
    } catch (error) {
      console.error("❌ Chat login failed (full error):", error);
      console.error("Error details (shallow):", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url || error.config,
      });

      let errorMessage = "Failed to connect to chat";
      if (error.response?.status === 404) {
        errorMessage =
          "Chat server endpoint not found. Check if MeowChat backend is running correctly.";
      } else if (error.response?.status === 500) {
        errorMessage = "Chat server error. Check MeowChat backend logs.";
      } else if (
        error.code === "NETWORK_ERROR" ||
        error.message.includes("Network Error")
      ) {
        errorMessage =
          "Cannot reach chat server. Please check if the MeowChat backend is running.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // include the endpoint tried to make debugging easier
      setError(`${errorMessage} (tried ${API_BASE_URL})`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      // Merge with MeowGram user data if available
      const chatUsers = response.data.users || [];
      const mergedUsers = chatUsers.map((chatUser) => ({
        ...chatUser,
        // Use MeowGram's current user data if this is the current user
        ...(chatUser._id === globalChatUser?._id && currentUser
          ? {
              profilePicture: currentUser.photoURL || chatUser.profilePicture,
              username: currentUser.displayName || chatUser.username,
              email: currentUser.email || chatUser.email,
            }
          : {}),
      }));
      setChatUsers(mergedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("chatAuthToken");
      setChatUser(null);
      setChatUsers([]);
    }
  };

  const value = {
    chatUser,
    chatUsers,
    isLoading,
    error,
    apiBaseUrl: API_BASE_URL,
    loginWithFirebase,
    logout,
    refreshUsers: fetchAllUsers,
  };

  return (
    <ChatAuthContext.Provider value={value}>
      {children}
    </ChatAuthContext.Provider>
  );
};

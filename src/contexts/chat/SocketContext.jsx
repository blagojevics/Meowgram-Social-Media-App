import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../hooks/useAuth";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      const SOCKET_URL =
        import.meta.env.VITE_CHAT_API_URL || "http://localhost:5000";
      console.log("🔌 Attempting socket connection to:", SOCKET_URL);

      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem("chatAuthToken"), // Use JWT token for auth
        },
        timeout: 5000, // 5 second timeout
      });

      newSocket.on("connect", () => {
        console.log("✅ Connected to chat server via Socket.io");
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("⚠️ Disconnected from chat server");
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error(
          "❌ Chat server Socket.io connection failed:",
          error.message
        );
        console.error("� Socket connect_error details:", error);
        // If the error contains a URL or transport info, surface it explicitly
        try {
          console.error("🔗 Socket attempted URL:", SOCKET_URL);
        } catch (e) {}
        setIsConnected(false);
      });

      newSocket.on("users_online", (users) => {
        setOnlineUsers(users);
      });

      newSocket.on("user_online", (user) => {
        setOnlineUsers((prev) => [
          ...prev.filter((u) => u.id !== user.id && u._id !== user._id),
          user,
        ]);
      });

      newSocket.on("user_offline", (userId) => {
        setOnlineUsers((prev) =>
          prev.filter((u) => u.id !== userId && u._id !== userId)
        );
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [currentUser]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

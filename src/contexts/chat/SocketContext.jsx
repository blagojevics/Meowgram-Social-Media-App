import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
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
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_CHAT_API_URL || 'http://localhost:5000', {
        auth: {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userDisplayName: currentUser.displayName || currentUser.email,
          userPhotoURL: currentUser.photoURL
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      newSocket.on('users_online', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('user_joined', (user) => {
        setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      });

      newSocket.on('user_left', (userId) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== userId));
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
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
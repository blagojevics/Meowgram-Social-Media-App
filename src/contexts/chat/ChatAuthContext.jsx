import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../../services/chat/api';
import { useAuth } from '../../hooks/useAuth';

const ChatAuthContext = createContext();

export const useChatAuth = () => {
  const context = useContext(ChatAuthContext);
  if (!context) {
    throw new Error('useChatAuth must be used within ChatAuthProvider');
  }
  return context;
};

export const ChatAuthProvider = ({ children }) => {
  const [chatUser, setChatUser] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth(); // MeowGram auth

  // Auto-login when MeowGram user is available
  useEffect(() => {
    if (currentUser && !chatUser) {
      loginWithFirebase();
    }
  }, [currentUser, chatUser]);

  const loginWithFirebase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get Firebase token
      const firebaseToken = await currentUser.getIdToken();
      
      const userData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email,
        photoURL: currentUser.photoURL,
      };

      const response = await authAPI.loginWithFirebase(firebaseToken, userData);
      
      if (response.data.token) {
        localStorage.setItem('chatAuthToken', response.data.token);
        setChatUser(response.data.user);
        await fetchAllUsers();
      }
    } catch (error) {
      console.error('Chat login failed:', error);
      setError(error.response?.data?.message || 'Failed to connect to chat');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      setChatUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('chatAuthToken');
      setChatUser(null);
      setChatUsers([]);
    }
  };

  const value = {
    chatUser,
    chatUsers,
    isLoading,
    error,
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
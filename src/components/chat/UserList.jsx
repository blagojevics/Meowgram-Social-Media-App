import React, { useState, useEffect } from 'react';
import { chatAPI } from '../../services/chat/api';
import { useChatAuth } from '../../contexts/chat/ChatAuthContext';
import { useSocket } from '../../contexts/chat/SocketContext';
import './userList.scss';

const UserList = ({ onClose, onStartChat }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const { chatUsers, chatUser } = useChatAuth();
  const { onlineUsers } = useSocket();

  useEffect(() => {
    // Filter out current user from chat users
    const availableUsers = chatUsers.filter(user => user._id !== chatUser._id);
    setUsers(availableUsers);
    setLoading(false);
  }, [chatUsers, chatUser]);

  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.id === userId);
  };

  const handleStartChat = async (selectedUser) => {
    try {
      setCreatingChat(true);
      
      // Create a new chat with the selected user
      const response = await chatAPI.createChat([selectedUser._id], '', false);
      
      if (response.data.chat) {
        onStartChat(response.data.chat);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const name = user.displayName || user.email || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="user-list-modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h3>Start New Chat</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {/* Search */}
        <div className="modal-search">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* Users List */}
        <div className="modal-body">
          {loading ? (
            <div className="loading-users">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="user-item-skeleton">
                  <div className="avatar-skeleton"></div>
                  <div className="info-skeleton">
                    <div className="name-skeleton"></div>
                    <div className="status-skeleton"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>No users found</p>
              <span>Try a different search term</span>
            </div>
          ) : (
            <div className="users-list">
              {filteredUsers.map(user => {
                const isOnline = isUserOnline(user._id);
                
                return (
                  <div
                    key={user._id}
                    className="user-item"
                    onClick={() => handleStartChat(user)}
                  >
                    <div className="user-avatar">
                      <img 
                        src={user.photoURL || '/logo2update.png'} 
                        alt={user.displayName || user.email}
                      />
                      {isOnline && <div className="online-indicator"></div>}
                    </div>
                    
                    <div className="user-info">
                      <div className="user-name">
                        {user.displayName || user.email}
                      </div>
                      <div className="user-status">
                        {isOnline ? 'Online' : 'Last seen recently'}
                      </div>
                    </div>
                    
                    <div className="start-chat-btn">
                      {creatingChat ? '⏳' : '💬'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserList;
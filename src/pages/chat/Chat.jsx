import React, { useState } from 'react';
import { ChatAuthProvider } from '../../contexts/chat/ChatAuthContext';
import { SocketProvider } from '../../contexts/chat/SocketContext';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';
import UserList from '../../components/chat/UserList';
import LoadingSpinner from '../../components/loading/LoadingSpinner';
import { useChatAuth } from '../../contexts/chat/ChatAuthContext';
import './chat.scss';

const ChatContent = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showUserList, setShowUserList] = useState(false);
  const { chatUser, isLoading, error } = useChatAuth();

  if (isLoading) {
    return (
      <div className="chat-loading">
        <LoadingSpinner />
        <p>Connecting to chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-error">
        <div className="error-message">
          <h3>Chat Connection Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!chatUser) {
    return (
      <div className="chat-auth-required">
        <div className="auth-message">
          <h3>Chat Authentication Required</h3>
          <p>Please make sure you're logged into MeowGram to access chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-layout">
        {/* Chat List Sidebar */}
        <div className={`chat-sidebar ${selectedChat ? 'hidden-mobile' : ''}`}>
          <div className="chat-header">
            <h2>Messages</h2>
            <button 
              className="new-chat-btn"
              onClick={() => setShowUserList(true)}
            >
              <span>+</span>
            </button>
          </div>
          <ChatList 
            selectedChat={selectedChat}
            onSelectChat={setSelectedChat}
          />
        </div>

        {/* Chat Window */}
        <div className={`chat-main ${!selectedChat ? 'hidden-mobile' : ''}`}>
          {selectedChat ? (
            <ChatWindow 
              chat={selectedChat}
              onBack={() => setSelectedChat(null)}
            />
          ) : (
            <div className="no-chat-selected">
              <div className="welcome-message">
                <h3>Welcome to MeowChat!</h3>
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>

        {/* User List Modal */}
        {showUserList && (
          <UserList 
            onClose={() => setShowUserList(false)}
            onStartChat={(user) => {
              // Handle starting new chat
              setShowUserList(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

const Chat = () => {
  return (
    <ChatAuthProvider>
      <SocketProvider>
        <ChatContent />
      </SocketProvider>
    </ChatAuthProvider>
  );
};

export default Chat;
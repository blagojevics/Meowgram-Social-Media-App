import React, { useState, useEffect } from "react";
import { ChatAuthProvider } from "../../contexts/chat/ChatAuthContext";
import { SocketProvider } from "../../contexts/chat/SocketContext";
import ChatList from "../../components/chat/ChatList";
import ChatWindow from "../../components/chat/ChatWindow";
import UserList from "../../components/chat/UserList";
import LoadingSpinner from "../../components/loading/LoadingSpinner";
import { useChatAuth } from "../../contexts/chat/ChatAuthContext";
import { useAuth } from "../../hooks/useAuth";
import "./chat.scss";

const ChatContent = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showUserList, setShowUserList] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const { chatUser, isLoading, error, loginWithFirebase, apiBaseUrl } =
    useChatAuth();
  const { currentUser } = useAuth();

  // Add timeout for connection attempt
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setConnectionTimeout(true);
      }, 8000); // 8 second timeout

      return () => clearTimeout(timer);
    } else {
      setConnectionTimeout(false);
    }
  }, [isLoading]);

  if (isLoading && !connectionTimeout) {
    return (
      <div className="chat-loading">
        <LoadingSpinner />
        <p>Connecting to chat...</p>
      </div>
    );
  }

  if (connectionTimeout || error) {
    return (
      <div className="chat-error">
        <div className="error-message">
          <h3>Chat Server Unavailable</h3>
          <p>
            {error ||
              "Unable to connect to the chat server. This is expected if the MeowChat backend isn't running yet."}
          </p>
          <div className="error-actions">
            <button
              onClick={async () => {
                setConnectionTimeout(false);
                // Re-run the chat login flow instead of a full page reload
                if (!currentUser) {
                  // If there's no authenticated MeowGram user, avoid calling the chat login
                  // and surface a quick hint to the developer.
                  console.warn(
                    "Cannot retry chat login: currentUser is undefined"
                  );
                  return;
                }

                try {
                  await loginWithFirebase(currentUser);
                } catch (e) {
                  // swallow here — context will set error state
                }
              }}
            >
              Try Again
            </button>
            <button onClick={() => window.history.back()}>Go Back</button>
          </div>
          <div className="setup-info">
            <p>
              <strong>For Developers:</strong>
            </p>
            <p>
              Unable to connect to the chat server. This is expected if the
              MeowChat backend isn't running yet.
            </p>
            <p>
              Tried endpoint: <code>{apiBaseUrl}</code>
            </p>
            <p>
              See <code>CHAT_INTEGRATION_GUIDE.md</code> for setup instructions.
            </p>
          </div>
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
        <div className={`chat-sidebar ${selectedChat ? "hidden-mobile" : ""}`}>
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
        <div className={`chat-main ${!selectedChat ? "hidden-mobile" : ""}`}>
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

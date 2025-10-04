import React, { useState, useEffect } from "react";
import { chatAPI } from "../../services/chat/api";
import { useSocket } from "../../contexts/chat/SocketContext";
import { useChatAuth } from "../../contexts/chat/ChatAuthContext";
import "./chatList.scss";

const ChatList = ({ selectedChat, onSelectChat, refreshTrigger }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { socket, onlineUsers } = useSocket();
  const { chatUser, chatUsers } = useChatAuth();

  useEffect(() => {
    fetchChats();
  }, [refreshTrigger]);

  useEffect(() => {
    if (socket) {
      socket.on("message_received", handleNewMessage);
      socket.on("message_read", handleMessageRead);

      return () => {
        socket.off("message_received");
        socket.off("message_read");
      };
    }
  }, [socket]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getChats();
      setChats(response.data.chats || []);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    setChats((prevChats) => {
      return prevChats
        .map((chat) => {
          if (chat._id === message.chat) {
            return {
              ...chat,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCount:
                chat._id === selectedChat?._id
                  ? 0
                  : (chat.unreadCount || 0) + 1,
            };
          }
          return chat;
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  const handleMessageRead = ({ chatId }) => {
    setChats((prevChats) => {
      return prevChats.map((chat) => {
        if (chat._id === chatId) {
          return { ...chat, unreadCount: 0 };
        }
        return chat;
      });
    });
  };

  const formatLastMessage = (message) => {
    if (!message) return "No messages yet";

    switch (message.messageType) {
      case "image":
        return "📷 Image";
      case "file":
        return "📎 File";
      default:
        return message.content || "No messages yet";
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getOtherParticipant = (chat) => {
    if (chat.type !== "private") return null; // Assuming type "private" means 1-on-1
    const otherParticipant = chat.participants.find(
      (p) => p.user._id !== chatUser._id && p.user._id !== chatUser.id
    );
    return otherParticipant ? otherParticipant.user : null;
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some((user) => user.id === userId);
  };

  const getChatDisplayInfo = (chat) => {
    if (chat.type !== "private") {
      return {
        name: chat.chatName || "Group Chat",
        avatar: chat.chatImage || "/logo2update.png",
        isOnline: false,
      };
    } else {
      const otherUser = getOtherParticipant(chat);
      return {
        name: otherUser?.username || otherUser?.email || "Unknown User",
        avatar: otherUser?.profilePicture || "/logo2update.png",
        isOnline: isUserOnline(otherUser?._id),
      };
    }
  };

  const filteredChats = chats.filter((chat) => {
    const { name } = getChatDisplayInfo(chat);
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="chat-list-loading">
        <div className="loading-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="chat-item-skeleton">
              <div className="avatar-skeleton"></div>
              <div className="content-skeleton">
                <div className="name-skeleton"></div>
                <div className="message-skeleton"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list">
      {/* Search */}
      <div className="chat-search">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Chat Items */}
      <div className="chat-items">
        {filteredChats.length === 0 ? (
          <div className="no-chats">
            <p>No conversations yet</p>
            <span>Start a new chat by clicking the + button above</span>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const { name, avatar, isOnline } = getChatDisplayInfo(chat);
            const isSelected = selectedChat?._id === chat._id;

            return (
              <div
                key={chat._id}
                className={`chat-item ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectChat(chat)}
              >
                <div className="chat-avatar">
                  <img src={avatar} alt={name} />
                  {!chat.isGroup && isOnline && (
                    <div className="online-indicator"></div>
                  )}
                </div>

                <div className="chat-content">
                  <div className="chat-header">
                    <span className="chat-name">{name}</span>
                    {chat.lastMessage && (
                      <span className="chat-time">
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="chat-footer">
                    <span className="last-message">
                      {formatLastMessage(chat.lastMessage)}
                    </span>
                    {chat.unreadCount > 0 && (
                      <div className="unread-badge">
                        {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;

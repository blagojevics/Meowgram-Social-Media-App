import React, { useState, useEffect, useRef } from "react";
import { chatAPI } from "../../services/chat/api";
import { useSocket } from "../../contexts/chat/SocketContext";
import { useChatAuth } from "../../contexts/chat/ChatAuthContext";
import Message from "./Message";
import MessageInput from "./MessageInput";
import "./chatWindow.scss";

const ChatWindow = ({ chat, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { socket } = useSocket();
  const { chatUser, chatUsers } = useChatAuth();

  useEffect(() => {
    if (chat) {
      resetAndLoadMessages();
      markMessagesAsRead();
    }
  }, [chat]);

  // Set dynamic --vh CSS variable for mobile viewport bug (address bar hide)
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  useEffect(() => {
    if (socket && chat) {
      console.log("🔌 Setting up socket listeners for chat:", chat._id);

      socket.on("message_received", handleNewMessage);
      socket.on("message_edited", handleMessageEdited);
      socket.on("message_deleted", handleMessageDeleted);

      return () => {
        console.log("🔌 Removing socket listeners");
        socket.off("message_received");
        socket.off("message_edited");
        socket.off("message_deleted");
      };
    }
  }, [socket, chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ensure we scroll once after initial loading completes
  useEffect(() => {
    if (!loading) {
      setTimeout(() => scrollToBottom(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const resetAndLoadMessages = async () => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    await loadMessages(1, true);
  };

  const loadMessages = async (pageNum = page, isReset = false) => {
    try {
      if (!isReset) setLoadingMore(true);

      const response = await chatAPI.getChatMessages(chat._id, pageNum, 30);
      const rawMessages = response.data.messages || [];

      // Populate sender data
      const populatedMessages = rawMessages.map((msg) => ({
        ...msg,
        sender:
          typeof msg.sender === "string"
            ? (() => {
                const found = chatUsers.find(
                  (u) => u._id === msg.sender || u.id === msg.sender
                );
                if (found) {
                  return found;
                } else if (
                  msg.sender === chatUser._id ||
                  msg.sender === chatUser.id
                ) {
                  return chatUser;
                } else {
                  return {
                    _id: msg.sender,
                    id: msg.sender,
                    username: "Unknown User",
                    email: "",
                    profilePicture: "/logo2update.png",
                  };
                }
              })()
            : msg.sender,
      }));

      // Sort messages by creation time (oldest first)
      const sortedMessages = populatedMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      if (isReset) {
        setMessages(sortedMessages);
      } else {
        setMessages((prev) => {
          const combined = [...sortedMessages, ...prev];
          // Remove duplicates and sort
          const unique = combined.filter(
            (msg, index, self) =>
              index === self.findIndex((m) => m._id === msg._id)
          );
          return unique.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        });
      }

      setHasMore(rawMessages.length === 30);
      setPage(pageNum + 1);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = () => {
    if (!loadingMore && hasMore) {
      loadMessages();
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await chatAPI.markMessagesAsRead(chat._id);
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const handleNewMessage = (message) => {
    console.log("📨 Received new message via socket:", message);

    if (message.chat === chat._id) {
      // Don't add our own messages from socket since they're already added via API
      const isOwnMessage =
        message.sender._id === chatUser._id ||
        message.sender.id === chatUser.id;

      if (isOwnMessage) {
        console.log("💬 Ignoring own message from socket");
        return;
      }

      setMessages((prev) => {
        // Check if we already have this message (from API response)
        const existingMessage = prev.find((msg) => msg._id === message._id);

        if (!existingMessage) {
          console.log("💬 Adding new message from socket");

          // Populate sender data
          const populatedMessage = {
            ...message,
            sender:
              typeof message.sender === "string"
                ? (() => {
                    const found = chatUsers.find(
                      (u) => u._id === message.sender || u.id === message.sender
                    );
                    if (found) {
                      return found;
                    } else if (
                      message.sender === chatUser._id ||
                      message.sender === chatUser.id
                    ) {
                      return chatUser;
                    } else {
                      return {
                        _id: message.sender,
                        id: message.sender,
                        username: "Unknown User",
                        email: "",
                        profilePicture: "/logo2update.png",
                      };
                    }
                  })()
                : message.sender,
          };
          return [...prev, populatedMessage].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        } else {
          console.log("💬 Message already exists, skipping");
          return prev;
        }
      });

      markMessagesAsRead();
    } else {
      console.log("💬 Message is for different chat, ignoring");
    }
  };

  const handleMessageDeleted = (messageId) => {
    setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
  };

  const handleMessageEdited = (updatedMessage) => {
    // Populate sender data
    const populatedMessage = {
      ...updatedMessage,
      sender:
        typeof updatedMessage.sender === "string"
          ? (() => {
              const found = chatUsers.find(
                (u) =>
                  u._id === updatedMessage.sender ||
                  u.id === updatedMessage.sender
              );
              if (found) {
                return found;
              } else if (
                updatedMessage.sender === chatUser._id ||
                updatedMessage.sender === chatUser.id
              ) {
                return chatUser;
              } else {
                return {
                  _id: updatedMessage.sender,
                  id: updatedMessage.sender,
                  username: "Unknown User",
                  email: "",
                  profilePicture: "/logo2update.png",
                };
              }
            })()
          : updatedMessage.sender,
    };
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === populatedMessage._id ? populatedMessage : msg
      )
    );
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      } catch (e) {
        // Fallback: directly set container scrollTop
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      }
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (content, messageType = "text") => {
    const tempId = Date.now().toString();
    console.log("📤 Attempting to send message:", {
      content,
      messageType,
      chatId: chat._id,
    });

    try {
      const tempMessage = {
        _id: tempId,
        content,
        messageType,
        sender: chatUser,
        chat: chat._id,
        createdAt: new Date().toISOString(),
        isTemporary: true,
      };

      console.log("📝 Adding temporary message:", tempMessage);
      setMessages((prev) => {
        const newMessages = [...prev, tempMessage];
        return newMessages.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });

      const response = await chatAPI.sendMessage(
        chat._id,
        content,
        messageType
      );

      console.log("📨 API response:", response.data);

      // Check if response contains the message
      let realMessage = null;
      if (response.data) {
        if (
          response.data.message &&
          typeof response.data.message === "object"
        ) {
          realMessage = response.data.message;
        } else if (response.data._id) {
          realMessage = response.data;
        }
      }

      if (realMessage) {
        // Populate sender data for the real message
        const populatedMessage = {
          ...realMessage,
          sender:
            typeof realMessage.sender === "string"
              ? (() => {
                  const found = chatUsers.find(
                    (u) =>
                      u._id === realMessage.sender ||
                      u.id === realMessage.sender
                  );
                  if (found) {
                    return found;
                  } else if (
                    realMessage.sender === chatUser._id ||
                    realMessage.sender === chatUser.id
                  ) {
                    return chatUser;
                  } else {
                    return {
                      _id: realMessage.sender,
                      id: realMessage.sender,
                      username: "Unknown User",
                      email: "",
                      profilePicture: "/logo2update.png",
                    };
                  }
                })()
              : realMessage.sender || chatUser,
        };

        console.log("🔄 Replacing with real message:", populatedMessage);

        // Replace temporary message with real one
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg._id === tempId
              ? { ...populatedMessage, isTemporary: false }
              : msg
          );
          return updated.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        });
      } else {
        // If no message in response, keep temporary message and wait for socket
        console.log("⏳ No message in response, keeping temporary message");
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempId ? { ...tempMessage, isTemporary: false } : msg
          )
        );
      }

      console.log("✅ Message sent successfully");
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      console.error("Error details:", error.response?.data);

      // Remove temporary message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await chatAPI.deleteMessage(messageId);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      await chatAPI.editMessage(messageId, newContent);
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const getChatDisplayInfo = () => {
    if (chat.type !== "private") {
      return {
        name: chat.chatName || "Group Chat",
        avatar: chat.chatImage || "/logo2update.png",
        subtitle: `${chat.participants.length} members`,
      };
    } else {
      const otherParticipant = chat.participants.find(
        (p) => p.user._id !== chatUser._id && p.user._id !== chatUser.id
      );
      const otherUser = otherParticipant ? otherParticipant.user : null;
      return {
        name: otherUser?.username || otherUser?.email || "Unknown User",
        avatar: otherUser?.profilePicture || "/logo2update.png",
        subtitle: "Last seen recently", // You can enhance this with real presence data
      };
    }
  };

  const { name, avatar, subtitle } = getChatDisplayInfo();

  if (loading) {
    return (
      <div className="chat-window-loading">
        <div className="loading-header">
          <div className="back-button" onClick={onBack}>
            ←
          </div>
          <div className="header-skeleton">
            <div className="avatar-skeleton"></div>
            <div className="info-skeleton">
              <div className="name-skeleton"></div>
              <div className="subtitle-skeleton"></div>
            </div>
          </div>
        </div>
        <div className="messages-loading">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="message-skeleton">
              <div className="message-bubble-skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          ←
        </button>
        <div className="chat-info">
          <img src={avatar} alt={name} className="chat-avatar" />
          <div className="chat-details">
            <h3 className="chat-name">{name}</h3>
            <p className="chat-subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="chat-actions">
          <button className="action-btn">📞</button>
          <button className="action-btn">📹</button>
          <button className="action-btn">⋯</button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="messages-container"
        ref={messagesContainerRef}
        onScroll={(e) => {
          if (e.target.scrollTop === 0 && hasMore) {
            loadMoreMessages();
          }
        }}
      >
        {loadingMore && (
          <div className="loading-more">
            <div className="loading-spinner"></div>
          </div>
        )}

        <div className="messages-list">
          {messages.map((message, index) => {
            const isOwnMessage =
              message.sender._id === chatUser._id ||
              message.sender.id === chatUser.id;

            return (
              <Message
                key={message._id}
                message={message}
                isOwn={isOwnMessage}
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;

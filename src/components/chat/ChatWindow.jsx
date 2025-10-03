import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/chat/api';
import { useSocket } from '../../contexts/chat/SocketContext';
import { useChatAuth } from '../../contexts/chat/ChatAuthContext';
import Message from './Message';
import MessageInput from './MessageInput';
import './chatWindow.scss';

const ChatWindow = ({ chat, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { socket } = useSocket();
  const { chatUser } = useChatAuth();

  useEffect(() => {
    if (chat) {
      resetAndLoadMessages();
      markMessagesAsRead();
    }
  }, [chat]);

  useEffect(() => {
    if (socket && chat) {
      socket.on('new_message', handleNewMessage);
      socket.on('message_deleted', handleMessageDeleted);
      socket.on('message_edited', handleMessageEdited);
      
      return () => {
        socket.off('new_message');
        socket.off('message_deleted');
        socket.off('message_edited');
      };
    }
  }, [socket, chat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const newMessages = response.data.messages || [];
      
      if (isReset) {
        setMessages(newMessages.reverse());
      } else {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      }
      
      setHasMore(newMessages.length === 30);
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Failed to load messages:', error);
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
      console.error('Failed to mark messages as read:', error);
    }
  };

  const handleNewMessage = (message) => {
    if (message.chat === chat._id) {
      setMessages(prev => [...prev, message]);
      markMessagesAsRead();
    }
  };

  const handleMessageDeleted = (messageId) => {
    setMessages(prev => prev.filter(msg => msg._id !== messageId));
  };

  const handleMessageEdited = (updatedMessage) => {
    setMessages(prev => prev.map(msg => 
      msg._id === updatedMessage._id ? updatedMessage : msg
    ));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content, messageType = 'text') => {
    try {
      const tempId = Date.now().toString();
      const tempMessage = {
        _id: tempId,
        content,
        messageType,
        sender: chatUser,
        chat: chat._id,
        createdAt: new Date().toISOString(),
        isTemporary: true
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      const response = await chatAPI.sendMessage(chat._id, content, messageType);
      
      // Replace temporary message with real one
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? response.data.message : msg
      ));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await chatAPI.deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      await chatAPI.editMessage(messageId, newContent);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const getChatDisplayInfo = () => {
    if (chat.isGroup) {
      return {
        name: chat.chatName || 'Group Chat',
        avatar: chat.groupAvatar || '/logo2update.png',
        subtitle: `${chat.participants.length} members`
      };
    } else {
      const otherUser = chat.participants.find(p => p._id !== chatUser._id);
      return {
        name: otherUser?.displayName || otherUser?.email || 'Unknown User',
        avatar: otherUser?.photoURL || '/logo2update.png',
        subtitle: 'Last seen recently' // You can enhance this with real presence data
      };
    }
  };

  const { name, avatar, subtitle } = getChatDisplayInfo();

  if (loading) {
    return (
      <div className="chat-window-loading">
        <div className="loading-header">
          <div className="back-button" onClick={onBack}>←</div>
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
          {messages.map((message, index) => (
            <Message
              key={message._id}
              message={message}
              isOwn={message.sender._id === chatUser._id}
              showAvatar={
                index === 0 || 
                messages[index - 1].sender._id !== message.sender._id
              }
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;
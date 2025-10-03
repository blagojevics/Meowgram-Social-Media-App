import React, { useState } from 'react';
import './message.scss';

const Message = ({ message, isOwn, showAvatar, onDelete, onEdit }) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(message._id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditContent(message.content);
      setIsEditing(false);
    }
  };

  const renderMessageContent = () => {
    if (isEditing) {
      return (
        <div className="message-edit">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleEdit}
            autoFocus
            className="edit-input"
          />
        </div>
      );
    }

    switch (message.messageType) {
      case 'image':
        return (
          <div className="message-image">
            <img src={message.content} alt="Shared image" />
          </div>
        );
      case 'file':
        return (
          <div className="message-file">
            <div className="file-icon">📎</div>
            <div className="file-info">
              <div className="file-name">{message.fileName || 'File'}</div>
              <div className="file-size">{message.fileSize || 'Unknown size'}</div>
            </div>
            <a 
              href={message.content} 
              download={message.fileName}
              className="download-btn"
            >
              ⬇️
            </a>
          </div>
        );
      default:
        return (
          <div className="message-text">
            {message.content}
          </div>
        );
    }
  };

  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && showAvatar && (
        <div className="message-avatar">
          <img 
            src={message.sender.photoURL || '/logo2update.png'} 
            alt={message.sender.displayName || message.sender.email}
          />
        </div>
      )}
      
      <div className="message-content">
        {!isOwn && showAvatar && (
          <div className="sender-name">
            {message.sender.displayName || message.sender.email}
          </div>
        )}
        
        <div 
          className={`message-bubble ${message.isTemporary ? 'temporary' : ''}`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {renderMessageContent()}
          
          <div className="message-time">
            {formatTime(message.createdAt)}
            {isOwn && (
              <span className="message-status">
                {message.isTemporary ? '⏱️' : '✓'}
              </span>
            )}
          </div>
          
          {showActions && !message.isTemporary && (
            <div className="message-actions">
              {isOwn && message.messageType === 'text' && (
                <button 
                  className="action-btn edit-btn"
                  onClick={() => setIsEditing(true)}
                  title="Edit message"
                >
                  ✏️
                </button>
              )}
              {isOwn && (
                <button 
                  className="action-btn delete-btn"
                  onClick={() => onDelete(message._id)}
                  title="Delete message"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
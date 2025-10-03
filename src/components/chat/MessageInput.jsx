import React, { useState, useRef } from 'react';
import { uploadAPI } from '../../services/chat/api';
import './messageInput.scss';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage, 'text');
      setMessage('');
      resetTextareaHeight();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const resetTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Check file type
      const isImage = file.type.startsWith('image/');
      
      if (isImage) {
        // For images, upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'meowgram_avatar_upload'); // Use your existing preset
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );
        
        const data = await response.json();
        if (data.secure_url) {
          onSendMessage(data.secure_url, 'image');
        }
      } else {
        // For other files, upload to backend
        const response = await uploadAPI.uploadFile(file);
        if (response.data.fileUrl) {
          onSendMessage(response.data.fileUrl, 'file');
        }
      }
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <div className="message-input">
      <div className="input-container">
        {/* File Upload Button */}
        <button 
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Attach file"
        >
          {isUploading ? '⏳' : '📎'}
        </button>
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        />
        
        {/* Text Input */}
        <div className="text-input-container">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="message-textarea"
            rows={1}
            disabled={isUploading}
          />
        </div>
        
        {/* Send Button */}
        <button 
          className={`send-btn ${message.trim() ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!message.trim() || isUploading}
          title="Send message"
        >
          {isUploading ? '⏳' : '➤'}
        </button>
      </div>
      
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-text">Uploading file...</div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
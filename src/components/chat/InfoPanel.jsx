import React from "react";
import "./infoPanel.scss";

const InfoPanel = ({ chat }) => {
  if (!chat) {
    return (
      <div className="info-panel">
        <div className="info-header">
          <h3>Chat Info</h3>
        </div>
        <div className="info-content">
          <p>Select a chat to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="info-panel">
      <div className="info-header">
        <h3>Chat Info</h3>
      </div>
      <div className="info-content">
        <div className="chat-details">
          <h4>{chat.name || "Group Chat"}</h4>
          <p>Participants: {chat.participants?.length || 0}</p>
          {/* Add more details as needed */}
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;

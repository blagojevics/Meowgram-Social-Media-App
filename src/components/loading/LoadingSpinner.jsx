import "./loadingSpinner.scss";

export default function LoadingSpinner({
  text = "Loading...",
  size = "medium",
}) {
  return (
    <div className="loading-container">
      <div className={`loading-spinner ${size}`}>
        <div className="spinner"></div>
      </div>
      <p className="loading-text">{text}</p>
    </div>
  );
}

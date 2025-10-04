import { useEffect, useRef } from "react";
// Import the main Firebase auth handler instead of your custom hook
import { getAuth } from "firebase/auth";
import LoadingSpinner from "../components/loading/LoadingSpinner";
import "./ChatPage.css";

const MEOWCHAT_URL =
  "https://meowchat-frontend-production.up.railway.app/login";

console.log("ChatPage loaded, MEOWCHAT_URL:", MEOWCHAT_URL);

function ChatPage() {
  const iframeRef = useRef(null);

  // Get the main Firebase auth instance and the current user from it directly
  const auth = getAuth();
  const user = auth.currentUser; // This is the most reliable way to get the current user

  console.log(
    "ChatPage render - user:",
    user ? "Logged in" : "Not logged in",
    user
  );

  useEffect(() => {
    console.log(
      "ChatPage useEffect - user:",
      user,
      "iframeRef.current:",
      iframeRef.current
    );
    // We now use `user` which we got directly from Firebase
    if (user && iframeRef.current) {
      console.log("Getting token for user:", user.uid);
      user
        .getIdToken()
        .then((token) => {
          console.log("Token obtained, length:", token.length);
          const iframe = iframeRef.current;

          const sendMessage = () => {
            console.log("Sending postMessage to iframe, URL:", MEOWCHAT_URL);
            iframe.contentWindow.postMessage(
              {
                type: "AUTH_TOKEN",
                token: token,
              },
              MEOWCHAT_URL
            );
          };

          if (iframe.contentDocument.readyState === "complete") {
            console.log("Iframe already loaded, sending message immediately");
            sendMessage();
          } else {
            console.log("Iframe not loaded, setting onload");
            iframe.onload = () => {
              console.log("Iframe onload triggered, sending message");
              sendMessage();
            };
          }
        })
        .catch((error) => {
          console.error("Error getting token:", error);
        });
    } else {
      console.log("No user or no iframe ref");
    }
    // The dependency array now watches `user`. When Firebase confirms the user,
    // this effect will re-run with the correct user object.
  }, [user]);

  // There's no separate loading state needed from a hook,
  // because `auth.currentUser` is either the user object or null.
  // The initial render will have `user` as null, and once Firebase loads,
  // it will trigger a re-render with the correct user object.

  return (
    <div className="chat-page-container">
      {user ? ( // We check `user` directly
        <>
          {console.log("Rendering iframe with URL:", MEOWCHAT_URL)}
          <iframe
            ref={iframeRef}
            src={MEOWCHAT_URL}
            title="MeowChat"
            className="chat-iframe"
            allow="microphone; camera"
          />
        </>
      ) : (
        <>
          {console.log("Rendering login prompt")}
          <div className="chat-login-prompt">
            <h1>Chat Authentication Required</h1>
            <p>Please make sure you are logged into MeowGram to access chat.</p>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatPage;

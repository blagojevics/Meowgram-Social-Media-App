import { Link, useNavigate } from "react-router-dom";
import "./login.scss";
import { useState, useEffect, useRef } from "react";
import { auth, db, googleProvider } from "../../../config/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import { FaGoogle } from "react-icons/fa";
import ReCAPTCHA from "react-google-recaptcha";

export default function Login() {
  const [inputs, setInputs] = useState({ email: "", password: "" });
  const [err, setErr] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();
  const { authUser, userDoc } = useAuth();
  const recaptchaRef = useRef(null);

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(null);

    // Check reCAPTCHA first
    if (!recaptchaToken) {
      setErr("Please complete the reCAPTCHA verification.");
      return;
    }

    // Check if Firebase is properly initialized
    if (!auth) {
      setErr(
        "Firebase authentication is not available. Please check your configuration."
      );
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, inputs.email, inputs.password);
      // Reset reCAPTCHA after successful login
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }
      // ✅ no navigate here, we let useEffect handle it
    } catch (error) {
      // Reset reCAPTCHA on error to prevent reuse
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }

      if (error.code === "auth/api-key-not-valid") {
        setErr("Firebase configuration error. Please check your API key.");
      } else {
        setErr(error.message);
      }
      console.error("Login error:", error);
    }
  };

  const handleGoogleLogin = async () => {
    setErr(null);

    // Check reCAPTCHA first
    if (!recaptchaToken) {
      setErr("Please complete the reCAPTCHA verification.");
      return;
    }

    // Check if Firebase is properly initialized
    if (!auth || !googleProvider || !db) {
      setErr(
        "Firebase services are not available. Please check your configuration."
      );
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          username: user.displayName?.toLowerCase().replace(/\s+/g, "") || "",
          displayName: user.displayName || "",
          email: user.email,
          avatarUrl: user.photoURL || "",
          bio: "",
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          onboardingComplete: false,
          createdAt: serverTimestamp(),
        });
      }

      // Reset reCAPTCHA after successful login
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }
      // ✅ no navigate here either, let useEffect handle it
    } catch (error) {
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }
      setErr(error.message);
      console.error("Google login error:", error.message);
    }
  };

  // ✅ Redirect once both authUser and userDoc are ready
  useEffect(() => {
    if (authUser && userDoc) {
      if (!authUser.emailVerified) {
        navigate("/verify-email");
      } else if (userDoc.onboardingComplete === false) {
        navigate("/onboarding");
      } else {
        navigate("/");
      }
    }
  }, [authUser, userDoc, navigate]);

  return (
    <div className="login">
      <div className="card">
        <div className="left">
          <h1>Welcome to Meowgram</h1>
          <p>Log In and connect with your favourite animals.</p>
          <span>Dont have an account? Register now!</span>
          <Link to="/register">
            <button type="button">Register!</button>
          </Link>
        </div>
        <div className="right">
          <h1>Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              name="email"
              onChange={handleChange}
              value={inputs.email}
              required
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              onChange={handleChange}
              value={inputs.password}
              required
            />

            {/* reCAPTCHA */}
            <div className="recaptcha-container">
              {import.meta.env.VITE_RECAPTCHA_SITE_KEY ? (
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => {
                    console.log("reCAPTCHA token received:", token);
                    setRecaptchaToken(token);
                  }}
                  onExpired={() => {
                    console.log("reCAPTCHA expired");
                    setRecaptchaToken(null);
                  }}
                  onError={(error) => {
                    console.error("reCAPTCHA Error:", error);
                    setErr(
                      "reCAPTCHA failed to load. Please refresh the page."
                    );
                  }}
                  onLoad={() => {
                    console.log("reCAPTCHA loaded successfully");
                  }}
                  theme="light"
                />
              ) : (
                <div style={{ color: "red", padding: "10px" }}>
                  ⚠️ reCAPTCHA not configured. Check your .env file.
                </div>
              )}
            </div>

            {err && <span style={{ color: "red" }}>{err}</span>}
            <button type="submit">Login!</button>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="google-login-btn"
            >
              <FaGoogle /> Continue with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

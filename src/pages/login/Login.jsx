import { Link, useNavigate } from "react-router-dom";
import "./login.scss";
import { useState, useEffect } from "react";
import { auth, db, googleProvider } from "../../config/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { FaGoogle } from "react-icons/fa";

export default function Login() {
  const [inputs, setInputs] = useState({ email: "", password: "" });
  const [err, setErr] = useState(null);
  const navigate = useNavigate();
  const { authUser, userDoc } = useAuth();

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      await signInWithEmailAndPassword(auth, inputs.email, inputs.password);
      // ✅ no navigate here, we let useEffect handle it
    } catch (error) {
      setErr(error.message);
      console.error("Login error:", error.message);
    }
  };

  const handleGoogleLogin = async () => {
    setErr(null);
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
      // ✅ no navigate here either, let useEffect handle it
    } catch (error) {
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
          <p>
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sint in
            blanditiis voluptatem explicabo, architecto rem cum id dolor fugit
            aspernatur alias porro?
          </p>
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

import { Link, useNavigate } from "react-router-dom";
import "./login.scss";
import { useState } from "react";
import { auth, db, googleProvider } from "../../config/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
  });

  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(null);

    try {
      await signInWithEmailAndPassword(auth, inputs.email, inputs.password);
      navigate("/");
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

      // Check if Firestore user doc exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create Firestore doc for new Google user
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

      navigate("/");
    } catch (error) {
      setErr(error.message);
      console.error("Google login error:", error.message);
    }
  };

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
          </form>

          <div className="divider">or</div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="google-login-btn"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

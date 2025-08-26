import { Link, useNavigate } from "react-router-dom";
import "./register.scss";
import { auth } from "../../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { db } from "../../config/firebase";
import { doc, setDoc, collection } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";

export default function Register() {
  const [inputs, setInputs] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setErr(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        inputs.email,
        inputs.password
      );
      const user = userCredential.user;

      const newUserDocRef = doc(db, "users", user.uid);

      await setDoc(newUserDocRef, {
        uid: user.uid,
        displayName: inputs.name,
        username: inputs.username,
        email: inputs.email,
        avatarUrl: "",
        bio: "",
        followersCount: 0,
        followingCount: 0,
      });

      navigate("/onboarding");
    } catch (error) {
      setErr(error.message);
      console.error("Registration failed:", error.message);
    }
  };

  return (
    <div className="register">
      <div className="card">
        <div className="left">
          <h1>Welcome to Meowgram</h1>
          <p>
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sint in
            blanditiis voluptatem explicabo, architecto rem cum id dolor fugit
            aspernatur alias porro?
          </p>
          <span>Have an account? Login now!</span>
          <Link to="/login">
            <button type="button">Login!</button>
          </Link>
        </div>
        <div className="right">
          <h1>Register</h1>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Name"
              name="name"
              onChange={handleChange}
              required
              value={inputs.name}
            />
            <input
              type="text"
              placeholder="Username"
              name="username"
              onChange={handleChange}
              required
              value={inputs.username}
            />
            <input
              type="email"
              placeholder="Email"
              name="email"
              onChange={handleChange}
              required
              value={inputs.email}
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              onChange={handleChange}
              required
              minLength="8"
              value={inputs.password}
            />
            {err && <span style={{ color: "red" }}>{err}</span>}
            <button type="submit">Register!</button>
            <button>Register via Google Account</button>
          </form>
        </div>
      </div>
    </div>
  );
}

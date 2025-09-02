import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../config/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "./register.scss";

export default function Register() {
  const [formInputs, setFormInputs] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        formInputs.email,
        formInputs.password
      );

      await updateProfile(res.user, { displayName: formInputs.username });

      await setDoc(
        doc(db, "users", res.user.uid),
        {
          uid: res.user.uid,
          username: formInputs.username.toLowerCase(),
          displayName: formInputs.name,
          email: formInputs.email,
          avatarUrl: "",
          bio: "",
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          onboardingComplete: false,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      await sendEmailVerification(res.user);

      navigate("/verify-email");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="register">
      <div className="card">
        <div className="left">
          <h1>Meowgram.</h1>
          <p>The social network exclusively for our feline friends.</p>
          <span>Do you have an account?</span>
          <Link to="/login">
            <button>Login</button>
          </Link>
        </div>
        <div className="right">
          <h1>Register</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Your Name"
              name="name"
              onChange={handleChange}
              value={formInputs.name}
              required
            />
            <input
              type="text"
              placeholder="Unique Username"
              name="username"
              onChange={handleChange}
              value={formInputs.username}
              required
            />
            <input
              type="email"
              placeholder="Email"
              name="email"
              onChange={handleChange}
              value={formInputs.email}
              required
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              onChange={handleChange}
              value={formInputs.password}
              required
            />
            {error && <span className="error-message">{error}</span>}
            <button type="submit">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
}

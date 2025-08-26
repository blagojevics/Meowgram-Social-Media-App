import { Link, useNavigate } from "react-router-dom";
import "./login.scss";
import { useState } from "react";
import { auth } from "../../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

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
            <button type="button">Register!</button>{" "}
          </Link>
        </div>
        <div className="right">
          <h1>Login</h1>
          <form onSubmit={handleLogin}>
            {" "}
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
            {err && <span style={{ color: "red" }}>{err}</span>}{" "}
            <button type="submit">Login!</button>{" "}
          </form>
        </div>
      </div>
    </div>
  );
}

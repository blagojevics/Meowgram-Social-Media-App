import { useEffect, useState } from "react";
import { auth } from "../../config/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload(); // refresh user data
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          navigate("/onboarding"); // go straight to onboarding
        }
      }
    }, 5000); // check every 5 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  const handleResend = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      setStatus("Verification email sent again!");
    }
  };

  return (
    <div className="verify-email-page">
      <h2>Verify your email</h2>
      <p>
        We sent a verification link to <b>{auth.currentUser?.email}</b>. <br />
        Please check your inbox and click the link to continue.
      </p>
      <button onClick={handleResend}>Resend Email</button>
      {status && <p>{status}</p>}
    </div>
  );
}

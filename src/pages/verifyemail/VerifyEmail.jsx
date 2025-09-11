import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../config/firebase";
import { sendEmailVerification } from "firebase/auth";

export default function VerifyEmail() {
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          navigate("/onboarding");
        }
      }
    }, 3000);

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
        Once verified, you’ll be redirected automatically.
      </p>
      <button onClick={handleResend}>Resend Email</button>
      {status && <p>{status}</p>}
    </div>
  );
}

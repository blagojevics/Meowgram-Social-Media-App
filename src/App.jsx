import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import VerifyEmail from "./pages/verifyEmail/VerifyEmail";
import Settings from "./pages/settings/Settings";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";
import Leftbar from "./components/leftbar/Leftbar";
import Rightbar from "./components/rightbar/Rightbar";
import Home from "./pages/homepage/Home";
import Profile from "./pages/profile/Profile";
import Onboarding from "./pages/onboarding/Onboarding";
import AddPost from "./pages/addpost/AddPost";
import Search from "./pages/search/Search";
import Notifications from "./pages/notifications/Notifications";
import { useEffect, useState } from "react";
import "./style.scss";
import { auth, db } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

const ProtectedRoute = ({ children, currentUser, userProfileCompleted }) => {
  const location = useLocation();

  if (currentUser === undefined || userProfileCompleted === undefined) {
    return <div>Loading...</div>;
  }

  // Not logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but email not verified
  if (currentUser && !currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // Verified but not onboarded
  if (userProfileCompleted === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Already onboarded but trying to access onboarding
  if (userProfileCompleted === true && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [userProfileCompleted, setUserProfileCompleted] = useState(undefined);

  const Layout = () => {
    return (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Leftbar currentUser={currentUser} />
        <Outlet />
        <Rightbar />
      </div>
    );
  };

  useEffect(() => {
    let unsubscribeDoc;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }
      if (user) {
        const ref = doc(db, "users", user.uid);
        unsubscribeDoc = onSnapshot(ref, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setCurrentUser({ ...user, ...data });
            setUserProfileCompleted(!!data.onboardingComplete);
          } else {
            setCurrentUser(user);
            setUserProfileCompleted(false);
          }
        });
      } else {
        setCurrentUser(null);
        setUserProfileCompleted(undefined);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute
          currentUser={currentUser}
          userProfileCompleted={userProfileCompleted}
        >
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Home currentUser={currentUser} /> },
        { path: "profile/:id", element: <Profile currentUser={currentUser} /> },
        { path: "addpost", element: <AddPost currentUser={currentUser} /> },
        { path: "search", element: <Search currentUser={currentUser} /> },
        {
          path: "notifications",
          element: <Notifications currentUser={currentUser} />,
        },
        {
          path: "settings",
          element: <Settings currentUser={currentUser} />,
        },
      ],
    },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    {
      path: "/onboarding",
      element: (
        <ProtectedRoute
          currentUser={currentUser}
          userProfileCompleted={userProfileCompleted}
        >
          <Onboarding currentUser={currentUser} />
        </ProtectedRoute>
      ),
    },
    { path: "/verify-email", element: <VerifyEmail /> },
  ]);

  return <RouterProvider router={router} />;
}

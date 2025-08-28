import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
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
import { useEffect, useState } from "react";
import "./style.scss";
import { auth, db } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children, currentUser, userProfileCompleted }) => {
  const location = useLocation();

  if (currentUser === undefined || userProfileCompleted === undefined) {
    return <div>Loading authentication...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  if (userProfileCompleted === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" state={{ from: location }} />;
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({
            ...user,
            ...userData,
          });

          if (userData.avatarUrl && userData.bio) {
            setUserProfileCompleted(true);
          } else {
            setUserProfileCompleted(false);
          }
        } else {
          setCurrentUser(user);
          setUserProfileCompleted(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfileCompleted(undefined);
      }
    });
    return () => unsubscribe();
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
        { index: true, element: <Home /> },
        { path: "profile/:id", element: <Profile currentUser={currentUser} /> },
        { path: "addpost", element: <AddPost currentUser={currentUser} /> },
      ],
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
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
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

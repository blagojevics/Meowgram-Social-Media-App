import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";
import Leftbar from "./components/leftbar/Leftbar";
import Rightbar from "./components/rightbar/Rightbar";
import Home from "./pages/homepage/Home";
import Profile from "./pages/profile/Profile";
import Onboarding from "./pages/onboarding/Onboarding";
import { Children, useEffect, useState } from "react";
import "./style.scss";
import { auth } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [currentUser, setCurrentUser] = useState(undefined);

  const Layout = () => {
    return (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Leftbar />
        <Outlet />
        <Rightbar />
      </div>
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (currentUser === undefined) {
      return <div>Loading authentication...</div>;
    }
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Home /> },
        { path: "profile/:id", element: <Profile /> },
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
        <ProtectedRoute>
          <Onboarding />
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

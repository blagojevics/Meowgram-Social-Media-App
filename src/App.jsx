import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Leftbar from "./components/leftbar/Leftbar";
import Rightbar from "./components/rightbar/Rightbar";
import Home from "./pages/homepage/Home";
import Profile from "./pages/profile/Profile";
import Onboarding from "./pages/onboarding/Onboarding";
import AddPost from "./pages/addpost/AddPost";
import Search from "./pages/search/Search";
import Notifications from "./pages/notifications/Notifications";
import Settings from "./pages/settings/Settings";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import VerifyEmail from "./pages/verifyEmail/VerifyEmail";
import "./style.scss";

// Layout wrapper
const Layout = () => {
  const { authUser } = useAuth();
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <Leftbar currentUser={authUser} />
      <Outlet />
      <Rightbar />
    </div>
  );
};

// ProtectedRoute
const ProtectedRoute = ({ children }) => {
  const { authUser, userDoc } = useAuth();
  const location = useLocation();

  // Still loading
  if (authUser === undefined || userDoc === undefined) {
    return <div>Loading...</div>;
  }

  // Not logged in
  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but email not verified
  if (!authUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // Verified but not onboarded
  if (
    userDoc &&
    userDoc.onboardingComplete === false &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  // Already onboarded but trying to access onboarding
  if (
    userDoc &&
    userDoc.onboardingComplete === true &&
    location.pathname === "/onboarding"
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
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
        { path: "addpost", element: <AddPost /> },
        { path: "search", element: <Search /> },
        { path: "notifications", element: <Notifications /> },
        { path: "settings", element: <Settings /> },
      ],
    },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    {
      path: "/onboarding",
      element: (
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      ),
    },
    { path: "/verify-email", element: <VerifyEmail /> },
  ]);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

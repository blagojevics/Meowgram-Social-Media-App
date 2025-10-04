import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import Leftbar from "./components/leftbar/Leftbar";
import Rightbar from "./components/rightbar/Rightbar";
import Home from "./pages/homepage/Home";
import Profile from "./pages/profile/Profile";
import Onboarding from "./pages/onboarding/Onboarding";
import AddPost from "./pages/addpost/AddPost";
import Search from "./pages/search/Search";
import Notifications from "./pages/notifications/Notifications";
import Settings from "./pages/settings/Settings";
import Chat from "./pages/chat/Chat";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import VerifyEmail from "./pages/verifyemail/VerifyEmail";
import PostPage from "./components/post/PostPage";
import LoadingSpinner from "./components/loading/LoadingSpinner";
import ThemeToggle from "./components/themetoggle/ThemeToggle";
import ChatPage from "./pages/ChatPage";
import "./style.scss";

const Layout = () => {
  const { authUser } = useAuth();
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Leftbar currentUser={authUser} />
      {/* --- THIS IS THE FIX --- */}
      {/* We wrap the Outlet in a main tag to control its styling */}
      <main className="main-content">
        <Outlet />
      </main>
      {/* --- END OF FIX --- */}
      <Rightbar />
    </div>
  );
};

// ... (The rest of your App.jsx file remains exactly the same) ...

// --- The code below is unchanged ---
const ProtectedRoute = ({ children }) => {
  const { authUser, userDoc } = useAuth();
  const location = useLocation();

  if (authUser === undefined || userDoc === undefined) {
    return <LoadingSpinner text="Starting Meowgram..." size="large" />;
  }

  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!authUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (
    userDoc &&
    userDoc.onboardingComplete === false &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

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
        { path: "chat", element: <Chat /> },
        { path: "messages", element: <ChatPage /> },
        { path: "messages/:chatId", element: <ChatPage /> },
        { path: "notifications", element: <Notifications /> },
        { path: "settings", element: <Settings /> },
        { path: "post/:postId", element: <PostPage /> },
        { path: "chatpage", element: <ChatPage /> },
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
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

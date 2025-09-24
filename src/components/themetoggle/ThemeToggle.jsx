import { useTheme } from "../../contexts/ThemeContext";
import { FaMoon, FaSun } from "react-icons/fa";
import "./themeToggle.scss";

export default function ThemeToggle({ isMobile = false }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${isMobile ? "mobile" : "desktop"}`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <FaMoon className="theme-icon moon-icon" />
      ) : (
        <FaSun className="theme-icon sun-icon" />
      )}
    </button>
  );
}

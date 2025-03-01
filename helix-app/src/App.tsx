import { useState, useEffect , useCallback} from "react";
import HomePage from "./components/HomePage";
import ChatWorkspacePage from "./components/ChatWorkspacePage";

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [isWorkspacePage, setIsWorkspacePage] = useState<boolean>(false);
  const [sessions, setSessions] = useState<Array<string>>([])
  const [token, setToken] = useState<string|null>(null)

  useEffect(() => {
    const token = localStorage.getItem("guestToken");
    if (!token) {
      fetch("http://127.0.0.1:5000/guest/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.guest_token) {
            localStorage.setItem("guestToken", data.guest_token);
          }
        })
        .catch((error) => console.error("Error during guest login:", error));
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = (): void => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      {isWorkspacePage ? (
        <ChatWorkspacePage
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onBack={() => setIsWorkspacePage(false)}
          onWorkspaceUpdate={() => {}}
        />
      ) : (
        <HomePage
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onStartSequence={() => setIsWorkspacePage(true)}
        />
      )}
    </div>
  );
};

export default App;

import React, { useState, useEffect, useCallback } from "react";
import { Plus, MessageSquare, PanelsLeftBottom} from "lucide-react";

interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
  lastMessage: string;
}

const ChatSidebar = ({
  onSelectSession,
  onNewChat,
  currentSessionId,
  showSidebar,
  setShowSidebar,
}: {
  onSelectSession: (id: string) => void;
  onNewChat: () => Promise<void>;
  currentSessionId?: string;
  showSidebar: boolean;
  setShowSidebar: (showSidebar: boolean) => void;
}) => {
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadChatSessions()
  },[])


  useEffect(() => {
    const fetchSessions = () => {
      const allSessions: ChatSession[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("chat_history_")) {
          try {
            const sessionId = key.replace("chat_history_", "");
            const messages = JSON.parse(localStorage.getItem(key) || "[]");
            const lastMessage = messages[messages.length - 1];
            const workspaceData = localStorage.getItem(
              `workspace_${sessionId}`
            );
            const workspace = workspaceData ? JSON.parse(workspaceData) : null;
            const firstStep = workspace?.steps?.[0]?.content;

            allSessions.push({
              session_id: sessionId,
              title: firstStep?.slice(0, 30) || `${sessionId.slice(0, 3)} Chat`,
              created_at:
                lastMessage?.timestamp || new Date().toLocaleTimeString(),
              lastMessage: lastMessage?.content || "No messages yet",
            });
          } catch (error) {
            console.error("Error parsing session:", error);
          }
        }
      }

      setSessions(
        allSessions.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);

    return () => clearInterval(interval);
  }, [currentSessionId]);

  const loadChatSessions = useCallback(async (): Promise<string | null> => {
    const guestToken = localStorage.getItem("guestToken");
    if (!guestToken) {
      throw new Error("Guest token not found");
    }
    try {
      const response = await fetch(`http://127.0.0.1:5000/sessions?guest_token=${guestToken}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      console.log(data, ' get data')
      if (data?.sessions.length > 0) {
        console.log(data.sessions,'api data');
        return data.history;
      }
      return null;
    } catch (error) {
      console.error("Error loading chat sessions:", error);
      return null;
    }
  }, []);
  const handleNewChat = async () => {
    setIsLoading(true);
    try {
      await onNewChat();
    } catch (error) {
      console.error("Error creating new chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col h-full border-r border-gray-200 dark:border-gray-700/50">

      <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className={`flex-1 px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg 
                      flex items-center justify-center gap-2 transition-colors
                      ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center justify-center p-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Toggle Sidebar"
          >
            <PanelsLeftBottom className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
        
        <div className="mt-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chats</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.session_id}
            onClick={() => onSelectSession(session.session_id)}
            className={`p-3 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50
              ${
                currentSessionId === session.session_id
                  ? "bg-purple-50 dark:bg-purple-900/30"
                  : ""
              }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">{session.created_at}</span>
            </div>
            <h3 className="font-medium text-gray-800 dark:text-white text-sm mb-1 truncate">
              {session.title ? session.title : "New Chat"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session.lastMessage ? session.lastMessage : "hey there !"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Moon, Sun, Truck, PanelsLeftBottom } from "lucide-react";
import Chat from "./chat/Chat";
import Workspace from "./workspace/Workspace";
import ChatSidebar from "./chat/ChatSidebar";
import { ChatRef, ChatWorkspacePageProps, Sequence } from "../types";

const getInitialSessionId = (): string => {
  const stored = localStorage.getItem("sessionId");
  return stored ? stored : "1";
};

const ChatWorkspacePage: React.FC<ChatWorkspacePageProps> = ({
  isDarkMode,
  toggleDarkMode,
  onBack,
  onWorkspaceUpdate = () => {},
}) => {
  const [editingStep, setEditingStep] = useState<{ index: number; content: string } | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [sequence, setSequence] = useState<Sequence>({ steps: [] });
  const [sessionId, setSessionId] = useState<string>(getInitialSessionId());
  const [isListening, setIsListening] = useState(true);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  
  const chatRef = useRef<ChatRef>(null);

  useEffect(() => {
    const storedWorkspace = localStorage.getItem("workspace_" + sessionId);
    console.log(storedWorkspace,"storedWorkspace");
    console.log(sessionId,"sessionId");
    console.log(sequence,"sequence");
    if (storedWorkspace) {
      try {
        setSequence(JSON.parse(storedWorkspace));
      } catch (error) {
        console.error("Error parsing stored workspace:", error);
        setSequence({ steps: [] });
      }
    } else {
      setSequence({ steps: [] });
      localStorage.setItem("workspace_" + sessionId, JSON.stringify({ steps: [] }));
    }
  }, [sessionId]);

  const handleSocketReady = useCallback((socketRef: any) => {
    setSocket(socketRef);
    setIsListening(false);
  }, []);

  const handleEditStep = useCallback((index: number, content: string) => {
    setEditingStep({ index, content });
  }, []);

  const handleClearChatEditing = useCallback(() => {
    chatRef.current?.clearEditingStep();
  }, []);

  const handleDeleteStep = useCallback((index: number) => {
    setSequence(prev => {
      const updated = { steps: prev.steps.filter((_, i) => i !== index) };
      localStorage.setItem("workspace_" + sessionId, JSON.stringify(updated));
      return updated;
    });
    if (editingStep?.index === index) {
      setEditingStep(null);
    }
  }, [sessionId, editingStep]);

  const handleWorkspaceUpdateCallback = useCallback((workspaceData: any) => {
    setIsListening(false);
    if (typeof workspaceData === "string") {
      const trimmed = workspaceData.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsedData = JSON.parse(trimmed);
          const updatedSequence = {
            steps: parsedData.map((step: any) => ({
              id: step.step_number?.toString() || Math.random().toString(36).substr(2, 9),
              content: typeof step.content === "string"
                ? step.content.replace(/\\n/g, "\n")
                : step.content,
              phase: step.phase || "",
            })),
          };
          setSequence(updatedSequence);
          localStorage.setItem("workspace_" + sessionId, JSON.stringify(updatedSequence));
        } catch (error) {
          console.error("Error parsing workspace update as JSON:", error);
          onWorkspaceUpdate(trimmed);
        }
      } else {
        onWorkspaceUpdate(trimmed);
      }
    } else if (Array.isArray(workspaceData)) {
      const updatedSequence = {
        steps: workspaceData.map((step: any) => ({
          id: step.step_number?.toString(),
          content: typeof step.content === "string"
            ? step.content.replace(/\\n/g, "\n")
            : step.content,
          phase: step.phase || "",
        })),
      };
      setSequence(updatedSequence);
      localStorage.setItem("workspace_" + sessionId, JSON.stringify(updatedSequence));
    } else {
      onWorkspaceUpdate(workspaceData);
    }
  }, [sessionId, onWorkspaceUpdate]);

  // Create a new session by calling your backend endpoint
  const createSession = useCallback(async (): Promise<string> => {
    const guestToken = localStorage.getItem("guestToken");
    if (!guestToken) {
      throw new Error("Guest token not found");
    }
    try {
      const response = await fetch("http://127.0.0.1:5000/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_token: guestToken }),
      });
      const data = await response.json();
      if (data.session_id) return data.session_id;
      throw new Error("Session creation failed");
    } catch (error) {
      console.error("Session creation error:", error);
      return "1"; // Fallback session ID
    }
  }, []);


  const handleNewChat = useCallback(async () => {
    const newSessionId = await createSession();
    if (newSessionId) {
      setSessionId(newSessionId);
      localStorage.setItem("sessionId", newSessionId);
      localStorage.setItem("chat_history_" + newSessionId, JSON.stringify([]));
      localStorage.setItem("workspace_" + newSessionId, JSON.stringify({ steps: [] }));
      setSequence({ steps: [] });
      setEditingStep(null);
    }
  }, [createSession]);


  const handleSelectSession = useCallback((id: string) => {
    setSessionId(id);
    console.log(id)
    localStorage.setItem("sessionId", id);
    setEditingStep(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-800 dark:text-white flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-800 dark:bg-white rounded-xl flex items-center justify-center">
                <span className="text-white dark:text-gray-800 text-xl">R</span>
              </div>
              <span className="text-gray-800 dark:text-white font-medium">RecruitFlow</span>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-100" />
            ) : (
              <Moon className="w-5 h-5 text-gray-800" />
            )}
          </button>
        </div>


        <div className="flex gap-2 h-[calc(100vh-8rem)]">
          {showSidebar ? (
            <ChatSidebar 
              onSelectSession={handleSelectSession} 
              onNewChat={handleNewChat} 
              currentSessionId={sessionId} 
              showSidebar={showSidebar}
              setShowSidebar={setShowSidebar}
            />
          ) : (
            <button
              onClick={() => setShowSidebar(true)}
              className="flex items-center justify-center p-2 h-10 self-start mt-4 ml-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Show Sidebar"
            >
              <PanelsLeftBottom className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
       
          <div className="flex flex-1 gap-2">
            <Chat
              ref={chatRef}
              sessionId={sessionId}
              editingStep={editingStep}
              onWorkspaceUpdate={handleWorkspaceUpdateCallback}
              onSocketReady={handleSocketReady}
              isListening={isListening}
              setIsListening={setIsListening}
              showSimulationModal={showSimulationModal}
              setShowSimulationModal={setShowSimulationModal}
              showSidebar={showSidebar}
              setShowSidebar={setShowSidebar}
            />
            <Workspace
              sessionId={sessionId}
              sequence={sequence}
              onEditStep={handleEditStep}
              onDeleteStep={handleDeleteStep}
              socket={socket}
              onClearChatEditing={handleClearChatEditing}
              isListening={isListening}
              setIsListening={setIsListening}
              showSimulationModal={showSimulationModal}
              setShowSimulationModal={setShowSimulationModal}

            
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWorkspacePage;
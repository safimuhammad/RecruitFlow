// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
//   useImperativeHandle,
//   forwardRef,
// } from "react";
// import { Send, X } from "lucide-react";
// import ChatMessage from "./ChatMessage";
// import { Message, ChatProps, ChatRef } from "../../types";
// import io from "socket.io-client";

// interface ExtendedChatProps extends ChatProps {
//   sessionId: string;
//   onWorkspaceUpdate: (workspaceData: any) => void;
//   onSocketReady: (socket: any) => void;
//   isListening: boolean;
//   setIsListening: (isListening: boolean) => void;
//   showSimulationModal: boolean;
//   setShowSimulationModal: (showSimulationModal: boolean) => void;
//   showSidebar: boolean;
//   setShowSidebar: (showSidebar: boolean) => void;
// }
// const Chat = forwardRef<ChatRef, ExtendedChatProps>(
//   ({ sessionId, editingStep, onWorkspaceUpdate, onSocketReady, isListening, setIsListening, showSimulationModal, setShowSimulationModal, showSidebar, setShowSidebar }, ref) => {
//     const [inputValue, setInputValue] = useState<string>("");
//     const [messages, setMessages] = useState<Message[]>([]);
//     const [isEditing, setIsEditing] = useState(false);
//     const [showThinking, setShowThinking] = useState(false);
//     const messagesEndRef = useRef<HTMLDivElement>(null);
//     const socketRef = useRef<any>(null);
//     const responseTimerRef = useRef<NodeJS.Timeout | null>(null);

//     useEffect(() => {
//       if (sessionId) {
//         const storedMessages = localStorage.getItem(
//           "chat_history_" + sessionId
          
//         );
//         loadChatFromSessionId()
//         if (storedMessages) {
//           setMessages(JSON.parse(storedMessages));
//         } else {
//           setMessages([]);
//         }
//       }

//     }, [sessionId]);

//     const loadChatFromSessionId = useCallback(async (): Promise<Array<string|null>> => {
//       const guestToken = localStorage.getItem("guestToken");
//       if (!guestToken) {
//         throw new Error("Guest token not found");
//       }
//       const response = await fetch(
//         `http://127.0.0.1:5000/session/${sessionId}/history?guest_token=${guestToken}`,
//         {
//           method: "GET",
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//       const data = await response.json();
//       console.log(data,"chat histry", sessionId , "session")
//       return data?.history || [];
//     }, [sessionId]);

//     useEffect(() => {
//       if (sessionId) {
//         localStorage.setItem(
//           "chat_history_" + sessionId,
//           JSON.stringify(messages)
//         );
//       }
//     }, [messages, sessionId]);

//     const getAuthPayload = () => {
//       const guestToken = localStorage.getItem("guestToken");
//       return { guest_token: guestToken, session_id: sessionId };
//     };
//     useEffect(() => {
//       if (!sessionId) return;
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//         socketRef.current = null;
//       }
//       socketRef.current = io("http://127.0.0.1:5000/chat", {
//         reconnection: true,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 5000,
//         reconnectionAttempts: 5,
//       });

//       socketRef.current.on("connect", () => {
//         const guestToken = localStorage.getItem("guestToken");
//         let threadId = localStorage.getItem("thread_id_" + sessionId);
//         if (!threadId) {
//           threadId = Math.random().toString(36).substr(2, 9);
//           localStorage.setItem("thread_id_" + sessionId, threadId);
//         }

//         socketRef.current.emit("send_message", {
//           guest_token: guestToken,
//           session_id: sessionId,
//           thread_id: threadId,
//         });


//         const companyContext = localStorage.getItem("companyContext");
//         if (companyContext) {
//           try {
//             const parsedContext = JSON.parse(companyContext);
//             socketRef.current.emit("send_message", {
//               text: JSON.stringify(parsedContext),
//               guest_token: guestToken,
//               session_id: sessionId,
//             });
//           } catch (error) {
//             console.error("Error parsing company context:", error);
//           }
//         }
//       });

//       onSocketReady(socketRef.current);

//       socketRef.current.on("receive_message", (msg: { data: string }) => {
//         if (responseTimerRef.current) {
//           clearTimeout(responseTimerRef.current);
//           responseTimerRef.current = null;
//         }
//         setShowThinking(false);
//         setIsListening(false);
        
//         setMessages(prev => prev.filter(message => message.content !== "Thinking..."));
        
//         setMessages((prev) => [
//           ...prev,
//           {
//             id: new Date().getTime().toString(),
//             content: msg.data,
//             isSystem: true,
//             timestamp: new Date().toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//           },
//         ]);
//       });

//       socketRef.current.on("workspace_update", (msg: { workspace: any }) => {
//         if (msg.workspace) {
//           let workspaceData = msg.workspace;
//           console.log(workspaceData, "workspaceData");
//           if (typeof msg.workspace === "string") {
//             try {
//               workspaceData = JSON.parse(msg.workspace);
//             } catch (error) {
//               console.error("Error parsing workspace update:", error);
//               workspaceData = msg.workspace;
//             }
//           }
//           localStorage.setItem(
//             "workspace_" + sessionId,
//             JSON.stringify(workspaceData)
//           );
//           onWorkspaceUpdate(workspaceData);
//         }
//       });

//       socketRef.current.on("error_message", (msg: { error: any }) => {
//         if (msg.error) {
//           onWorkspaceUpdate(msg.error);
//         }
//       });
//       return () => {
//         if (socketRef.current) {
//           socketRef.current.disconnect();
//           socketRef.current = null;
//         }
//       };
//     }, [sessionId, onSocketReady, onWorkspaceUpdate]);

//     useEffect(() => {
//       if (editingStep) {
//         setIsEditing(true);
//         setMessages((prev) => [
//           ...prev,
//           {
//             id: new Date().getTime().toString(),
//             content: `Editing Step ${editingStep.index + 1}`,
//             isSystem: true,
//             timestamp: new Date().toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//           },
//         ]);
//       } else {
//         setIsEditing(false);
//       }
//     }, [editingStep]);

//     const sendMessage = useCallback(
//       (messageData: {
//         text: string;
//         step_number?: number;
//         step_content?: string;
//         is_edit?: boolean;
//       }) => {
//         setMessages((prev) => [
//           ...prev,
//           {
//             id: new Date().getTime().toString(),
//             content: messageData.text,
//             isSystem: false,
//             timestamp: new Date().toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//           },
//         ]);
        
//         if (responseTimerRef.current) {
//           clearTimeout(responseTimerRef.current);
//         }
        
//         responseTimerRef.current = setTimeout(() => {
//           setShowThinking(true);
//           setMessages(prev => [
//             ...prev,
//             {
//               id: new Date().getTime().toString() + "-thinking",
//               content: "Thinking...",
//               isSystem: true,
//               timestamp: new Date().toLocaleTimeString([], {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               }),
//             }
//           ]);
//         }, 2000);
        
//         socketRef.current?.emit("send_message", {
//           ...messageData,
//           ...getAuthPayload(),
//         });
//       },
//       [sessionId]
//     );

//     const resetHistory = useCallback(() => {
//       setMessages([]);
//       if (responseTimerRef.current) {
//         clearTimeout(responseTimerRef.current);
//         responseTimerRef.current = null;
//       }
//       setShowThinking(false);
//       if (socketRef.current?.connected) {
//         socketRef.current.emit("send_message", {
//           text: "Starting new sequence",
//           ...getAuthPayload(),
//         });
//       }
//     }, [sessionId]);

//     useImperativeHandle(ref, () => ({
//       sendMessage,
//       resetHistory,
//       clearEditingStep: () => setIsEditing(false),
//     }));

//     const scrollToBottom = () => {
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     };

//     useEffect(scrollToBottom, [messages]);

//     const handleInputChange = (
//       e: React.ChangeEvent<HTMLInputElement>
      
//     ): void => {
//       setInputValue(e.target.value);
//       setShowSidebar(false);

//     };

//     const handleSend = (): void => {
//       if (!inputValue.trim()) return;
//       const payload = { text: inputValue, ...getAuthPayload() };
//       if (isEditing && editingStep) {
//         socketRef.current.emit("send_message", {
//           text: inputValue,
//           step_number: editingStep.index + 1,
//           step_content: editingStep.content,
//           is_edit: true,
//           ...getAuthPayload(),
//         });        
//         console.log("isListening", isListening);
//         setMessages((prev) => [
//           ...prev,
//           {
//             id: new Date().getTime().toString(),
//             content: inputValue,
//             isSystem: false,
//             timestamp: new Date().toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//           },
//         ]);
        
//         if (responseTimerRef.current) {
//           clearTimeout(responseTimerRef.current);
//         }
        
//         responseTimerRef.current = setTimeout(() => {
//           setShowThinking(true);
//           setMessages(prev => [
//             ...prev,
//             {
//               id: new Date().getTime().toString() + "-thinking",
//               content: "Thinking...",
//               isSystem: true,
//               timestamp: new Date().toLocaleTimeString([], {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               }),
//             }
//           ]);
//         }, 2000);
        
//         setInputValue("");
//         setIsEditing(false);
//         return;
//       }
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: new Date().getTime().toString(),
//           content: inputValue,
//           isSystem: false,
//           timestamp: new Date().toLocaleTimeString([], {
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//         },
//       ]);
      
//       if (responseTimerRef.current) {
//         clearTimeout(responseTimerRef.current);
//       }
      
//       responseTimerRef.current = setTimeout(() => {
//         setShowThinking(true);
//         setMessages(prev => [
//           ...prev,
//           {
//             id: new Date().getTime().toString() + "-thinking",
//             content: "Thinking...",
//             isSystem: true,
//             timestamp: new Date().toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//           }
//         ]);
//       }, 2000);
      
//       socketRef.current.emit("send_message", payload);
//       setInputValue("");
//     };

//     const cancelEditing = () => {
//       setIsEditing(false);
//       if (responseTimerRef.current) {
//         clearTimeout(responseTimerRef.current);
//         responseTimerRef.current = null;
//       }
//       setShowThinking(false);
//     };

//     return (
//       <div className="w-[30%] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-lg flex flex-col mr-2">
//         <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
//           <h2 className="text-lg font-medium text-gray-800 dark:text-white">
//             Helix Copilot
//           </h2>
//         </div>
//         <div className="flex-1 overflow-y-auto p-4 space-y-1">
//           {messages.map((msg) =>
//             msg.id ? (
//               <ChatMessage
//                 key={msg.id}
//                 isSystem={msg.isSystem}
//                 content={msg.content}
//                 timestamp={msg.timestamp}
//                 showSimulationModal={showSimulationModal}
//                 setShowSimulationModal={setShowSimulationModal}
//                 isThinking={msg.content === "Thinking..."}
//               />
//             ) : null
//           )}
//           <div ref={messagesEndRef} />
//         </div>
//         <div className="p-4 bg-white/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50">
//           <div className="flex items-center gap-2">
//             <input
//               type="text"
//               value={inputValue}
//               onChange={handleInputChange}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter") handleSend();
//                 else if (e.key === "Escape" && isEditing) cancelEditing();
//               }}
//               className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-700/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50 transition-all"
//               placeholder={
//                 isEditing ? "Type your edit instruction..." : "Message Helix..."
//               }
//             />
//             {isEditing && (
//               <button
//                 onClick={cancelEditing}
//                 className="p-2.5 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
//               >
//                 <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
//               </button>
//             )}
//             <button
//               onClick={() => {handleSend(); setIsListening(true);}}
//               className="p-2.5 bg-black dark:bg-white rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center"
//             >
//               <Send className="w-4 h-4 text-white dark:text-gray-800" />
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }
// );

// export default Chat;



import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Send, X } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { Message, ChatProps, ChatRef } from "../../types";
import io from "socket.io-client";

interface ExtendedChatProps extends ChatProps {
  sessionId: string;
  onWorkspaceUpdate: (workspaceData: any) => void;
  onSocketReady: (socket: any) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
  showSimulationModal: boolean;
  setShowSimulationModal: (showSimulationModal: boolean) => void;
  showSidebar: boolean;
  setShowSidebar: (showSidebar: boolean) => void;
}

// List of available tools
const AVAILABLE_TOOLS = [
  "run_simulation",
  "get_chat_history",
  "get_workspace_history",
];

// Gemini API key - in production, use environment variables or a secure method
const GEMINI_API_KEY = "AIzaSyAt-asBJuwpVwd6636ZqVJUTcF_pTtegFk"; // Replace with your actual API key

const Chat = forwardRef<ChatRef, ExtendedChatProps>(
  ({ sessionId, editingStep, onWorkspaceUpdate, onSocketReady, isListening, setIsListening, showSimulationModal, setShowSimulationModal, showSidebar, setShowSidebar }, ref) => {
    const [inputValue, setInputValue] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [showThinking, setShowThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<any>(null);
    const responseTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (sessionId) {
        const storedMessages = localStorage.getItem(
          "chat_history_" + sessionId
        );
        loadChatFromSessionId();
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        } else {
          setMessages([]);
        }
      }
    }, [sessionId]);

    const loadChatFromSessionId = useCallback(async (): Promise<Array<string|null>> => {
      const guestToken = localStorage.getItem("guestToken");
      if (!guestToken) {
        throw new Error("Guest token not found");
      }
      const response = await fetch(
        `http://127.0.0.1:5000/session/${sessionId}/history?guest_token=${guestToken}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      console.log(data,"chat histry", sessionId , "session");
      return data?.history || [];
    }, [sessionId]);

    useEffect(() => {
      if (sessionId) {
        localStorage.setItem(
          "chat_history_" + sessionId,
          JSON.stringify(messages)
        );
      }
    }, [messages, sessionId]);

    const getAuthPayload = () => {
      const guestToken = localStorage.getItem("guestToken");
      return { guest_token: guestToken, session_id: sessionId };
    };

    useEffect(() => {
      if (!sessionId) return;
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      socketRef.current = io("http://127.0.0.1:5000/chat", {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current.on("connect", () => {
        const guestToken = localStorage.getItem("guestToken");
        let threadId = localStorage.getItem("thread_id_" + sessionId);
        if (!threadId) {
          threadId = Math.random().toString(36).substr(2, 9);
          localStorage.setItem("thread_id_" + sessionId, threadId);
        }

        socketRef.current.emit("send_message", {
          guest_token: guestToken,
          session_id: sessionId,
          thread_id: threadId,
        });

        const companyContext = localStorage.getItem("companyContext");
        if (companyContext) {
          try {
            const parsedContext = JSON.parse(companyContext);
            socketRef.current.emit("send_message", {
              text: JSON.stringify(parsedContext),
              guest_token: guestToken,
              session_id: sessionId,
            });
          } catch (error) {
            console.error("Error parsing company context:", error);
          }
        }
      });

      onSocketReady(socketRef.current);

      socketRef.current.on("receive_message", (msg: { data: string }) => {
        if (responseTimerRef.current) {
          clearTimeout(responseTimerRef.current);
          responseTimerRef.current = null;
        }
        setShowThinking(false);
        setIsListening(false);
        
        setMessages(prev => prev.filter(message => message.content !== "Thinking..."));
        
        setMessages((prev) => [
          ...prev,
          {
            id: new Date().getTime().toString(),
            content: msg.data,
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      });

      socketRef.current.on("workspace_update", (msg: { workspace: any }) => {
        if (msg.workspace) {
          let workspaceData = msg.workspace;
          console.log(workspaceData, "workspaceData");
          if (typeof msg.workspace === "string") {
            try {
              workspaceData = JSON.parse(msg.workspace);
            } catch (error) {
              console.error("Error parsing workspace update:", error);
              workspaceData = msg.workspace;
            }
          }
          localStorage.setItem(
            "workspace_" + sessionId,
            JSON.stringify(workspaceData)
          );
          onWorkspaceUpdate(workspaceData);
        }
      });

      socketRef.current.on("error_message", (msg: { error: any }) => {
        if (msg.error) {
          onWorkspaceUpdate(msg.error);
        }
      });
      
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }, [sessionId, onSocketReady, onWorkspaceUpdate]);

    useEffect(() => {
      if (editingStep) {
        setIsEditing(true);
        setMessages((prev) => [
          ...prev,
          {
            id: new Date().getTime().toString(),
            content: `Editing Step ${editingStep.index + 1}`,
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      } else {
        setIsEditing(false);
      }
    }, [editingStep]);

    const sendMessage = useCallback(
      (messageData: {
        text: string;
        step_number?: number;
        step_content?: string;
        is_edit?: boolean;
      }) => {
        setMessages((prev) => [
          ...prev,
          {
            id: new Date().getTime().toString(),
            content: messageData.text,
            isSystem: false,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        
        if (responseTimerRef.current) {
          clearTimeout(responseTimerRef.current);
        }
        
        responseTimerRef.current = setTimeout(() => {
          setShowThinking(true);
          setMessages(prev => [
            ...prev,
            {
              id: new Date().getTime().toString() + "-thinking",
              content: "Thinking...",
              isSystem: true,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          ]);
        }, 2000);
                
        socketRef.current?.emit("send_message", {
          ...messageData,
          ...getAuthPayload(),
        });
      },
      [messages, sessionId]
    );

    const resetHistory = useCallback(() => {
      setMessages([]);
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }
      setShowThinking(false);
      if (socketRef.current?.connected) {
        socketRef.current.emit("send_message", {
          text: "Starting new sequence",
          ...getAuthPayload(),
        });
      }
    }, [sessionId]);

    useImperativeHandle(ref, () => ({
      sendMessage,
      resetHistory,
      clearEditingStep: () => setIsEditing(false),
    }));

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ): void => {
      setInputValue(e.target.value);
      setShowSidebar(false);
    };

    const handleSend = (): void => {
      if (!inputValue.trim()) return;
      
      if (isEditing && editingStep) {
        socketRef.current.emit("send_message", {
          text: inputValue,
          step_number: editingStep.index + 1,
          step_content: editingStep.content,
          is_edit: true,
          ...getAuthPayload(),
        });
        
        console.log("isListening", isListening);
        setMessages((prev) => [
          ...prev,
          {
            id: new Date().getTime().toString(),
            content: inputValue,
            isSystem: false,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
                
        if (responseTimerRef.current) {
          clearTimeout(responseTimerRef.current);
        }
        
        responseTimerRef.current = setTimeout(() => {
          setShowThinking(true);
          setMessages(prev => [
            ...prev,
            {
              id: new Date().getTime().toString() + "-thinking",
              content: "Thinking...",
              isSystem: true,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          ]);
        }, 2000);
        
        setInputValue("");
        setIsEditing(false);
        return;
      }
      
      setMessages((prev) => [
        ...prev,
        {
          id: new Date().getTime().toString(),
          content: inputValue,
          isSystem: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
      }
      
      responseTimerRef.current = setTimeout(() => {
        setShowThinking(true);
        setMessages(prev => [
          ...prev,
          {
            id: new Date().getTime().toString() + "-thinking",
            content: "Thinking...",
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }
        ]);
      }, 2000);
      
      socketRef.current.emit("send_message", {
        text: inputValue,
        ...getAuthPayload(),
      });
      setInputValue("");
    };

    const cancelEditing = () => {
      setIsEditing(false);
      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }
      setShowThinking(false);
    };

    return (
      <div className="w-[30%] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-lg flex flex-col mr-2">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white">
            RecruitFlow Agent
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.map((msg) =>
            msg.id ? (
              <ChatMessage
                key={msg.id}
                isSystem={msg.isSystem}
                content={msg.content}
                timestamp={msg.timestamp}
                showSimulationModal={showSimulationModal}
                setShowSimulationModal={setShowSimulationModal}
                isThinking={msg.content === "Thinking..."}
              />
            ) : null
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-white/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
                else if (e.key === "Escape" && isEditing) cancelEditing();
              }}
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-700/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50 transition-all"
              placeholder={
                isEditing ? "Type your edit instruction..." : "Message Helix..."
              }
            />
            {isEditing && (
              <button
                onClick={cancelEditing}
                className="p-2.5 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <button
              onClick={() => {handleSend(); setIsListening(true);}}
              className="p-2.5 bg-black dark:bg-white rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4 text-white dark:text-gray-800" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default Chat
import React, { useEffect, useState, useRef } from "react";
import { Trash2, Check, X, Play, ClipboardList } from "lucide-react";
import { Sequence } from "../../types";
import EmptyWorkspaceState from "./EmptyWorkspace";
interface WorkspaceProps {
  sessionId: string;
  sequence: Sequence;
  onEditStep: (index: number, content: string) => void;
  onDeleteStep: (index: number) => void;
  socket?: any;
  onClearChatEditing?: () => void;
  isListening?: boolean;
  setIsListening?: React.Dispatch<React.SetStateAction<boolean>>;
  showSimulationModal: boolean;
  setShowSimulationModal: React.Dispatch<React.SetStateAction<boolean>>;
}

interface SimulationAgent {
  name: string;
  status: "Running" | "Completed" | "Pending";
  currentStep: number;
  score: number;
  scoreDetails: {
    humanness: number;
    compelling: number;
    decision: "RESPOND" | "IGNORE";
    thoughts: string;
  };
  responses?: Array<{
    humanness: number;
    compelling: number;
    decision: "RESPOND" | "IGNORE";
    thoughts: string;
  }>;
}

interface AgentData {
  [key: string]: {
    humanness: number;
    compelling: number;
    decision: "RESPOND" | "IGNORE";
    thoughts: string;
  };
}

// Add this interface for the simulation response data
interface AgentResponse {
  humanness: number;
  compelling: number;
  decision: "RESPOND" | "IGNORE";
  thoughts: string;
}

const Workspace: React.FC<WorkspaceProps> = ({
  sessionId,
  sequence,
  onEditStep,
  onDeleteStep,
  socket,
  onClearChatEditing,
  isListening,
  setIsListening,
  showSimulationModal,
  setShowSimulationModal,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displaySequence, setDisplaySequence] = useState<Sequence>({
    steps: [],
  });
  const [animatedSteps, setAnimatedSteps] = useState<string[]>([]);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const editRef = useRef<HTMLDivElement>(null);

  // Simulation related states
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<SimulationAgent | null>(
    null
  );
  const [simulationAgents, setSimulationAgents] = useState<SimulationAgent[]>(
    []
  );
  const [agentDataMap, setAgentDataMap] = useState<{
    [key: string]: SimulationAgent;
  }>({});

  useEffect(() => {
    const storedWorkspace = localStorage.getItem("workspace_" + sessionId);
    if (storedWorkspace) {
      try {
        setDisplaySequence(JSON.parse(storedWorkspace));
      } catch (error) {
        console.error("Error parsing stored workspace:", error);
        setDisplaySequence({ steps: [] });
      }
    }
  }, [sessionId]);

  useEffect(() => {
    if (sequence && sequence.steps && sequence.steps.length > 0) {
      setDisplaySequence(sequence);
    }
  }, [sequence]);

  useEffect(() => {
    setIsVisible(false);
    setAnimatedSteps([]);
    setTimeout(() => setIsVisible(true), 100);
    displaySequence.steps.forEach((step, index) => {
      setTimeout(() => {
        setAnimatedSteps((prev) => [...prev, step.id]);
      }, 150 * (index + 1));
    });
  }, [displaySequence.steps]);

  useEffect(() => {
    if (!socket) return;
    const handleSimulationUpdate = (data: { simulation: string }) => {
      try {
        console.log("Received simulation update:", data);
        let parsedData: Record<string, AgentResponse>;
    
        if (typeof data.simulation === "string") {
          try {
            // Parse the JSON string
            parsedData = JSON.parse(data.simulation);
            
            // Additional logging to see structure clearly
            console.log("Parsed simulation data structure:", parsedData);
            console.log("Agent names:", Object.keys(parsedData));
          } catch (e) {
            console.error("JSON parsing failed:", e);
            return;
          }
        } else if (typeof data.simulation === "object") {
          parsedData = data.simulation as Record<string, AgentResponse>;
        } else {
          console.error("Unexpected simulation data format");
          return;
        }
    
        // Process each agent's data and update the map
        setAgentDataMap((prevMap) => {
          const updatedMap = { ...prevMap };
          
          Object.entries(parsedData).forEach(([agentName, agentResponse]) => {
            console.log(`Processing agent: ${agentName}`, agentResponse);
            
            // Ensure agentResponse has the expected properties
            if (!agentResponse || typeof agentResponse !== 'object') {
              console.error(`Invalid agent response for ${agentName}:`, agentResponse);
              return;
            }
            
            const humanness = agentResponse.humanness || 0;
            const compelling = agentResponse.compelling || 0;
            const decision = agentResponse.decision || "IGNORE";
            const thoughts = agentResponse.thoughts || "";
            
            if (updatedMap[agentName]) {
              // Update existing agent
              const agent = updatedMap[agentName];
              const responses = [...(agent.responses || []), agentResponse];
              
              updatedMap[agentName] = {
                ...agent,
                name: agentName,
                status: "Completed",
                currentStep: responses.length,
                score: Math.round((humanness + compelling) / 2),
                scoreDetails: {
                  humanness,
                  compelling,
                  decision,
                  thoughts
                },
                responses
              };
            } else {
              // Create new agent entry
              updatedMap[agentName] = {
                name: agentName,
                status: "Completed",
                currentStep: 1,
                score: Math.round((humanness + compelling) / 2),
                scoreDetails: {
                  humanness,
                  compelling,
                  decision,
                  thoughts
                },
                responses: [agentResponse]
              };
            }
          });
          
          console.log("Updated agent map:", updatedMap);
          return updatedMap;
        });
      } catch (error) {
        console.error("Error processing simulation update:", error);
        console.error("Raw data received:", data);
      }
    };


    // Register the event listener
    socket.on("simulation_update", handleSimulationUpdate);

    // Cleanup function to remove the event listener
    return () => {
      socket.off("simulation_update", handleSimulationUpdate);
    };
  }, [socket]);

  // Convert the agent data map to an array for display
  useEffect(() => {
    const agentArray = Object.values(agentDataMap);
    setSimulationAgents(agentArray);
  }, [agentDataMap]);

  const getAuthPayload = () => {
    const guestToken = localStorage.getItem("guestToken");
    return { guest_token: guestToken, session_id: sessionId };
  };

  const handleStartEdit = (stepId: string, content: string, index: number) => {
    setEditingStepId(stepId);
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.innerText = content;
        editRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };

  const handleSaveEdit = (index: number) => {
    if (editRef.current) {
      const newContent = editRef.current.innerText;
      onEditStep(index, newContent);
      socket?.emit("send_message", {
        text: "User made the changes to the step, please share thoughts in 1-2 sentences, Post the updated or delete parts of the sequence immediately Never ask questions and post to the workspace + the edited step.",
        step_number: index + 1,
        step_content: newContent,
        is_edit: true,
        ...getAuthPayload(),
      });
      setEditingStepId(null);
      onClearChatEditing?.();
    }
  };

  const handleCancelEdit = () => {
    setEditingStepId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(index);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleRunSimulation = () => {
    if (!socket) {
      console.error("Socket not available");
      return;
    }

    // Clear previous simulation data
    setAgentDataMap({});
    setSimulationAgents([]);

    // Open the simulation modal
    setShowSimulationModal(true);

    // Get sequences for simulation
    const sequenceSteps = displaySequence.steps.map((step, index) => ({
      step_number: index + 1,
      content: step.content,
    }));

    // Log what we're sending for debugging
    console.log("Running simulation with sequence:", sequenceSteps);

    // Emit event to start simulation
    const guestToken = localStorage.getItem("guestToken");

    // The backend expects a different format than what we'd typically send
    socket.emit("run_simulation", {
      guest_token: guestToken,
      session_id: sessionId,
      sequences: sequenceSteps.map((step) => ({
        content: step.content,
      })),
    });

    // Also try the format with a single "sequence" property
    if (sequenceSteps.length === 0) {
      // Show message if there are no steps
      setAgentDataMap({
        info: {
          name: "System Message",
          status: "Completed",
          currentStep: 0,
          score: 0,
          scoreDetails: {
            humanness: 0,
            compelling: 0,
            decision: "IGNORE",
            thoughts:
              "Please add some sequence steps before running a simulation.",
          },
        },
      });
    }
  };

  const handleCloseSimulationModal = () => {
    setShowSimulationModal(false);
  };

  const handleOpenScoreModal = (agent: SimulationAgent) => {
    setSelectedAgent(agent);
    setShowScoreModal(true);
  };

  const handleCloseScoreModal = () => {
    setShowScoreModal(false);
  };

  const renderSimulationModal = () => {
    if (!showSimulationModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200">
              Simulation Status
            </h3>
            <button
              onClick={handleCloseSimulationModal}
              className="p-1 rounded-lg hover:bg-gray-700"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-4rem)]">
            {simulationAgents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-pulse mb-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-purple-800/30 flex items-center justify-center">
                    <Play className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <p>
                  Waiting for simulation data... Running agents to evaluate your
                  sequence.
                </p>
              </div>
            ) : (
              <div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="p-3 text-left text-gray-200 border-b border-gray-600">
                        Agent
                      </th>
                      <th className="p-3 text-left text-gray-200 border-b border-gray-600">
                        Status
                      </th>
                      <th className="p-3 text-left text-gray-200 border-b border-gray-600">
                        Current Step
                      </th>
                      <th className="p-3 text-left text-gray-200 border-b border-gray-600">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationAgents.map((agent, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => handleOpenScoreModal(agent)}
                      >
                        <td className="p-3 text-gray-200">{agent.name}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              agent.status === "Running"
                                ? "bg-green-900/30 text-green-400"
                                : agent.status === "Completed"
                                ? "bg-blue-900/30 text-blue-400"
                                : "bg-yellow-900/30 text-yellow-400"
                            }`}
                          >
                            {agent.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-200">
                          {agent.status === "Pending" ? "-" : agent.currentStep}
                        </td>
                        <td className="p-3">
                          {agent.status === "Pending" ? (
                            "-"
                          ) : (
                            <div className="flex items-center gap-1 text-gray-200">
                              <div className="w-16 bg-gray-700 rounded-full h-2.5 mr-2">
                                <div
                                  className="bg-purple-500 h-2.5 rounded-full"
                                  style={{ width: `${agent.score}%` }}
                                ></div>
                              </div>
                              <span>{agent.score}</span>
                              <ClipboardList className="w-4 h-4 text-purple-400 ml-1" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-center text-sm text-gray-400">
                  Click on any agent row to view detailed score information
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderScoreModal = () => {
    if (!showScoreModal || !selectedAgent) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-xl max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200">
              <span className="mr-2">Agent Report:</span>
              <span className="text-purple-400">{selectedAgent.name}</span>
            </h3>
            <button
              onClick={handleCloseScoreModal}
              className="p-1 rounded-lg hover:bg-gray-700"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-4rem)]">
            {/* Overall Score */}
            <div className="mb-6">
              <div className="mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-300">
                    Overall Score:
                  </span>
                  <span className="text-xl font-bold text-purple-400">
                    {selectedAgent.score}/100
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Average of humanness and compelling metrics
                </p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full"
                  style={{ width: `${selectedAgent.score}%` }}
                ></div>
              </div>
            </div>

            {/* Decision */}
            <div className="mb-6 p-3 bg-gray-750 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-300">Decision:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAgent.scoreDetails.decision === "RESPOND"
                      ? "bg-green-900/40 text-green-300"
                      : "bg-red-900/40 text-red-300"
                  }`}
                >
                  {selectedAgent.scoreDetails.decision}
                </span>
              </div>
              <div className="text-gray-300">
                This agent would{" "}
                <strong>
                  {selectedAgent.scoreDetails.decision === "RESPOND"
                    ? "respond to"
                    : "ignore"}
                </strong>{" "}
                your message.
              </div>
            </div>

            {/* Individual Scores */}
            <div className="space-y-4 mb-6">
              <h4 className="font-medium text-gray-200">Evaluation Metrics</h4>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300">Humanness:</span>
                  <span className="font-semibold text-gray-200">
                    {selectedAgent.scoreDetails.humanness}/100
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{
                      width: `${selectedAgent.scoreDetails.humanness}%`,
                    }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  How genuine and personally written the message feels
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300">Compelling:</span>
                  <span className="font-semibold text-gray-200">
                    {selectedAgent.scoreDetails.compelling}/100
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{
                      width: `${selectedAgent.scoreDetails.compelling}%`,
                    }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  How effectively it sells the opportunity and motivates a
                  response
                </p>
              </div>
            </div>

            {/* Analysis */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-200 mb-2">Analysis</h4>
              <div className="bg-gray-750 p-4 rounded-lg text-gray-200 border-l-4 border-purple-500 border border-gray-700">
                {selectedAgent.scoreDetails.thoughts || "No analysis provided."}
              </div>
            </div>

            {/* Response History */}
            {selectedAgent.responses && selectedAgent.responses.length > 1 && (
              <div className="pt-2 mt-4 border-t border-gray-700">
                <div className="flex items-center mb-3">
                  <h4 className="font-medium text-gray-200">
                    Response History
                  </h4>
                  <span className="ml-2 bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                    {selectedAgent.responses.length} steps
                  </span>
                </div>
                <div className="space-y-3">
                  {selectedAgent.responses.map((response, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-750 rounded-lg border border-gray-700"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-300">
                          Step {idx + 1}:
                        </span>
                        <span
                          className={`text-sm px-2 py-0.5 rounded-full text-xs font-medium ${
                            response.decision === "RESPOND"
                              ? "bg-green-900/40 text-green-300"
                              : "bg-red-900/40 text-red-300"
                          }`}
                        >
                          {response.decision}
                        </span>
                      </div>
                      <div className="flex gap-2 text-sm mb-2">
                        <div className="flex items-center">
                          <span className="text-gray-400">Humanness:</span>
                          <span className="ml-1 font-medium text-gray-200">
                            {response.humanness || 0}
                          </span>
                        </div>
                        <div className="flex items-center ml-4">
                          <span className="text-gray-400">Compelling:</span>
                          <span className="ml-1 font-medium text-gray-200">
                            {response.compelling || 0}
                          </span>
                        </div>
                      </div>
                      {response.thoughts && (
                        <div className="text-sm text-gray-300 border-t border-gray-600 pt-2 mt-2">
                          {response.thoughts}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="w-[70%] bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col overflow-hidden">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-200">Workspace</h2>
          <button
            onClick={handleRunSimulation}
            disabled={displaySequence.steps.length === 0}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              displaySequence.steps.length === 0 
                ? "bg-gray-700/50 text-gray-500 cursor-not-allowed" 
                : "bg-purple-900/30 text-purple-300 hover:bg-purple-900/50"
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Run Simulation</span>
          </button>
        </div>

        {/* Display loading message when isListening is true */}
        {isListening === true ? (
          <div className="text-gray-200">
            No steps yet, listening to load sequence...
          </div>
        ) : displaySequence.steps.length === 0 ? (
          <EmptyWorkspaceState />
        ) : (
          /* Render sequence steps if any exist */
          displaySequence.steps.map((step, index) => (
            <div
              key={step.id}
              className={`group relative mb-6 p-4 border bg-gray-700 border-gray-700 rounded-lg transition-all duration-300 ease-out transform ${
                animatedSteps.includes(step.id)
                  ? "opacity-100 translate-x-0 scale-100"
                  : "opacity-0 -translate-x-4 scale-95"
              }`}
            >
              {step.phase && (
                <div
                  dangerouslySetInnerHTML={{ __html: step.phase }}
                  className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-purple-900/30 text-purple-300 rounded-full"
                />
              )}
              <div className="font-medium mb-2 whitespace-pre-wrap text-gray-300 mt-6">
                Step {index + 1}:
              </div>
              {editingStepId === step.id ? (
                <div className="relative">
                  <div
                    ref={editRef}
                    contentEditable
                    className="min-h-[100px] text-green-200 whitespace-pre-wrap border border-purple-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    suppressContentEditableWarning={true}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(index)}
                      className="p-1.5 bg-gray-500/10 hover:bg-gray-500/20 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4 text-green-500" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: step.content }}
                  className="text-gray-200 whitespace-pre-wrap cursor-pointer"
                  onClick={() => handleStartEdit(step.id, step.content, index)}
                />
              )}
              {!editingStepId && (
                <button
                  className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStep(index);
                  }}
                  aria-label={`Delete step ${index + 1}`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
              {index < displaySequence.steps.length - 1 && (
                <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-px h-6 bg-gradient-to-b from-gray-700 to-transparent" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Simulation Modal */}
      {renderSimulationModal()}

      {/* Score Modal */}
      {renderScoreModal()}
    </div>
  );
};

//   return (
//     <div className="w-[70%] bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col overflow-hidden">
//       <div className="flex-1 p-6 overflow-y-auto">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-semibold text-gray-200">Sequence</h2>
//           <button
//             onClick={handleRunSimulation}
//             className="px-3 py-1.5 bg-purple-900/30 text-purple-300 rounded-lg flex items-center gap-1.5 hover:bg-purple-900/50 transition-colors"
//           >
//             <Play className="w-4 h-4" />
//             <span>Run Simulation</span>
//           </button>
//         </div>

//         {isListening === true ? (
//           <div className="text-gray-200">
//             No steps yet, listening to load sequence...
//           </div>
//         ) : (
//           ""
//         )}
//         {displaySequence.steps.map((step, index) => (
//           <div
//             key={step.id}
//             className={`group relative mb-6 p-4 border border-gray-700 rounded-lg transition-all duration-300 ease-out transform ${
//               animatedSteps.includes(step.id)
//                 ? "opacity-100 translate-x-0 scale-100"
//                 : "opacity-0 -translate-x-4 scale-95"
//             }`}
//           >
//             {step.phase && (
//               <div
//                 dangerouslySetInnerHTML={{ __html: step.phase }}
//                 className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-purple-900/30 text-purple-300 rounded-full"
//               >
//                 {/* {step.phase} */}
//               </div>
//             )}
//             <div className="font-medium mb-2 text-gray-300 mt-6">
//               Step {index + 1}:
//             </div>
//             {editingStepId === step.id ? (
//               <div className="relative">
//                 <div
//                   ref={editRef}
//                   contentEditable
//                   className="min-h-[100px] text-gray-200 whitespace-pre-wrap border border-purple-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
//                   onKeyDown={(e) => handleKeyDown(e, index)}
//                   suppressContentEditableWarning={true}
//                 />
//                 <div className="absolute top-2 right-2 flex gap-2">
//                   <button
//                     onClick={() => handleSaveEdit(index)}
//                     className="p-1.5 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors"
//                   >
//                     <Check className="w-4 h-4 text-green-500" />
//                   </button>
//                   <button
//                     onClick={handleCancelEdit}
//                     className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
//                   >
//                     <X className="w-4 h-4 text-red-500" />
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div
//                 dangerouslySetInnerHTML={{ __html: step.content }}
//                 className="text-gray-200 whitespace-pre-wrap cursor-pointer"
//                 onClick={() => handleStartEdit(step.id, step.content, index)}
//               >
//                 {/* {step.content} */}
//               </div>
//             )}
//             {!editingStepId && (
//               <button
//                 className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 active:scale-95"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onDeleteStep(index);
//                 }}
//                 aria-label={`Delete step ${index + 1}`}
//               >
//                 <Trash2 className="w-4 h-4 text-red-500" />
//               </button>
//             )}
//             {index < displaySequence.steps.length - 1 && (
//               <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-px h-6 bg-gradient-to-b from-gray-700 to-transparent" />
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Simulation Modal */}
//       {renderSimulationModal()}

//       {/* Score Modal */}
//       {renderScoreModal()}
//     </div>
//   );
// };

export default Workspace;

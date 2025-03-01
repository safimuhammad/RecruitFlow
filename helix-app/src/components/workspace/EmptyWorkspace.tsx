import React from "react";
import { ClipboardList, Plus } from "lucide-react";

// Import the EmptyWorkspaceState component
const EmptyWorkspaceState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full py-16 px-8">
      <div className="animate-pulse mb-6 bg-purple-900/20 p-4 rounded-full">
        <ClipboardList className="w-16 h-16 text-purple-400" />
      </div>
      
      <h3 className="text-xl font-medium text-gray-200 mb-3">No Sequence Steps Yet</h3>
      
      <p className="text-gray-400 text-center max-w-md mb-6">
        Your workspace is ready for new sequence steps. Add content to build your sequence and run simulations.
      </p>
      
      <div className="flex items-center gap-2 text-purple-300 bg-purple-900/30 px-4 py-2 rounded-lg">
        <Plus className="w-5 h-5" />
        <span>Start by sending a message in the chat</span>
      </div>
      
      <div className="mt-10 p-4 bg-gray-750 rounded-lg border border-gray-700 max-w-md">
        <h4 className="text-sm font-medium text-gray-300 mb-2">About Sequences</h4>
        <p className="text-xs text-gray-400">
          A sequence is a series of steps that can be tested with simulated agents to evaluate effectiveness. 
          Each step can be edited or removed as needed.
        </p>
      </div>
    </div>
  );
};

export default EmptyWorkspaceState;

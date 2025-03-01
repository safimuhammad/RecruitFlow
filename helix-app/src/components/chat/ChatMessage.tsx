import React, { useState, useEffect, useRef } from 'react';
import { ChatMessageProps } from '../../types';
import roboAvatar from '../../assets/robo.webp';

const ChatMessage: React.FC<ChatMessageProps> = ({ isSystem, content, timestamp, showSimulationModal, setShowSimulationModal, isThinking = false }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isToolCall, setIsToolCall] = useState(false);
  const [toolName, setToolName] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isSystem) {
      setDisplayedContent(content || '');
      setIsTyping(false);
      return;
    }

    const fullContent = content || '';
    
    if (fullContent.startsWith('tool_call:')) {
      setIsToolCall(true);
      const toolNameMatch = fullContent.match(/tool_call:\s*(\w+)/);
      setToolName(toolNameMatch ? toolNameMatch[1] : '');
      
      if (toolNameMatch && toolNameMatch[1] === 'run_simulation') {
        setShowSimulationModal(true);
      }
    } else {
      setIsToolCall(false);
      setToolName('');
    }

    if (displayedContent.length >= fullContent.length) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setDisplayedContent(prev => {
        const nextLength = prev.length + 4;
        const nextContent = fullContent.slice(0, nextLength);
        if (nextLength >= fullContent.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsTyping(false);
        }
        return nextContent;
      });
    }, 30);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [content, isSystem, setShowSimulationModal]);

  // Function to render message content with HTML support
  const renderMessageContent = () => {
    if (isSystem) {
      if (isThinking) {
        return (
          <div className="flex items-center">
            <span>Thinking</span>
            <span className="inline-flex ml-1">
              <span className="animate-bounce mx-0.5 delay-0">.</span>
              <span className="animate-bounce mx-0.5 delay-150">.</span>
              <span className="animate-bounce mx-0.5 delay-300">.</span>
            </span>
          </div>
        );
      } else if (isTyping) {
        return (
          <>
            <div dangerouslySetInnerHTML={{ __html: displayedContent }} />
            <span className="inline-block w-1 h-4 ml-0.5 -mb-0.5 bg-current animate-pulse" />
          </>
        );
      } else {
        return <div dangerouslySetInnerHTML={{ __html: displayedContent }} />;
      }
    } else {
      return <div dangerouslySetInnerHTML={{ __html: content || '' }} />;
    }
  };

  return (
    <div className={`flex items-end gap-2 mb-2 ${isSystem ? 'justify-start' : 'justify-end'}`}>
      {isSystem && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
          <img src={roboAvatar} alt="Helix Assistant" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        {isSystem && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
            Helix Assistant{isTyping || isThinking ? '...' : ''}
          </span>
        )}
        {isToolCall ? (
          <div className="px-4 py-2 rounded-lg max-w-[280px] bg-blue-600 dark:bg-blue-700">
            <span className="font text-white italic">
              Tool_call: {toolName}
            </span>
          </div>
        ) : (
          <div
            className={`px-4 py-2 rounded-2xl max-w-[280px] ${
              isSystem
                ? 'bg-gray-100 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 rounded-bl-md'
                : 'bg-purple-500 dark:bg-purple-600 text-white rounded-br-md'
            }`}
          >
            {renderMessageContent()}
          </div>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500 mx-1">
          {timestamp || '09:03 AM'}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
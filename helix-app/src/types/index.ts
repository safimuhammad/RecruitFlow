import { ReactNode } from 'react';

export interface CompanyData {
  name: string;
  description: string;
  tags: string[];
}

export interface Message {
  id: string;
  content: string;
  isSystem: boolean;
  timestamp: string;
  
}

export interface Step {
  id: string;
  content: string;
  phase?: string;
}

export interface Sequence {
  steps: Step[];
}

export interface ChatProps {
  sessionId: string;
  editingStep?: {
    index: number;
    content: string;
  } | null;
}

export interface ChatMessageProps {
  isSystem: boolean;
  content: string;
  timestamp?: string;
  showSimulationModal: boolean;
  setShowSimulationModal: (showSimulationModal: boolean) => void;
  isThinking?: boolean;
}

export interface Tab {
  id: string;
  name: string;
  sequence: Sequence;
  isActive: boolean;
}

export interface WorkspaceProps {
  sessionId: string;
  sequence: Sequence;
  onEditStep: (index: number, content: string) => void;
  onDeleteStep: (index: number) => void;
  socket?: any;
  onClearChatEditing?: () => void;
}

export interface ChatWorkspacePageProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onBack: () => void;
  onWorkspaceUpdate: (data: any) => void;
}

export interface HomePageProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onStartSequence: () => void;

}

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
}

export interface ChatRef {
  sendMessage: (messageData: {
    text: string;
    step_number?: number;
    step_content?: string;
    is_edit?: boolean;
  }) => void;
  clearEditingStep: () => void;
  resetHistory: () => void;
} 
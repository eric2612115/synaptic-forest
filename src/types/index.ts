// 基本類型定義

// 用戶相關類型
export interface User {
  id: string;
  username: string;
  email: string;
}

// 會話相關類型
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_preview?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
  thinking_content?: string;
  message_type?: 'normal' | 'thinking' | 'error';
}

export interface ConversationDetails extends Conversation {
  messages: Message[];
}

export interface ChatOptions {
  thinking?: boolean;
  system_message?: string;
  temperature?: number;
  extract_knowledge?: boolean;
}

// 知識圖譜相關類型
export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'concept' | 'entity' | 'relationship' | 'abstract';
  importance_score: number;
  status: 'active' | 'dormant';
  created_at: string;
  updated_at: string;
  source_conversation_id?: string;
  topic_cluster_id?: string;
  certainty_score?: number;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: 'includes' | 'causes' | 'relates_to' | 'cross_references';
  strength: number;
  created_at: string;
  updated_at: string;
  source_conversation_id?: string;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface NodeDetails extends KnowledgeNode {
  neighbors?: {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
  }
}

export interface SearchResults {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// 反思系統相關類型
export interface ReflectionCycleStatus {
  cycle_id: string;
  user_id: string;
  stage: 'OBSERVE' | 'EVALUATE' | 'DECIDE' | 'EXECUTE';
  status: 'in_progress' | 'completed' | 'failed';
  progress: number;
  message: string;
  started_at: string;
  completed_at?: string;
}

// 系統健康相關類型
export interface SystemHealth {
  overall_quality: number;
  metrics: {
    avg_certainty_score: number;
    graph_density: number;
    topic_entropy: number;
    dormant_node_ratio: number;
  };
  rules: {
    passed: number;
    warnings: number;
    failed: number;
  };
  improvements: string[];
}

// 能量系統相關類型
export interface EnergyStatus {
  user_id: string;
  current_energy: number;
  max_energy: number;
  regeneration_rate: number;
  last_updated: string;
}

export interface EnergyFlow {
  nodes: Array<{
    id: string;
    type: 'source' | 'consumer';
    energy: number;
    label: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
  }>;
}

'use client';

import { useState } from 'react';
import { NodeDetails } from '@/types';
import Link from 'next/link';

interface NodeDetailsPanelProps {
  node: NodeDetails;
  onClose: () => void;
}

export default function NodeDetailsPanel({ node, onClose }: NodeDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'connections' | 'source'>('details');
  
  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'concept':
        return 'text-[hsl(var(--concept))] bg-[hsl(var(--concept))] bg-opacity-10';
      case 'entity':
        return 'text-[hsl(var(--entity))] bg-[hsl(var(--entity))] bg-opacity-10';
      case 'relationship':
        return 'text-[hsl(var(--relationship))] bg-[hsl(var(--relationship))] bg-opacity-10';
      case 'abstract':
        return 'text-[hsl(var(--abstract))] bg-[hsl(var(--abstract))] bg-opacity-10';
      default:
        return 'text-primary bg-primary bg-opacity-10';
    }
  };
  
  const getNodeStatusStyle = (status: string) => {
    return status === 'active' 
      ? 'bg-green-500' 
      : 'bg-gray-400';
  };
  
  const getEdgeTypeColor = (type: string) => {
    switch (type) {
      case 'includes':
        return 'bg-[hsl(var(--concept))]';
      case 'causes':
        return 'bg-[hsl(var(--abstract))]';
      case 'relates_to':
        return 'bg-[hsl(var(--entity))]';
      case 'cross_references':
        return 'bg-[hsl(var(--relationship))]';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Node Details</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-secondary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
      </div>
      
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3 mb-2">
          <div className={`p-2 rounded-md ${getNodeTypeColor(node.type)}`}>
            {node.type === 'concept' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m15 9-6 6"></path>
                <path d="m9 9 6 6"></path>
              </svg>
            )}
            {node.type === 'entity' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              </svg>
            )}
            {node.type === 'relationship' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <line x1="8" x2="16" y1="6" y2="6"></line>
                <line x1="8" x2="16" y1="12" y2="12"></line>
                <line x1="8" x2="16" y1="18" y2="18"></line>
              </svg>
            )}
            {node.type === 'abstract' && (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12.5 3a17 17 0 0 0-9.5 9.5C6 13 6 15 7 17c1 2 3 5 7 5a17 17 0 0 0 9.5-9.5C20 11 20 9 19 7c-1-2-3-4-6.5-4Z"></path>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            )}
          </div>
          <div>
            <div className="font-medium">{node.label}</div>
            <div className="text-sm text-muted-foreground capitalize flex items-center">
              {node.type}
              <span className="mx-2">•</span>
              <span className={`inline-block w-2 h-2 rounded-full ${getNodeStatusStyle(node.status)}`}></span>
              <span className="ml-1 capitalize">{node.status}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <div className="text-muted-foreground">Importance</div>
            <div className="font-medium">{(node.importance_score * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Certainty</div>
            <div className="font-medium">{(node.certainty_score ? node.certainty_score * 100 : 'N/A').toString()}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Created</div>
            <div className="font-medium">{new Date(node.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Updated</div>
            <div className="font-medium">{new Date(node.updated_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
      
      <div className="border-b">
        <div className="flex">
          <button
            className={`px-4 py-2 text-sm flex-1 ${activeTab === 'details' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`px-4 py-2 text-sm flex-1 ${activeTab === 'connections' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('connections')}
          >
            Connections
          </button>
          <button
            className={`px-4 py-2 text-sm flex-1 ${activeTab === 'source' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('source')}
          >
            Source
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'details' && (
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {/* 在真實應用中，這應該是節點的實際描述 */}
              {node.label} is a {node.type} node in your knowledge forest with an importance score of {(node.importance_score * 100).toFixed(0)}%. It was created on {new Date(node.created_at).toLocaleDateString()} and last updated on {new Date(node.updated_at).toLocaleDateString()}.
            </p>
            
            {node.topic_cluster_id && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Topic Cluster</h3>
                <div className="p-2 bg-secondary/50 rounded-md text-sm">
                  {/* 實際應用中，這應該顯示集群的名稱 */}
                  Cluster ID: {node.topic_cluster_id}
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Properties</h3>
              <div className="bg-secondary/50 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">ID</td>
                      <td className="p-2 font-mono text-xs">{node.id}</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">Type</td>
                      <td className="p-2 capitalize">{node.type}</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">Status</td>
                      <td className="p-2 capitalize">{node.status}</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">Created</td>
                      <td className="p-2">{new Date(node.created_at).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-muted-foreground">Updated</td>
                      <td className="p-2">{new Date(node.updated_at).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'connections' && (
          <div>
            <h3 className="font-medium mb-2">Connected Nodes</h3>
            
            {node.neighbors?.nodes && node.neighbors.nodes.length > 0 ? (
              <div className="space-y-2">
                {node.neighbors.edges.map((edge) => {
                  const targetNode = node.neighbors?.nodes.find(n => 
                    n.id === (edge.target === node.id ? edge.source : edge.target)
                  );
                  
                  if (!targetNode) return null;
                  
                  return (
                    <div key={edge.id} className="p-3 bg-secondary/50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{targetNode.label}</div>
                        <div className={`text-xs px-2 py-0.5 rounded-full ${getNodeTypeColor(targetNode.type)}`}>
                          {targetNode.type}
                        </div>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className={`h-1 w-6 rounded-full ${getEdgeTypeColor(edge.relationship_type)}`}></div>
                        <div className="text-xs text-muted-foreground ml-2 capitalize">
                          {edge.relationship_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs ml-auto">
                          Strength: {(edge.strength * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No connections found for this node.
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'source' && (
          <div>
            <h3 className="font-medium mb-2">Source Conversation</h3>
            
            {node.source_conversation_id ? (
              <div>
                <div className="p-3 bg-secondary/50 rounded-md mb-4">
                  <div className="text-sm">This knowledge was extracted from a conversation:</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Conversation ID: {node.source_conversation_id}
                  </div>
                </div>
                
                <Link 
                  href={`/conversation/${node.source_conversation_id}`} 
                  className="inline-flex items-center text-sm text-[hsl(var(--entity))] hover:underline"
                >
                  <span>View Source Conversation</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-1">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <path d="M15 3h6v6"></path>
                    <path d="m10 14 11-11"></path>
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No source information available for this node.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

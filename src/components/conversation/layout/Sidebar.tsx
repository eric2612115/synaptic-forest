'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks';
import { useConversation } from '@/hooks';
import { useAppDispatch } from '@/hooks';
import { addNotification } from '@/store/slices/uiSlice';
import { Conversation } from '@/types';
import chatWebSocketClient from '@/lib/websocket/chat-client';

interface SidebarProps {
  conversations: Conversation[];
  onClose?: () => void;
}

export const Sidebar = ({ conversations, onClose }: SidebarProps) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [isCreating, setIsCreating] = useState(false);
  const { deleteConversation } = useConversation();
  
  // Extract current conversation ID from the path
  const currentConversationId = pathname.startsWith('/conversation/') 
    ? pathname.split('/')[2] 
    : null;

  const handleCreateConversation = async () => {
    if (!user?.id) return;
    
    try {
      setIsCreating(true);
      
      // Use WebSocket to create a new conversation
      const conversation = await chatWebSocketClient.createConversation(user.id);
      
      setIsCreating(false);
      
      // Navigate to the new conversation
      router.push(`/conversation/${conversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      
      // Error handling
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' && error !== null && 'message' in error ? error.message : 
                          'Failed to create conversation';
      
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
        autoClose: true,
      }));
      setIsCreating(false);
    }
  };

  // Confirm and delete conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Use WebSocket to send delete request if connected
      if (chatWebSocketClient.isConnected()) {
        chatWebSocketClient.sendMessage(JSON.stringify({
          query: JSON.stringify({
            action: 'delete_conversation',
            conversation_id: id
          })
        }), {});
        
        // Update local state
        dispatch({
          type: 'conversation/deleteConversationById/fulfilled',
          payload: id
        });
        
        // If user deleted the current conversation, redirect to /conversation
        if (id === currentConversationId) {
          router.push('/conversation');
        }
        
        dispatch(addNotification({
          type: 'success',
          message: 'Conversation deleted successfully',
          autoClose: true,
        }));
      } else {
        // Fallback to HTTP API
        await deleteConversation(id);
        
        if (id === currentConversationId) {
          router.push('/conversation');
        }
        
        dispatch(addNotification({
          type: 'success',
          message: 'Conversation deleted successfully',
          autoClose: true,
        }));
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' && error !== null && 'message' in error ? error.message : 
                          'Failed to delete conversation';
      
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
        autoClose: true,
      }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-semibold">Conversations</h1>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      {/* New conversation button */}
      <div className="p-4">
        <button
          onClick={handleCreateConversation}
          disabled={isCreating}
          className="w-full flex items-center justify-center py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isCreating ? (
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
              Creating...
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New conversation
            </>
          )}
        </button>
      </div>
      
      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto pb-4">
        {conversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-muted-foreground">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {conversations.map((conversation) => (
              <Link
                href={`/conversation/${conversation.id}`}
                key={conversation.id}
                className={`flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/80 transition-colors ${
                  currentConversationId === conversation.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex-1 truncate mr-2">
                  <div className="font-medium truncate">{conversation.title}</div>
                  {conversation.last_message_preview && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message_preview}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-muted rounded"
                  aria-label="Delete conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* User info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
          </div>
          <div className="ml-3">
            <div className="font-medium truncate">{user?.name || user?.email || 'User'}</div>
            <div className="text-xs text-muted-foreground truncate">
              {user?.email || ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
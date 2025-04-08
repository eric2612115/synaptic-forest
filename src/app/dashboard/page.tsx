'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useAuth } from '@/hooks';
import { useConversation } from '@/hooks';
import { fetchSystemHealth, fetchEnergyStatus } from '@/store/slices/systemSlice';
import { addNotification } from '@/store/slices/uiSlice';

export default function DashboardPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { health, energy } = useAppSelector(state => state.system);
  const { conversations, isLoading, loadConversations, initialLoadDone, error } = useConversation();
  
  // Client-side loading state to prevent hydration errors
  const [clientReady, setClientReady] = useState(false);
  
  // Set ready state only on client to ensure hydration consistency
  useEffect(() => {
    setClientReady(true);
  }, []);
  
  // Use ref to track if conversations were loaded to prevent duplicate requests
  const hasLoadedConversations = useRef(false);
  
  // Load system status and conversation data
  useEffect(() => {
    let isMounted = true;
    let pollingTimerId: NodeJS.Timeout | null = null;
    
    if (user?.id && !initialLoadDone && !hasLoadedConversations.current) {
      hasLoadedConversations.current = true;
      
      // Load conversation list - only once
      loadConversations(user.id).catch(err => {
        console.warn("Failed to load conversations:", err.message);
        // Reset flag to allow retry
        setTimeout(() => {
          hasLoadedConversations.current = false;
        }, 5000); // Try again after 5 seconds
      });
      
      // Initial load of system and energy data
      dispatch(fetchSystemHealth(user.id));
      dispatch(fetchEnergyStatus(user.id));
      
      // Set up polling every 30 seconds for system status and energy
      pollingTimerId = setInterval(() => {
        if (isMounted) {
          dispatch(fetchSystemHealth(user.id));
          dispatch(fetchEnergyStatus(user.id));
        }
      }, 30000);
      
      // Welcome notification
      dispatch(addNotification({
        type: 'info',
        message: `Welcome to your knowledge forest, ${user.username}!`,
        autoClose: true,
      }));
    }
    
    return () => {
      isMounted = false;
      if (pollingTimerId) {
        clearInterval(pollingTimerId);
      }
    };
  }, [user?.id, dispatch, loadConversations, initialLoadDone]);

  if (!clientReady) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse text-center py-8">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="py-6 px-4">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Monitor and manage your knowledge ecosystem</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Forest Health Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 bg-card rounded-lg shadow-sm border border-border/50 hover:border-primary/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Forest Health</h2>
                <p className="text-muted-foreground text-sm">Overall status of your knowledge ecosystem</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-md text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 14V2"></path>
                  <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                </svg>
              </div>
            </div>
            
            {health ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Overall Health</span>
                  <span className="text-sm font-medium">
                    {Math.round(health.overall_quality * 100)}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${health.overall_quality * 100}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="text-sm font-medium">{health.nodes || 0}</div>
                    <div className="text-xs text-muted-foreground">Knowledge Nodes</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="text-sm font-medium">{health.connections || 0}</div>
                    <div className="text-xs text-muted-foreground">Connections</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-3">
                <div className="h-2.5 bg-secondary rounded-full w-full"></div>
                <div className="h-2 bg-secondary rounded-full w-3/4"></div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="h-16 bg-secondary rounded-md"></div>
                  <div className="h-16 bg-secondary rounded-md"></div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Link 
                href="/forest" 
                className="text-sm text-primary hover:text-primary/80 inline-flex items-center transition-colors"
              >
                <span>View Knowledge Forest</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-1">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </Link>
            </div>
          </motion.div>
          
          {/* Energy System Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-6 bg-card rounded-lg shadow-sm border border-border/50 hover:border-blue-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Energy System</h2>
                <p className="text-muted-foreground text-sm">Current energy levels and distribution</p>
              </div>
              <div className="bg-blue-500/10 p-2 rounded-md text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10"></path>
                  <path d="M6 20V4"></path>
                  <path d="M12 20v-4"></path>
                </svg>
              </div>
            </div>
            
            {energy ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Current Energy</span>
                  <span className="text-sm font-medium">
                    {Math.round(energy.current_energy)}/{energy.max_energy}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-700" 
                    style={{ width: `${(energy.current_energy / energy.max_energy) * 100}%` }}
                  ></div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Regeneration Rate</span>
                    <span>{energy.regen_rate || 0} units/min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Reflection</span>
                    <span>{energy.last_reflection ? new Date(energy.last_reflection).toLocaleDateString() : "Never"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-3">
                <div className="h-2.5 bg-secondary rounded-full w-full"></div>
                <div className="h-2 bg-secondary rounded-full w-3/4"></div>
                <div className="space-y-2 mt-4">
                  <div className="h-5 bg-secondary rounded w-full"></div>
                  <div className="h-5 bg-secondary rounded w-full"></div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Link 
                href="/settings" 
                className="text-sm text-blue-500 hover:text-blue-400 inline-flex items-center transition-colors"
              >
                <span>Energy Settings</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-1">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </Link>
            </div>
          </motion.div>
          
          {/* Recent Conversations Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="p-6 bg-card rounded-lg shadow-sm border border-border/50 hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Recent Conversations</h2>
                <p className="text-muted-foreground text-sm">Your latest interactions</p>
              </div>
              <div className="bg-purple-500/10 p-2 rounded-md text-purple-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                  <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                </svg>
              </div>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-secondary rounded-md w-full"></div>
                  <div className="h-10 bg-secondary rounded-md w-full"></div>
                  <div className="h-10 bg-secondary rounded-md w-full"></div>
                </div>
              ) : error ? (
                <div className="text-center py-4 bg-red-500/10 rounded-md border border-red-500/20 p-4">
                  <p className="text-red-500 mb-2">Failed to load conversations</p>
                  <button 
                    onClick={() => user?.id && loadConversations(user.id)}
                    className="text-sm bg-red-500/20 text-red-500 px-3 py-1 rounded-md hover:bg-red-500/30 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : conversations && conversations.length > 0 ? (
                <>
                  {conversations.slice(0, 3).map((conversation) => {
                    const convId = conversation?._id || conversation?.id;
                    if (!convId) return null;
                    
                    return (
                      <Link 
                        key={convId} 
                        href={`/conversation/${convId}`}
                        className="block p-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-muted"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium truncate pr-4">{conversation.title || "Untitled Conversation"}</h3>
                          <span className="text-xs text-muted-foreground">
                            {conversation.updated_at ? new Date(conversation.updated_at).toLocaleDateString() : "Unknown date"}
                          </span>
                        </div>
                        {conversation.last_message_preview && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {conversation.last_message_preview}
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-6 bg-muted/30 rounded-md border border-border/50">
                  <div className="w-12 h-12 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                    </svg>
                  </div>
                  <p className="text-muted-foreground mb-2">No conversations yet</p>
                  <Link 
                    href="/conversation" 
                    className="inline-flex items-center px-3 py-1.5 bg-purple-500/10 text-purple-500 rounded-md hover:bg-purple-500/20 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                    <span>Start a conversation</span>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <Link 
                href="/conversation" 
                className="text-sm text-purple-500 hover:text-purple-400 inline-flex items-center transition-colors"
              >
                <span>View All Conversations</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-1">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Quick Access Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link 
              href="/conversation"
              className="p-4 bg-card rounded-lg border border-border/50 hover:border-primary/30 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                  <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                </svg>
              </div>
              <h3 className="font-medium">New Conversation</h3>
              <p className="text-xs text-muted-foreground mt-1">Start a new dialogue</p>
            </Link>
            
            <Link 
              href="/forest"
              className="p-4 bg-card rounded-lg border border-border/50 hover:border-blue-500/30 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m16.2 7.8-8.4 8.4"></path>
                  <path d="m7.8 7.8 8.4 8.4"></path>
                </svg>
              </div>
              <h3 className="font-medium">Knowledge Forest</h3>
              <p className="text-xs text-muted-foreground mt-1">Explore your knowledge network</p>
            </Link>
            
            <Link 
              href="/reflection"
              className="p-4 bg-card rounded-lg border border-border/50 hover:border-purple-500/30 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <h3 className="font-medium">Reflection Hub</h3>
              <p className="text-xs text-muted-foreground mt-1">View knowledge reflections</p>
            </Link>
            
            <Link 
              href="/settings"
              className="p-4 bg-card rounded-lg border border-border/50 hover:border-green-500/30 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <h3 className="font-medium">Settings</h3>
              <p className="text-xs text-muted-foreground mt-1">Configure your forest</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

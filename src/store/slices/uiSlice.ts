import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh';
  showThinking: boolean;
  showGuide: boolean;
  currentView: 'dashboard' | 'forest' | 'conversation' | 'settings';
  detailsPanelOpen: boolean;
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    autoClose?: boolean;
    duration?: number;
  }>;
  isLoading: {
    global: boolean;
    conversation: boolean;
    knowledgeGraph: boolean;
    reflection: boolean;
    system: boolean;
  };
  demoMode: boolean;
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  language: 'en',
  showThinking: false,
  showGuide: true,
  currentView: 'dashboard',
  detailsPanelOpen: false,
  notifications: [],
  isLoading: {
    global: false,
    conversation: false,
    knowledgeGraph: false,
    reflection: false,
    system: false,
  },
  demoMode: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'en' | 'zh'>) => {
      state.language = action.payload;
    },
    toggleThinking: (state) => {
      state.showThinking = !state.showThinking;
    },
    setShowThinking: (state, action: PayloadAction<boolean>) => {
      state.showThinking = action.payload;
    },
    toggleGuide: (state) => {
      state.showGuide = !state.showGuide;
    },
    setCurrentView: (state, action: PayloadAction<'dashboard' | 'forest' | 'conversation' | 'settings'>) => {
      state.currentView = action.payload;
    },
    toggleDetailsPanel: (state) => {
      state.detailsPanelOpen = !state.detailsPanelOpen;
    },
    setDetailsPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.detailsPanelOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<{
      type: 'info' | 'success' | 'warning' | 'error';
      message: string;
      autoClose?: boolean;
      duration?: number;
    }>) => {
      const id = Date.now().toString();
      state.notifications.push({
        id,
        ...action.payload,
        autoClose: action.payload.autoClose ?? true,
        duration: action.payload.duration ?? 5000,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<{
      key: keyof UIState['isLoading'];
      value: boolean;
    }>) => {
      state.isLoading[action.payload.key] = action.payload.value;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading.global = action.payload;
    },
    toggleDemoMode: (state) => {
      state.demoMode = !state.demoMode;
    },
    setDemoMode: (state, action: PayloadAction<boolean>) => {
      state.demoMode = action.payload;
    }
  },
});

export const {
  toggleSidebar,
  setTheme,
  setLanguage,
  toggleThinking,
  setShowThinking,
  toggleGuide,
  setCurrentView,
  toggleDetailsPanel,
  setDetailsPanelOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setGlobalLoading,
  toggleDemoMode,
  setDemoMode
} = uiSlice.actions;

export default uiSlice.reducer;

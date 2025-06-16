
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, Startup, Comment, FilterState } from '../types/startup';

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_STARTUPS'; payload: Startup[] }
  | { type: 'SET_FILTERED_STARTUPS'; payload: Startup[] }
  | { type: 'TOGGLE_STARTUP_SELECTION'; payload: string }
  | { type: 'SELECT_ALL_STARTUPS'; payload: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'ADD_TAG_TO_STARTUP'; payload: { companyId: string; tag: string } }
  | { type: 'REMOVE_TAG_FROM_STARTUP'; payload: { companyId: string; tag: string } }
  | { type: 'ADD_CUSTOM_TAG'; payload: string }
  | { type: 'ADD_COMMENT'; payload: Comment }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'SET_VIEW_MODE'; payload: 'cards' | 'list' | 'kanban' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number };

const initialState: AppState = {
  startups: [],
  filteredStartups: [],
  selectedStartups: new Set(),
  tags: ['cubo_membro', 'cubo_indicar', 'legalops', 'gestao', 'dzb', 'mentoria', 'flip'],
  comments: [],
  filters: {
    search: '',
    country: '',
    industry: '',
    fundingTier: '',
    tags: [],
    offeringTopics: [],
    seekingTopics: [],
  },
  loading: false,
  currentPage: 1,
  itemsPerPage: 100,
  viewMode: 'cards',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_STARTUPS':
      return { ...state, startups: action.payload, filteredStartups: action.payload, loading: false };
    
    case 'SET_FILTERED_STARTUPS':
      return { ...state, filteredStartups: action.payload, currentPage: 1 };
    
    case 'TOGGLE_STARTUP_SELECTION':
      const newSelection = new Set(state.selectedStartups);
      if (newSelection.has(action.payload)) {
        newSelection.delete(action.payload);
      } else {
        newSelection.add(action.payload);
      }
      return { ...state, selectedStartups: newSelection };
    
    case 'SELECT_ALL_STARTUPS':
      return { ...state, selectedStartups: new Set(action.payload) };
    
    case 'CLEAR_SELECTION':
      return { ...state, selectedStartups: new Set() };
    
    case 'ADD_TAG_TO_STARTUP':
      return {
        ...state,
        startups: state.startups.map(startup => 
          startup.company_id === action.payload.companyId
            ? { ...startup, tags: [...(startup.tags || []), action.payload.tag] }
            : startup
        ),
        filteredStartups: state.filteredStartups.map(startup => 
          startup.company_id === action.payload.companyId
            ? { ...startup, tags: [...(startup.tags || []), action.payload.tag] }
            : startup
        ),
      };
    
    case 'REMOVE_TAG_FROM_STARTUP':
      return {
        ...state,
        startups: state.startups.map(startup => 
          startup.company_id === action.payload.companyId
            ? { ...startup, tags: startup.tags?.filter(tag => tag !== action.payload.tag) || [] }
            : startup
        ),
        filteredStartups: state.filteredStartups.map(startup => 
          startup.company_id === action.payload.companyId
            ? { ...startup, tags: startup.tags?.filter(tag => tag !== action.payload.tag) || [] }
            : startup
        ),
      };
    
    case 'ADD_CUSTOM_TAG':
      return {
        ...state,
        tags: state.tags.includes(action.payload) ? state.tags : [...state.tags, action.payload],
      };
    
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: [...state.comments, action.payload],
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    
    case 'SET_VIEW_MODE':
      const itemsPerPage = action.payload === 'list' ? 200 : 100;
      return { ...state, viewMode: action.payload, itemsPerPage, currentPage: 1 };
    
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };
    
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}


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
  | { type: 'RESET_PAGE' }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number };

const initialState: AppState = {
  startups: [],
  filteredStartups: [],
  selectedStartups: new Set(),
  tags: [],
  comments: [],
  filters: {
    search: '',
    country: '',
    industry: '',
    fundingTier: '',
    fundraising: undefined,
    meetInvestors: undefined,
    womenFounder: undefined,
    blackFounder: undefined,
    indigenousFounder: undefined,
    tags: [],
    offeringTopics: [],
    seekingTopics: [],
    endorsedBy: [],
    cities: [],
    provinces: [],
    countries: [],
    industries: [],
    fundingTiers: []
  },
  loading: false,
  error: undefined,
  currentPage: 1,
  itemsPerPage: 20,
  viewMode: 'cards'
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
      // Não resetar a página automaticamente - apenas quando explicitamente solicitado
      return { ...state, filteredStartups: action.payload };
    
    case 'RESET_PAGE':
      return { ...state, currentPage: 1 };
    
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
        currentPage: 1, // Resetar página apenas quando filtros mudarem
      };
    
    case 'SET_VIEW_MODE':
      const itemsPerPage = action.payload === 'list' ? 200 : 100;
      return { ...state, viewMode: action.payload, itemsPerPage, currentPage: 1 };
    
    case 'SET_PAGE':
      // Validar limites da página
      const totalPages = Math.ceil(state.filteredStartups.length / state.itemsPerPage);
      const validPage = Math.max(1, Math.min(action.payload, totalPages || 1));
      return { ...state, currentPage: validPage };
    
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

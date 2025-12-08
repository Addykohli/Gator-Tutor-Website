import { createContext, useContext, useReducer, useEffect } from 'react';

// Create the context
const Context = createContext();

// Helper function to get dark mode preference from localStorage
const getInitialDarkMode = () => {
  // Check for saved preference in localStorage
  try {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      return JSON.parse(savedDarkMode);
    }
  } catch (error) {
    console.error('Error reading dark mode preference from localStorage:', error);
  }
  
  // Fall back to system preference if no saved preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  // Default to light mode if we can't determine the preference
  return false;
};

// Initial state
const initialState = {
  user: {
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    isTutor: false,
    role: 'student' // 'student', 'tutor', 'admin', or 'both'
  },
  isAuthenticated: false,
  loading: true,
  darkMode: getInitialDarkMode()
};

// Reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: {
          id: action.payload.id,
          firstName: action.payload.firstName || '',
          lastName: action.payload.lastName || '',
          email: action.payload.email || '',
          isTutor: action.payload.isTutor || false,
          role: action.payload.role || 'student'
        },
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      // Clear user data from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      return {
        ...state,
        user: {
          id: null,
          firstName: '',
          lastName: '',
          email: '',
          isTutor: false,
          role: 'student'
        },
        isAuthenticated: false,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'TOGGLE_DARK_MODE': {
      const newDarkMode = !state.darkMode;
      // Save to localStorage
      try {
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      } catch (error) {
        console.error('Error saving dark mode preference to localStorage:', error);
      }
      return {
        ...state,
        darkMode: newDarkMode
      };
    }
    default:
      return state;
  }
};

// Helper function to update the dark mode class on the root element
const updateDarkModeClass = (isDarkMode) => {
  const root = document.documentElement;
  if (isDarkMode) {
    root.classList.add('dark-mode');
    root.classList.remove('light-mode');
  } else {
    root.classList.add('light-mode');
    root.classList.remove('dark-mode');
  }
};

// Context Provider Component
export const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Apply dark mode on initial load and when it changes
  useEffect(() => {
    updateDarkModeClass(state.darkMode);
  }, [state.darkMode]);

  // Check for existing session on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for existing session in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          dispatch({
            type: 'LOGIN',
            payload: {
              id: userData.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              isTutor: userData.isTutor || false,
              role: userData.role || 'student'
            }
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (userData) => {
    try {
      // Store user data in localStorage
      const userToStore = {
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        isTutor: userData.isTutor || false,
        role: userData.role || 'student',
        authToken: userData.authToken
      };
      
      localStorage.setItem('user', JSON.stringify(userToStore));
      if (userData.authToken) {
        localStorage.setItem('authToken', userData.authToken);
      }
      
      dispatch({
        type: 'LOGIN',
        payload: userToStore
      });
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Toggle dark mode function
  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  return (
    <Context.Provider value={{ ...state, login, logout, toggleDarkMode }}>
      {!state.loading ? children : <div>Loading...</div>}
    </Context.Provider>
  );
};

// Custom hook to use the context
export const useAuth = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useAuth must be used within a ContextProvider');
  }
  return context;
};

export default Context;
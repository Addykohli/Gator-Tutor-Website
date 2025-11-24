import { createContext, useContext, useReducer, useEffect } from 'react';

// Create the context
const Context = createContext();

// Initial state
const initialState = {
  user: {
    id: null,
    firstName: '',
    lastName: '',
    isTutor: false
  },
  isAuthenticated: false,
  loading: true
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
          isTutor: action.payload.isTutor || false
        },
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: {
          id: null,
          firstName: '',
          lastName: '',
          isTutor: false
        },
        isAuthenticated: true, //false
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

// Context Provider Component
export const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

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
              lastName: userData.lastName
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
      localStorage.setItem('user', JSON.stringify(userData));
      console.log(userData);
      dispatch({
        type: 'LOGIN',
        payload: {
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isTutor: userData.isTutor || false

        }
      });
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Remove user data from localStorage
      localStorage.removeItem('user');
      
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Context.Provider value={{
      ...state,
      login,
      logout
    }}>
      {!state.loading && children}
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
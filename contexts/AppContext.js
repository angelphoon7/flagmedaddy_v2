import { createContext, useContext, useReducer } from 'react';
import kycService from '../utils/kycService';

const AppContext = createContext();

const initialState = {
  isConnected: false,
  userAddress: null,
  userProfile: null,
  isProfileComplete: false,
  loading: false,
  error: null
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CONNECT_WALLET':
      return { 
        ...state, 
        isConnected: true, 
        userAddress: action.payload,
        loading: false,
        error: null
      };
    
    case 'DISCONNECT_WALLET':
      return { 
        ...state, 
        isConnected: false, 
        userAddress: null,
        userProfile: null,
        isProfileComplete: false,
        loading: false,
        error: null
      };
    
    case 'SET_USER_PROFILE':
      return { 
        ...state, 
        userProfile: action.payload,
        isProfileComplete: true
      };
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const connectWallet = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null }); // Clear any previous errors
      
      // Connect to MetaMask
      const address = await kycService.connectWallet();
      dispatch({ type: 'CONNECT_WALLET', payload: address });
      
      // Set contract address for KYC Profile on Oasis Sapphire
      const contractAddress = process.env.NEXT_PUBLIC_KYC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
      console.log('Setting KYC contract address:', contractAddress);
      
      if (contractAddress === '0x0000000000000000000000000000000000000000') {
        console.warn('KYC contract address not set. Please deploy the contract and set NEXT_PUBLIC_KYC_CONTRACT_ADDRESS');
        return;
      }
      
      try {
        kycService.setContractAddress(contractAddress);
        console.log('KYC contract address set successfully');
      } catch (error) {
        console.error('Failed to set KYC contract address:', error);
        throw new Error(`Failed to initialize KYC contract: ${error.message}`);
      }
      
      // Check if user is already registered on the blockchain
      const isRegistered = await kycService.isRegistered(address);
      if (isRegistered) {
        const publicProfile = await kycService.getPublicProfile(address);
        dispatch({ type: 'SET_USER_PROFILE', payload: publicProfile });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };



  const disconnectWallet = async () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('fmd_registered');
      }
    } catch {}
    dispatch({ type: 'DISCONNECT_WALLET' });
  };

  const createProfile = (profileData) => {
    dispatch({ type: 'SET_USER_PROFILE', payload: profileData });
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('fmd_registered', '1');
      }
    } catch {}
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };



  const value = {
    ...state,
    connectWallet,
    disconnectWallet,
    createProfile,
    clearError
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 
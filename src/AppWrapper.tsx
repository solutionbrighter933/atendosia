import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthContext } from './components/AuthProvider';
import LoadingSpinner from './components/LoadingSpinner';
import AuthScreen from './components/AuthScreen';
import App from './App';

const AppWrapper: React.FC = () => {
  const { user, loading, error } = useAuthContext();
  const location = useLocation();
  const [developerMode, setDeveloperMode] = useState(false);

  // Check for developer mode flag in localStorage
  React.useEffect(() => {
    const isDeveloperMode = localStorage.getItem('developer_mode') === 'true';
    setDeveloperMode(isDeveloperMode);
  }, []);
  

  if (loading) {
    return <LoadingSpinner error={error} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <App />;
};

export default AppWrapper;
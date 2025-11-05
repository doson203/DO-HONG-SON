import React, { useState } from 'react';
import App from './App';
import LoginPage from './components/LoginPage';
import * as authService from './services/authService';
import { ApiKeyStatus } from './services/apiKeyService'; // Import the type

type AuthType = 'owner' | 'guest' | 'user';

interface AuthWrapperProps {
    onInvalidApiKey: () => void;
    apiKeyStatus: ApiKeyStatus; // Receive the full status object
    onUpdatePremiumStatus: (status: 'yes' | 'no') => void; // Receive the updater function
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ onInvalidApiKey, apiKeyStatus, onUpdatePremiumStatus }) => {
    // Check initial auth state from localStorage
    const [authType, setAuthType] = useState<AuthType | null>(authService.getAuthType());
    // State to manage the UI for changing the key
    const [isChangingKey, setIsChangingKey] = useState(false);

    // This is called from LoginPage when a new key is submitted
    const handleLoginAttempt = (key: string): boolean => {
        const type = authService.login(key);
        if (type) {
            // New key is valid and has been saved to localStorage.
            // Update the state to show the App component.
            setAuthType(type);
            setIsChangingKey(false);
            return true;
        }
        // New key is invalid, do nothing to state, just return false
        // The user stays on the login page and can either retry or cancel.
        return false;
    };

    // This is called from the Header "Change Key" button
    const requestChangeKey = () => {
        setIsChangingKey(true);
    };
    
    // This is called from the LoginPage "Go Back" button
    const cancelChangeKey = () => {
        setIsChangingKey(false);
    };
    
    // If user is authenticated AND not in the process of changing their key, show the app
    if (authType && !isChangingKey) {
        return (
            <App 
                authType={authType} 
                onLogout={requestChangeKey} 
                onInvalidApiKey={onInvalidApiKey}
                apiKeyStatus={apiKeyStatus} // Pass down the status
                onUpdatePremiumStatus={onUpdatePremiumStatus} // Pass down the updater
            />
        );
    }

    // Otherwise, show the login page.
    // It can "go back" only if the user was previously authenticated and just requested to change the key.
    return <LoginPage onLogin={handleLoginAttempt} onGoBack={authType ? cancelChangeKey : undefined} />;
};

export default AuthWrapper;

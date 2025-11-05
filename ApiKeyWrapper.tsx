import React, { useState } from 'react';
import AuthWrapper from './AuthWrapper';
import ApiKeyInputPage from './components/ApiKeyInputPage';
import * as apiKeyService from './services/apiKeyService';
import { ApiKeyStatus } from './services/apiKeyService';

const ApiKeyWrapper: React.FC = () => {
    const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(apiKeyService.getApiKeyStatus());

    const handleSetKey = (key: string) => {
        const newStatus: ApiKeyStatus = { key, premium: 'unknown' };
        apiKeyService.setApiKeyStatus(newStatus);
        setApiKeyStatus(newStatus);
    };
    
    // This function handles truly invalid keys (e.g., wrong format, expired)
    const handleInvalidKey = () => {
        apiKeyService.clearApiKey();
        setApiKeyStatus(null);
    };

    // This function updates the status of premium features without logging out
    const handleUpdatePremiumStatus = (status: 'yes' | 'no') => {
        setApiKeyStatus(prev => {
            if (!prev) return null;
            const newStatus = { ...prev, premium: status };
            apiKeyService.setApiKeyStatus(newStatus);
            return newStatus;
        });
    };

    if (!apiKeyStatus) {
        return <ApiKeyInputPage onSetKey={handleSetKey} />;
    }
    
    // Pass the full status and the new update handler down the chain
    return (
        <AuthWrapper 
            apiKeyStatus={apiKeyStatus}
            onInvalidApiKey={handleInvalidKey} 
            onUpdatePremiumStatus={handleUpdatePremiumStatus}
        />
    );
};

export default ApiKeyWrapper;

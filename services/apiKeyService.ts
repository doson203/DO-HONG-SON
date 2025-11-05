// FIX: Removed circular dependency. The function 'getApiKeyStatus' is defined below,
// so importing it from its own module index ('.') is incorrect and causes a build error.

const API_KEY_STATUS_STORAGE_KEY = 'pidtap-studio-gemini-api-key-status';

export interface ApiKeyStatus {
    key: string;
    premium: 'unknown' | 'yes' | 'no';
}

export const getApiKeyStatus = (): ApiKeyStatus | null => {
    const data = localStorage.getItem(API_KEY_STATUS_STORAGE_KEY);
    if (!data) return null;
    try {
        // Basic validation to ensure it's an object with a key property
        const parsed = JSON.parse(data);
        if (typeof parsed === 'object' && parsed !== null && 'key' in parsed && 'premium' in parsed) {
            return parsed as ApiKeyStatus;
        }
        // If data is malformed, clear it
        clearApiKey();
        return null;
    } catch {
        // If parsing fails, clear it
        clearApiKey();
        return null;
    }
};

export const setApiKeyStatus = (status: ApiKeyStatus): void => {
    localStorage.setItem(API_KEY_STATUS_STORAGE_KEY, JSON.stringify(status));
};

export const clearApiKey = (): void => {
    localStorage.removeItem(API_KEY_STATUS_STORAGE_KEY);
};

export const getApiKey = (): string | null => {
    return getApiKeyStatus()?.key || null;
};
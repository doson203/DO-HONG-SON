// For this environment, we'll use a hardcoded key.
// In a real application, this should be an environment variable.
const MASTER_KEY = 'SƠN ĐẸP ZAI';
const GUEST_KEY = 'pidtapguest';
const USER_KEY = 'pidtapuser'; // New key for a standard user
const AUTH_STORAGE_KEY = 'pidtap-studio-auth'; // UPDATED: from session to persistent storage

type AuthType = 'owner' | 'guest' | 'user';

interface AuthState {
    type: AuthType;
}

export const getAuthType = (): AuthType | null => {
    // UPDATED: Read from localStorage
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authData) {
        try {
            const parsed: AuthState = JSON.parse(authData);
            return parsed.type;
        } catch (e) {
            return null;
        }
    }
    return null;
};

export const isAuthenticated = (): boolean => {
    return getAuthType() !== null;
};

export const login = (accessKey: string): AuthType | null => {
    let authState: AuthState | null = null;
    
    if (accessKey === MASTER_KEY) {
        authState = { type: 'owner' };
    } else if (accessKey === GUEST_KEY) {
        authState = { type: 'guest' };
    } else if (accessKey === USER_KEY) {
        authState = { type: 'user' };
    }

    if (authState) {
        // UPDATED: Write to localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
        return authState.type;
    }

    return null;
};

export const logout = (): void => {
    // UPDATED: Remove from localStorage. The page reload/state change is handled by the UI.
    localStorage.removeItem(AUTH_STORAGE_KEY);
};
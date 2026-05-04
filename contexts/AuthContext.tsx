import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

function getTopLevelDomain() {
    const hostname = window.location.hostname;
    if (/^[0-9.]+$/.test(hostname) || hostname === 'localhost') {
        return hostname;
    }
    const parts = hostname.split('.');
    if (parts.length > 2) {
        return '.' + parts.slice(-2).join('.');
    }
    return '.' + hostname;
}

function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    const domain = getTopLevelDomain();
    const domainString = domain === 'localhost' || /^[0-9.]+$/.test(domain) ? '' : `; domain=${domain}`;
    document.cookie = name + "=" + (value || "") + expires + "; path=/" + domainString;
}

function getCookie(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name: string) {
    const domain = getTopLevelDomain();
    const domainString = domain === 'localhost' || /^[0-9.]+$/.test(domain) ? '' : `; domain=${domain}`;
    document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT" + domainString;
}

interface User {
    id: string;
    email: string;
    nickname: string;
    realName?: string;
    profileImage?: string;
    role: string;
    venueId?: string;
    ccaId?: string;
    level?: number;
    totalXp?: number;
    points?: number;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check local storage and cookie for initial auth state
        const storedUser = localStorage.getItem('user');
        const cookieUser = getCookie('jtvstar_user');
        
        if (cookieUser) {
            try {
                const parsed = JSON.parse(decodeURIComponent(cookieUser));
                setUser(parsed);
                // Sync cookie to localstorage if different
                if (storedUser !== decodeURIComponent(cookieUser)) {
                    localStorage.setItem('user', decodeURIComponent(cookieUser));
                }
            } catch(e) {
                console.error("Failed to parse user cookie", e);
            }
        } else if (storedUser) {
            setUser(JSON.parse(storedUser));
            // Sync local storage to cookie
            setCookie('jtvstar_user', encodeURIComponent(storedUser), 30);
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        const userDataStr = JSON.stringify(userData);
        localStorage.setItem('user', userDataStr);
        setCookie('jtvstar_user', encodeURIComponent(userDataStr), 30);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        eraseCookie('jtvstar_user');
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            const userDataStr = JSON.stringify(updatedUser);
            localStorage.setItem('user', userDataStr);
            setCookie('jtvstar_user', encodeURIComponent(userDataStr), 30);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

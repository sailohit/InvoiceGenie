import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, UserEntity } from '@/db/db';

interface AuthContextType {
    user: UserEntity | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access the authentication context.
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Generates a random cryptographic salt.
 */
function generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Hashes a password using the browser's native Web Crypto API (SHA-256).
 * This ensures no external dependencies are needed for basic security.
 * @param password The plain text password
 * @param salt Optional salt. If provided, it's appended to the password.
 * @returns The hex string of the hashed password
 */
async function hashPassword(password: string, salt: string = ''): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserEntity | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage for session
        const checkSession = async () => {
            try {
                const storedUserId = localStorage.getItem('invoice_genie_user_id');
                if (storedUserId) {
                    const userStart = await db.users.get(Number(storedUserId));
                    if (userStart) {
                        setUser(userStart);
                    } else {
                        localStorage.removeItem('invoice_genie_user_id');
                    }
                }
            } catch (error) {
                console.error("Session check failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const foundUser = await db.users.where('username').equals(username).first();

            if (!foundUser) return false;

            // Scenario 1: User has Salt (Modern Security)
            if (foundUser.salt) {
                const hashedPassword = await hashPassword(password, foundUser.salt);
                if (foundUser.passwordHash === hashedPassword) {
                    setUser(foundUser);
                    if (foundUser.id) localStorage.setItem('invoice_genie_user_id', foundUser.id.toString());
                    return true;
                }
            }
            // Scenario 2: Legacy User (No Salt) - Lazy Migration
            else {
                const legacyHash = await hashPassword(password); // No salt
                if (foundUser.passwordHash === legacyHash) {
                    // Upgrade security
                    const newSalt = generateSalt();
                    const newHash = await hashPassword(password, newSalt);

                    await db.users.update(foundUser.id!, {
                        salt: newSalt,
                        passwordHash: newHash
                    });

                    const updatedUser = { ...foundUser, salt: newSalt, passwordHash: newHash };
                    setUser(updatedUser);
                    if (foundUser.id) localStorage.setItem('invoice_genie_user_id', foundUser.id.toString());
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error("Login error", error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('invoice_genie_user_id');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

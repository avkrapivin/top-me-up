import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    onIdTokenChanged,
    updateProfile,
    sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../services/api';

const getFirebaseErrorMessage = (error) => {
    const errorCode = error.code;
    
    const errorMessage = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email format',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-not-found': 'User not found',
        'auth/wrong-password': 'Invalid email or password',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Check your internet connection',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/operation-not-allowed': 'This authentication method is disabled',
        'auth/configuration-not-found': 'Firebase is not configured properly',
    };

    return errorMessage[errorCode] || error.message;
};

export const useAuthStore = create(

    persist(
        (set, get) => ({
            user: null,
            token: null,
            loading: false,
            error: null,
            isInitialized: false,
            verificationSent: false,

            signUp: async (email, password, displayName) => {
                try {
                    set({ loading: true, error: null, verificationSent: false });

                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;

                    await updateProfile(user, { displayName });

                    await sendEmailVerification(user);
                    set({ verificationSent: true });

                    const token = await user.getIdToken();

                    try {
                        await api.post('/auth/user', {
                            firebaseUid: user.uid,
                            email: user.email,
                            displayName: user.displayName
                        });
                    } catch (backendError) {
                        console.error('Backend user creation failed (non-critical):', backendError);
                    }
                    

                    set({
                        user: {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            emailVerified: user.emailVerified,
                        },
                        token,
                        loading: false,
                    });

                    return user;
                } catch (error) {
                    const userFriendlyMessage = getFirebaseErrorMessage(error);
                    set({ error: userFriendlyMessage, loading: false });
                    throw error;
                }
            },

            signIn: async (email, password) => {
                try {
                    set({ loading: true, error: null });

                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;

                    if (!user.emailVerified) {
                        set({
                            error: 'Please verify your email before logging in',
                            loading: false
                        });
                        throw new Error('Email not verified');
                    }

                    const token = await user.getIdToken();

                    try {
                        await api.post('/auth/user', {
                            firebaseUid: user.uid,
                            email: user.email,
                            displayName: user.displayName
                        });
                    } catch (backendError) {
                        console.error('Backend sync failded (non-critical):', backendError);
                    }


                    set({
                        user: {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            emailVerified: user.emailVerified,
                        },
                        token,
                        loading: false
                    });

                    return user;
                } catch (error) {
                    const userFriendlyMessage = getFirebaseErrorMessage(error);
                    set({ error: userFriendlyMessage, loading: false });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    set({ loading: true, error: null });

                    await signOut(auth);

                    set({
                        user: null,
                        token: null,
                        loading: false,
                        verificationSent: false
                    });
                } catch (error) {
                    const userFriendlyMessage = getFirebaseErrorMessage(error);
                    set({ error: userFriendlyMessage, loading: false });
                    throw error;
                }
            },

            updateToken: (newToken) => {
                set({ token: newToken });
            },

            updateUser: (userData) => {
                set(state => ({
                    user: { ...state.user, ...userData }
                }));
            },

            updateDisplayName: (displayName) => {
                set((state) => ({
                    user: state.user ? { ...state.user, displayName } : state.user
                }));
            },

            clearError: () => {
                set({ error: null });
            },

            clearVerificationSent: () => {
                set({ verificationSent: false });
            },

            initializeAuth: () => {
                if (get().isInitialized) return;

                let refreshTimerId = null;

                const startTokenAutoRefresh = () => {
                    clearInterval(refreshTimerId);
                    refreshTimerId = setInterval(async () => {
                        try {
                            const user = auth.currentUser;
                            if (user) {
                                const token = await user.getIdToken(true);
                                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                                get().updateToken(token);
                                console.log('Token refreshed automatically');
                            }
                        } catch (e) {
                            console.error('Auto-refresh token failed:', e);
                        }
                    }, 50 * 60 * 1000); // Refresh every 50 minutes
                };

                const stopTokenAutoRefresh = () => {
                    clearInterval(refreshTimerId);
                    refreshTimerId = null;
                }

                const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
                    if (firebaseUser) {
                        try {
                            const token = await firebaseUser.getIdToken();

                            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                            set({
                                user: {
                                    uid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: firebaseUser.displayName,
                                    emailVerified: firebaseUser.emailVerified,
                                },
                                token,
                                loading: false,
                                isInitialized: true
                            });

                            startTokenAutoRefresh();

                            try {
                                await api.post('/auth/user', {
                                    firebaseUid: firebaseUser.uid,
                                    email: firebaseUser.email,
                                    displayName: firebaseUser.displayName
                                });
                            } catch (backendError) {
                                console.error('Backend sync failded (non-critical):', backendError);
                            }
                        } catch (error) {
                            console.error('Error getting token:', error);
                            set({
                                user: null,
                                token: null,
                                loading: false,
                                isInitialized: true
                            });
                        }
                    } else {
                        stopTokenAutoRefresh();
                        set({
                            user: null,
                            token: null,
                            loading: false,
                            isInitialized: true
                        });
                    }
                });

                const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
                    if (firebaseUser) {
                        try {
                            const token = await firebaseUser.getIdToken(true);
                            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                            get().updateToken(token);
                            console.log('Token refreshed automatically');
                        } catch (error) {
                            console.error('Error updating token:', error);
                        }
                    }
                });

                return () => {
                    unsubscribeAuth();
                    unsubscribeToken();
                    stopTokenAutoRefresh();
                };
            }
        }),
        {
            name: 'topmeup-auth-storage',
            storage: createJSONStorage(() => localStorage),

            partialize: (state) => ({
                user: state.user,
                token: state.token,
            }),

            version: 1,
        }
    )
);
'use client';

import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import '@/lib/amplify-client';


function HandleAuthRedirect() {
    const { user } = useAuthenticator((context) => [context.user]);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/event');
        }
    }, [user, router]);
    return null;
}


export default function AuthPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg">
                        Q&A
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-purple-200 mb-3">
                        Welcome Back
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Sign in to create and manage your events</p>
                </div>

                {/* Auth Component */}
                <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    <Authenticator.Provider>
                        <Authenticator
                            hideSignUp={false}
                            components={{
                                Header() {
                                    return (
                                        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                    </svg>
                                                </div>
                                                <h2 className="text-xl font-bold">Q&A Platform</h2>
                                            </div>
                                            <p className="text-blue-100 text-sm mt-2">Secure authentication powered by AWS</p>
                                        </div>
                                    );
                                }
                            }}
                        >
                            <HandleAuthRedirect />
                        </Authenticator>
                    </Authenticator.Provider>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Don't have an account? You can still participate as a guest!</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span>Secure</span>
                        <span>•</span>
                        <span>Fast</span>
                        <span>•</span>
                        <span>Reliable</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
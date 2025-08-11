'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser, signOut } from 'aws-amplify/auth';

interface User {
    username: string;
    userId: string;
}

export default function MainHeader() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { username, userId } = await getCurrentUser();
                setUser({ username, userId });
            } catch (error) {
                setUser(null);
            }
        };
        checkUser();

        const hubListener = Hub.listen('auth', ({ payload }) => {
            switch (payload.event) {
                case 'signedIn':
                    checkUser();
                    break;
                case 'signedOut':
                    setUser(null);
                    break;
            }
        });

        return () => hubListener();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/auth');
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
            <div className="container mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo/Brand */}
                    <div className="flex items-center gap-3">
                        <div
                            onClick={() => router.push('/event')}
                            className="cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                Q&A
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Q&A Platform
                            </h1>
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {user.username}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Event Creator
                                    </span>
                                </div>
                                <div
                                    onClick={handleSignOut}
                                    className="relative group cursor-pointer"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105">
                                        {user.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute right-0 top-12 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        Click to sign out
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push('/auth')}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                            >
                                <span>Sign In</span>
                                <span className="text-sm">→</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
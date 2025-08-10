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
        <header className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 flex justify-between items-center border-b dark:border-gray-700">
            <div className="flex items-center">
                <h1
                    onClick={() => router.push('/event')}
                    className="text-lg font-semibold cursor-pointer"
                >
                    Q&A Platform
                </h1>
            </div>
            <div className="flex items-center space-x-4">
                {user ? (
                    <>
                        <span className="font-medium">Welcome, {user.username}</span>
                        <div
                            onClick={handleSignOut}
                            className="rounded-full h-10 w-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 font-semibold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            {user.username.substring(0, 2).toUpperCase()}
                        </div>
                    </>
                ) : (
                    <button
                        onClick={() => router.push('/auth')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Sign In
                    </button>
                )}
            </div>
        </header>
    );
}
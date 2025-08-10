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
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">

            <Authenticator.Provider>
                <Authenticator hideSignUp={false}>

                    <HandleAuthRedirect />
                </Authenticator>
            </Authenticator.Provider>
        </div>
    );
}
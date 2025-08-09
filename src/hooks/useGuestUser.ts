'use client'

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from 'uuid';

interface GuestUser {
    id: string;
    name: string;
}

export function useGuestUser() {
    const [guestUser, setGuestUser] = useState<GuestUser | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('guestUser');
        if (storedUser) {
            setGuestUser(JSON.parse(storedUser));
        } else {
            const newGuestUser: GuestUser = {
                id: uuidv4(),
                name: ''
            };
            localStorage.setItem('guestUser', JSON.stringify(newGuestUser));
            setGuestUser(newGuestUser);
        }
    }, []);

    const setGuestName = (name: string) => {
        if (guestUser) {
            const updateUser = {
                ...guestUser,
                name: name.trim()
            };
            localStorage.setItem('guestUser', JSON.stringify(updateUser));
            setGuestUser(updateUser);

        }
    };

    return {
        guestUser,
        setGuestName,
    }

}
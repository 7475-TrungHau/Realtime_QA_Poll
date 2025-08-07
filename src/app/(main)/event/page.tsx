'use client';

import MainHeader from "./header";
import React, { useState } from "react";

// Define event type
interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    status: 'upcoming' | 'active' | 'past';
    attendees: number;
}

export default function EventPage() {
    const [events, setEvents] = useState<Event[]>([
        {
            id: '1',
            title: 'Tech Conference 2025',
            description: 'Annual technology conference featuring the latest innovations in AI and web development.',
            date: 'Aug 15, 2025',
            location: 'Ho Chi Minh City',
            status: 'upcoming',
            attendees: 250
        },
        {
            id: '2',
            title: 'React Workshop',
            description: 'Hands-on workshop covering React best practices and advanced patterns.',
            date: 'Aug 5, 2025',
            location: 'Hanoi',
            status: 'active',
            attendees: 50
        },
        {
            id: '3',
            title: 'Startup Networking Event',
            description: 'Connect with entrepreneurs and investors in the startup ecosystem.',
            date: 'Jul 20, 2025',
            location: 'Da Nang',
            status: 'past',
            attendees: 100
        },
        {
            id: '4',
            title: 'AI & Machine Learning Summit',
            description: 'Explore the future of artificial intelligence and machine learning applications.',
            date: 'Sep 10, 2025',
            location: 'Ho Chi Minh City',
            status: 'upcoming',
            attendees: 300
        }
    ]);
    const [showModal, setShowModal] = useState(false);

    const [newEvent, setNewEvent] = useState<Omit<Event, 'id' | 'status' | 'attendees'>>({
        title: '',
        description: '',
        date: '',
        location: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewEvent(prev => ({ ...prev, [name]: value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newId = Math.random().toString(36).substring(2);
        const eventToAdd: Event = {
            id: newId,
            title: newEvent.title,
            description: newEvent.description,
            date: newEvent.date,
            location: newEvent.location,
            status: 'upcoming',
            attendees: 0
        };
        setEvents(prev => [...prev, eventToAdd]);
        setNewEvent({
            title: '',
            description: '',
            date: '',
            location: ''
        });
        setShowModal(false);
    }

    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen rounded-sm">
            <MainHeader />

            <div className="w-full border-t border-gray-200 dark:border-gray-700 p-10 py-5">
                <div className="mx-auto ">
                    <div className="flex justify-between">
                        <div className="flex space-x-3">
                            <button className="px-3 py-2 flex space-x-2 items-center bg-green-200 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                <p className="text-green-500 font-bold">All</p>
                                <span className="font-bold dark:text-gray-400 bg-green-500 px-2 text-white rounded-md">{events.length}</span>
                            </button>
                            <button className="px-3 py-2 flex space-x-2 items-center bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer ">
                                <p>Active & upcoming</p>
                                <span className="font-bold dark:text-gray-400 bg-gray-300 px-2  rounded-md">{events.filter(e => e.status !== 'past').length}</span>
                            </button>
                            <button className="px-3 py-2 flex space-x-2 items-center bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                <p className="">Past</p>
                                <span className="font-bold dark:text-gray-400 bg-gray-300 px-2  rounded-md">{events.filter(e => e.status === 'past').length}</span>
                            </button>
                        </div>
                        <div className="flex space-x-3">
                            <>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="px-3 py-2 bg-green-600 dark:bg-gray-800 rounded-md hover:bg-green-700 dark:hover:bg-green-700 cursor-pointer"
                                >
                                    <p className="text-white">Create new event</p>
                                </button>

                                {showModal && (
                                    <div className="fixed inset-0 bg-gray-400/50 flex items-center justify-center z-50">
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                                            <h2 className="text-xl font-bold mb-4 dark:text-white">Create New Event</h2>
                                            <form className="space-y-4" onSubmit={handleSubmit}>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Event Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="title"
                                                        value={newEvent.title}
                                                        onChange={handleChange}
                                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="date"
                                                        value={newEvent.date}
                                                        onChange={handleChange}
                                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Location
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="location"
                                                        value={newEvent.location}
                                                        onChange={handleChange}
                                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        name="description"
                                                        value={newEvent.description}
                                                        onChange={handleChange}
                                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="flex justify-end space-x-3 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowModal(false)}
                                                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                                    >
                                                        Create Event
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </>

                            <button className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                <p className="text-gray-500">Import events</p>
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 w-full">
                        {events.length === 0 ? (
                            <div className="h-96 flex items-center justify-center gap-2">
                                <div>
                                    <p className="text-gray-500">No events found</p>
                                    <p className="text-blue-500 cursor-pointer active:text-blue-600 hover:text-blue-600">Create new event</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {events.map((event) => (
                                    <div key={event.id} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${event.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                event.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                }`}>
                                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                            </span>
                                        </div>

                                        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{event.title}</h2>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

                                        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {event.date}
                                            </div>
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {event.location}
                                            </div>
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                </svg>
                                                {event.attendees} attendees
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

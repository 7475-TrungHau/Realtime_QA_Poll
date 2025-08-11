// src/app/(main)/event/page.tsx
'use client';

import MainHeader from "./header";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation'; // Import useRouter
import { client } from '@/lib/amplify-client';
import { createEvent, listEvents } from '@/lib/graphql'; // Import mutation đã định nghĩa
import { getCurrentUser } from 'aws-amplify/auth';

// const client = generateClient();


// Định nghĩa lại Event type để khớp với GraphQL schema của backend
interface EventFromAPI {
    id: string;
    name: string;
    description: string;
    createdAt: string;
}

// Dùng cho form tạo mới, chưa có id và các trường khác
interface NewEventInput {
    name: string;
    description: string;
}

export default function EventPage() {

    const [events, setEvents] = useState<EventFromAPI[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [authUser, setAuthUser] = useState<{ userId: string, username: string } | null>(null);

    const router = useRouter();

    const [newEvent, setNewEvent] = useState<NewEventInput>({
        name: '',
        description: ''
    });

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const result: any = await client.graphql({ query: listEvents });
                setEvents(result.data.listEvents || []);

            } catch (e) {
                console.error('Error fetching events:', e);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Sửa lại tên trường từ 'title' thành 'name' để khớp với backend
        if (name === 'title') {
            setNewEvent(prev => ({ ...prev, name: value }));
        } else {
            setNewEvent(prev => ({ ...prev, [name]: value }));
        }
    }

    // Lấy user khi mở modal tạo event
    const handleOpenModal = async () => {
        try {
            const user = await getCurrentUser();
            setAuthUser({ userId: user.userId, username: user.username });
        } catch {
            setAuthUser(null);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.name.trim() || formLoading) return;
        if (!authUser) {
            alert('You must be logged in to create an event.');
            return;
        }
        setFormLoading(true);
        try {
            const result: any = await client.graphql({
                query: createEvent,
                variables: {
                    input: {
                        name: newEvent.name,
                        description: newEvent.description,
                        creatorId: authUser.userId,
                    },
                },
            });
            console.log('Create event result:', result);

            const newEventId = result.data.CreateEvent.id;
            if (newEventId) {
                router.push(`/event/${newEventId}`);
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please check the console.');
        } finally {
            setFormLoading(false);
            setShowModal(false); // Đóng modal sau khi xử lý xong
        }
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <MainHeader />

            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    {/* Filter buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button className="px-4 py-2 flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                            <span className="font-medium">All Events</span>
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">{events.length}</span>
                        </button>
                        <button className="px-4 py-2 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <span className="text-gray-700 dark:text-gray-300">Active & Upcoming</span>
                            <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-semibold">0</span>
                        </button>
                        <button className="px-4 py-2 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <span className="text-gray-700 dark:text-gray-300">Past</span>
                            <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-semibold">0</span>
                        </button>
                    </div>

                    <button
                        onClick={handleOpenModal}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Event
                    </button>
                </div>

                <div className="w-full">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
                            </div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No events yet</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by creating your first event!</p>
                            <button
                                onClick={handleOpenModal}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Create Your First Event
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    onClick={() => router.push(`/event/${event.id}`)}
                                    className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform">
                                            {event.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                            {new Date(event.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {event.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                                        {event.description || 'No description provided'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Click to view details</span>
                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Event Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Event</h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <form className="p-6 space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Event Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={newEvent.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                                        placeholder="Enter event name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={newEvent.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
                                        rows={4}
                                        placeholder="Describe your event (optional)"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading || !newEvent.name.trim()}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2"
                                    >
                                        {formLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Event'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
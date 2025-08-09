// src/app/(main)/event/page.tsx
'use client';

import MainHeader from "./header";
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation'; // Import useRouter
import { client } from '@/lib/amplify-client';
import { createEvent, listEvents } from '@/lib/graphql'; // Import mutation đã định nghĩa

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


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.name.trim() || formLoading) return;

        setFormLoading(true);
        try {
            const result: any = await client.graphql({
                query: createEvent,
                variables: {
                    input: {
                        name: newEvent.name,
                        description: newEvent.description,
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
        <div className="bg-white dark:bg-gray-900 min-h-screen rounded-sm">
            <MainHeader />

            <div className="w-full border-t border-gray-200 dark:border-gray-700 p-10 py-5">
                <div className="mx-auto ">
                    <div className="flex justify-between">
                        {/* Các nút filter tạm thời chưa có tác dụng */}
                        <div className="flex space-x-3">
                            <button className="px-3 py-2 flex space-x-2 items-center bg-green-200 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                <p className="text-green-500 font-bold">All</p>
                                <span className="font-bold dark:text-gray-400 bg-green-500 px-2 text-white rounded-md">1</span>
                            </button>
                            <button className="px-3 py-2 flex space-x-2 items-center bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer ">
                                <p>Active & upcoming</p>
                                <span className="font-bold dark:text-gray-400 bg-gray-300 px-2  rounded-md">0</span>
                            </button>
                            <button className="px-3 py-2 flex space-x-2 items-center bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                <p className="">Past</p>
                                <span className="font-bold dark:text-gray-400 bg-gray-300 px-2  rounded-md">0</span>
                            </button>
                        </div>
                        <div className="flex space-x-3">
                            <>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="px-3 py-2 bg-green-600 dark:bg-green-700 rounded-md hover:bg-green-700 dark:hover:bg-green-800 cursor-pointer"
                                >
                                    <p className="text-white">Create new event</p>
                                </button>

                                {showModal && (
                                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                                            <h2 className="text-xl font-bold mb-4 dark:text-white">Create New Event</h2>
                                            <form className="space-y-4" onSubmit={handleSubmit}>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Event Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="title" // Giữ nguyên name để không ảnh hưởng HTML, đã xử lý trong `handleChange`
                                                        value={newEvent.name}
                                                        onChange={handleChange}
                                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-700"
                                                        required
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
                                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md">Cancel</button>
                                                    <button type="submit" disabled={formLoading} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400">
                                                        {formLoading ? 'Creating...' : 'Create Event'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </>
                        </div>
                    </div>

                    <div className="mt-5 w-full">
                        {loading ? (
                            <div className="text-center p-10">Loading events...</div>
                        ) : events.length === 0 ? (
                            <div className="h-96 flex items-center justify-center">
                                <p className="text-gray-500">No events found. Click "Create new event" to start.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {events.map((event) => (
                                    <div key={event.id} onClick={() => router.push(`/event/${event.id}`)} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border cursor-pointer hover:shadow-lg">
                                        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white truncate">{event.name}</h2>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                                        <div className="text-xs text-gray-400">Created on {new Date(event.createdAt).toLocaleDateString()}</div>
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
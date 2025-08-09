// src/app/(main)/event/[eventId]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { client } from '@/lib/amplify-client';
import { getEvent, createQuestion, upvoteQuestion, onQuestionUpdated } from '@/lib/graphql';
import { useGuestUser } from '@/hooks/useGuestUser';
import type { Observable } from 'zen-observable-ts';


// const client = generateClient(); // <-- CÚ PHÁP MỚI

// Định nghĩa các kiểu dữ liệu
interface Author { id: string; name: string; }
interface Question { id: string; content: string; author: Author; upvotes: number; createdAt: string; isUpvotedByMe?: boolean; }
interface EventData { id: string; name: string; questions: Question[]; }

// Định nghĩa kiểu cho dữ liệu trả về từ subscription
interface SubscriptionEventData {
  value: { data: { onQuestionUpdated: Question } }
}

export default function EventQAPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { guestUser, setGuestName } = useGuestUser();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [userName, setUserName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);

  // Fetch dữ liệu ban đầu
  useEffect(() => {
    const fetchEventData = async () => {
      if (!guestUser) return;
      try {
        const result: any = await client.graphql({ // <-- Dùng client
          query: getEvent,
          variables: { id: eventId, userId: guestUser.id },
        });
        setEventData(result.data.getEvent);
      } catch (error) {
        console.error("Error fetching event data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [eventId, guestUser]);


  useEffect(() => {
    if (!eventId) return;

    console.log(`Setting up subscription for event: ${eventId}`);

    const graphqlOperation = client.graphql({
      query: onQuestionUpdated,
      variables: { eventId }
    });

    const subscription = (graphqlOperation as unknown as Observable<SubscriptionEventData>).subscribe({
      next: ({ value }) => {
        const updatedQuestion = value.data.onQuestionUpdated;
        if (!updatedQuestion) {
          console.log("Received an empty update.");
          return;
        }

        console.log('Real-time update received:', updatedQuestion);

        // Dùng callback form của setState để đảm bảo luôn nhận được state mới nhất
        setEventData(currentEventData => {
          // Nếu state hiện tại là null, không làm gì cả
          if (!currentEventData) {
            return null;
          }

          const newQuestions = [...currentEventData.questions];
          const existingIndex = newQuestions.findIndex(q => q.id === updatedQuestion.id);

          if (existingIndex > -1) {
            // Cập nhật câu hỏi đã có
            console.log(`Updating existing question ID: ${updatedQuestion.id} with upvotes: ${updatedQuestion.upvotes}`);
            newQuestions[existingIndex] = updatedQuestion;
          } else {
            // Thêm câu hỏi mới
            console.log(`Adding new question ID: ${updatedQuestion.id}`);
            newQuestions.unshift(updatedQuestion);
          }

          return { ...currentEventData, questions: newQuestions };
        });
      },
      error: (err: any) => console.error("Subscription error:", err)
    });

    return () => {
      console.log(`Cleaning up subscription for event: ${eventId}`);
      subscription.unsubscribe();
    };
  }, [eventId]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && guestUser) {
      setGuestName(userName.trim());
      setIsNameSet(true);
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionContent.trim() || !guestUser?.name) return;
    const optimisticQuestion: Question = {
      id: 'temp-' + Date.now(),
      content: newQuestionContent,
      author: { id: guestUser.id, name: guestUser.name },
      upvotes: 0,
      createdAt: new Date().toISOString(),
    };
    // Cập nhật giao diện trước để tạo cảm giác nhanh
    setEventData(prev => prev ? { ...prev, questions: [optimisticQuestion, ...prev.questions] } : null);
    setNewQuestionContent('');
    try {
      await client.graphql({
        query: createQuestion,
        variables: { input: { eventId, content: newQuestionContent, authorId: guestUser.id, authorName: guestUser.name } }
      });
    } catch (error) {
      console.error("Error creating question:", error);
      // Nếu lỗi, xóa câu hỏi tạm
      setEventData(prev => prev ? { ...prev, questions: prev.questions.filter(q => q.id !== optimisticQuestion.id) } : null);
    }
  };

  const handleUpvote = async (questionId: string) => {
    if (!guestUser) return;
    await client.graphql({
      query: upvoteQuestion,
      variables: { input: { eventId, questionId, userId: guestUser.id } }
    });
  };

  // UI Code giữ nguyên
  if (loading) return <div className="text-center p-10">Loading Event...</div>;
  if (!guestUser) return <div className="text-center p-10">Initializing...</div>; // Chờ guestUser được tạo
  if (!eventData) return <div className="text-center p-10">Event not found or failed to load.</div>;
  if (!isNameSet && !guestUser.name) { /* Form nhập tên */
    return (
      <div className="flex items-center justify-center min-h-screen">
        <form onSubmit={handleNameSubmit} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-bold">Enter your name to participate</h2>
          <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your name" className="w-full p-2 border rounded-md" required />
          <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-md">Join</button>
        </form>
      </div>
    )
  }
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">{eventData.name}</h1>
      {/* Form thêm câu hỏi */}
      <form onSubmit={handleAddQuestion} className="mb-6 p-4 border rounded-lg shadow-sm">
        <textarea className="w-full p-2 border rounded-md" rows={3} placeholder="Ask a question..." value={newQuestionContent} onChange={e => setNewQuestionContent(e.target.value)}></textarea>
        <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md">Submit Question</button>
      </form>
      {/* Danh sách câu hỏi */}
      <div className="space-y-4">
        {[...eventData.questions].sort((a, b) => b.upvotes - a.upvotes).map(question => (
          <div key={question.id} className="p-4 border rounded-lg shadow-sm">
            <p className="font-semibold text-lg">{question.content}</p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">By: {question.author.name}</p>
              <button onClick={() => handleUpvote(question.id)} className="flex items-center space-x-2 font-bold">
                <span>👍</span>
                <span>{question.upvotes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
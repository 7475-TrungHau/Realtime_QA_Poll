'use client';

import { useState, useEffect, use } from 'react';
import { client } from '@/lib/amplify-client';
import { getEvent, createQuestion, upvoteQuestion, onQuestionUpdated } from '@/lib/graphql';
import { useGuestUser } from '@/hooks/useGuestUser';
import type { Observable } from 'zen-observable-ts';
import { getCurrentUser } from 'aws-amplify/auth';


interface Author { id: string; name: string; }
interface Question { id: string; content: string; author: Author; upvotes: number; createdAt: string; isUpvotedByMe?: boolean; }
interface EventData { id: string; name: string; questions: Question[]; }
interface SubscriptionEventData { value: { data: { onQuestionUpdated: Question } } }

export default function EventQAPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { guestUser, setGuestName } = useGuestUser();
  const [authUser, setAuthUser] = useState<{ id: string, name: string } | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [userName, setUserName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);

  const [votedQuestionIds, setVotedQuestionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAuthUser = async () => {
      try {
        const { userId, username } = await getCurrentUser();
        setAuthUser({ id: userId, name: username });
      } catch (error) {
        setAuthUser(null);
      }
    };
    fetchAuthUser();
  }, []);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!guestUser) return;
      try {
        const result: any = await client.graphql({
          query: getEvent,
          variables: { id: eventId, userId: guestUser.id }
        });
        const eventData = result.data.getEvent;
        setEventData(eventData);

        if (eventData?.questions) {
          const votedIds: Set<string> = new Set(
            eventData.questions
              .filter((q: Question) => q.isUpvotedByMe)
              .map((q: Question) => q.id)
          );
          setVotedQuestionIds(votedIds);
        }
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

    console.log(`Attempting to set up subscription for event: ${eventId}`);

    const graphqlOperation = client.graphql({ query: onQuestionUpdated, variables: { eventId } });

    const subscription = (graphqlOperation as unknown as Observable<SubscriptionEventData>).subscribe({
      next: (data) => {
        console.log('>>> Real-time data received:', JSON.stringify(data, null, 2));

        const updatedQuestion = data.value.data.onQuestionUpdated;
        if (!updatedQuestion) return;

        setEventData(currentData => {
          if (!currentData) return null;
          let newQuestions = [...currentData.questions];
          const existingIndex = newQuestions.findIndex(q => q.id === updatedQuestion.id);

          if (existingIndex > -1) {
            newQuestions[existingIndex] = updatedQuestion;
          } else {
            newQuestions.unshift(updatedQuestion);
          }
          return { ...currentData, questions: newQuestions };
        });


        if (guestUser && updatedQuestion.isUpvotedByMe !== undefined) {
          setVotedQuestionIds(currentVotedIds => {
            const newVotedIds = new Set(currentVotedIds);
            if (updatedQuestion.isUpvotedByMe) {
              newVotedIds.add(updatedQuestion.id);
            } else {
              newVotedIds.delete(updatedQuestion.id);
            }
            return newVotedIds;
          });
        }
      },
      error: (error) => console.error('>>> SUBSCRIPTION ERROR:', JSON.stringify(error, null, 2)),
      complete: () => console.log('>>> Subscription complete.'),
    });

    return () => {
      console.log(`Cleaning up subscription for event: ${eventId}`);
      subscription.unsubscribe();
    };
  }, [eventId, guestUser]);


  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && guestUser) {
      setGuestName(userName.trim());
      setIsNameSet(true);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = authUser || guestUser;
    if (!newQuestionContent.trim() || !currentUser?.name) return;

    try {
      const result: any = await client.graphql({
        query: createQuestion,
        variables: { input: { eventId, content: newQuestionContent, authorId: currentUser.id, authorName: currentUser.name } }
      });


      const newQuestion = result.data.createQuestion;
      if (newQuestion) {
        setEventData(currentData => {
          if (!currentData) return null;
          const newQuestions = [newQuestion, ...currentData.questions];
          return { ...currentData, questions: newQuestions };
        });
      }

      setNewQuestionContent('');
    } catch (error) {
      console.error("Error creating question:", error);
    }
  };

  const handleUpvote = async (questionId: string) => {
    const currentUser = authUser || guestUser;
    if (!currentUser) return;

    const hasVoted = votedQuestionIds.has(questionId);
    const increment = hasVoted ? -1 : 1;

    // Cập nhật UI ngay lập tức (optimistic update)
    setEventData(currentData => {
      if (!currentData) return null;

      const newQuestions = currentData.questions.map(q =>
        q.id === questionId ? {
          ...q,
          upvotes: q.upvotes + increment,
          isUpvotedByMe: !hasVoted
        } : q
      );

      return { ...currentData, questions: newQuestions };
    });

    // Cập nhật trạng thái đã vote
    setVotedQuestionIds(currentVotedIds => {
      const newVotedIds = new Set(currentVotedIds);
      if (hasVoted) {
        newVotedIds.delete(questionId);
      } else {
        newVotedIds.add(questionId);
      }
      return newVotedIds;
    });

    // Gửi request lên backend
    try {
      await client.graphql({
        query: upvoteQuestion,
        variables: { input: { eventId, questionId, userId: currentUser.id } }
      });
    } catch (error) {
      console.error("Error upvoting question:", error);

      // Rollback nếu có lỗi
      setEventData(currentData => {
        if (!currentData) return null;
        const newQuestions = currentData.questions.map(q =>
          q.id === questionId ? {
            ...q,
            upvotes: q.upvotes - increment,
            isUpvotedByMe: hasVoted
          } : q
        );
        return { ...currentData, questions: newQuestions };
      });

      setVotedQuestionIds(currentVotedIds => {
        const newVotedIds = new Set(currentVotedIds);
        if (!hasVoted) {
          newVotedIds.delete(questionId);
        } else {
          newVotedIds.add(questionId);
        }
        return newVotedIds;
      });
    }
  };

  // UI Code
  if (loading) return <div className="text-center p-10">Loading Event...</div>;
  if (!guestUser) return <div className="text-center p-10">Initializing...</div>;
  if (!eventData) return <div className="text-center p-10">Event not found.</div>;
  if (!isNameSet && !guestUser.name) {
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
      <form onSubmit={handleAddQuestion} className="mb-6 p-4 border rounded-lg shadow-sm">
        <textarea className="w-full p-2 border rounded-md" rows={3} placeholder="Ask a question..." value={newQuestionContent} onChange={e => setNewQuestionContent(e.target.value)}></textarea>
        <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md">Submit Question</button>
      </form>
      <div className="space-y-4">
        {/* Sắp xếp danh sách ngay trước khi render */}
        {[...eventData.questions].sort((a, b) => b.upvotes - a.upvotes).map(question => {
          const isVoted = votedQuestionIds.has(question.id);
          return (
            <div key={question.id} className="p-4 border rounded-lg shadow-sm">
              <p className="font-semibold text-lg">{question.content}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">By: {question.author.name}</p>
                <button
                  onClick={() => handleUpvote(question.id)}
                  className={`flex items-center space-x-2 font-bold transition-colors ${isVoted
                    ? 'text-blue-600 bg-blue-50 px-3 py-1 rounded-md'
                    : 'text-gray-600 hover:text-blue-600'
                    }`}
                >
                  <span>{isVoted ? '👍' : '👍'}</span>
                  <span>{question.upvotes}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// src/app/(main)/event/[eventId]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { client } from '@/lib/amplify-client';
import { getEvent, createQuestion, upvoteQuestion, onQuestionUpdated, createPoll, submitPollVote, onPollUpdated } from '@/lib/graphql';
import { useGuestUser } from '@/hooks/useGuestUser';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Observable } from 'zen-observable-ts';

// --- Định nghĩa các kiểu dữ liệu ---
interface Author { id: string; name: string; }
interface Question { id: string; content: string; author: Author; upvotes: number; createdAt: string; isUpvotedByMe?: boolean; }
interface PollOption { text: string; votes: number; }
interface Poll { id: string; questionText: string; options: PollOption[]; totalVotes: number; myVote?: string | null; }
interface EventData { id: string; name: string; questions: Question[]; polls: Poll[]; creatorId: string; }
interface SubscriptionEventData<T> { value: { data: T } }
interface AuthUser { id: string; username: string; }

export default function EventQAPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { guestUser } = useGuestUser();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'qa' | 'polls'>('qa');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // --- State cho Q&A ---
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [votedQuestionIds, setVotedQuestionIds] = useState<Set<string>>(new Set());

  // --- State cho Polling ---
  const [showPollModal, setShowPollModal] = useState(false);
  const [newPoll, setNewPoll] = useState({ questionText: '', options: ['', ''] });
  const [votedPollIds, setVotedPollIds] = useState<Set<string>>(new Set());

  // --- Fetch dữ liệu & User ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        setAuthUser({ id: user.userId, username: user.username });
      } catch (e) { setAuthUser(null); }

      try {
        const result: any = await client.graphql({ query: getEvent, variables: { id: eventId, userId: guestUser?.id } });
        setEventData(result.data.getEvent);

        // Lấy trạng thái upvote cho user hiện tại
        if (result.data.getEvent?.questions) {
          const votedIds = new Set<string>(
            result.data.getEvent.questions
              .filter((q: Question) => q.isUpvotedByMe)
              .map((q: Question) => q.id)
          );
          setVotedQuestionIds(votedIds);
        }

        // Lấy trạng thái đã vote poll cho user hiện tại
        if (result.data.getEvent?.polls) {
          const votedPolls = new Set<string>(
            result.data.getEvent.polls
              .filter((p: any) => p.myVote != null)
              .map((p: any) => p.id)
          );
          setVotedPollIds(votedPolls);
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [eventId, guestUser]);

  // --- Lắng nghe Real-time ---
  useEffect(() => {
    if (!eventId) return;
    // Sub cho Q&A
    const q_op = client.graphql({ query: onQuestionUpdated, variables: { eventId } });
    const q_sub = (q_op as unknown as Observable<SubscriptionEventData<{ onQuestionUpdated: Question }>>).subscribe({
      next: ({ value }) => {
        const u = value.data.onQuestionUpdated;
        if (!u) return;
        setEventData(d => !d ? null : {
          ...d,
          questions: d.questions.some(q => q.id === u.id)
            ? d.questions.map(q => q.id === u.id ? { ...q, ...u } : q)
            : [u, ...d.questions]
        });

        // Nếu backend trả về isUpvotedByMe, cập nhật luôn trạng thái upvote
        if (u.isUpvotedByMe !== undefined) {
          setVotedQuestionIds(ids => {
            const newIds = new Set(ids);
            if (u.isUpvotedByMe) newIds.add(u.id);
            else newIds.delete(u.id);
            return newIds;
          });
        }
      },
    });
    // Sub cho Poll
    const p_op = client.graphql({ query: onPollUpdated, variables: { eventId } });
    const p_sub = (p_op as unknown as Observable<SubscriptionEventData<{ onPollUpdated: Poll }>>).subscribe({
      next: ({ value }) => {
        const u = value.data.onPollUpdated;
        if (!u) return;
        setEventData(d => !d ? null : { ...d, polls: d.polls.map(p => p.id === u.id ? u : p) });
      },
    });
    return () => { q_sub.unsubscribe(); p_sub.unsubscribe(); };
  }, [eventId]);

  // --- Các hàm xử lý ---
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionContent.trim() || !guestUser?.name) return;
    try {
      const result: any = await client.graphql({
        query: createQuestion,
        variables: { input: { eventId, content: newQuestionContent, authorId: guestUser.id, authorName: guestUser.name } }
      });
      setNewQuestionContent('');
      // Optimistic update: thêm vào UI ngay nếu backend không trả về qua subscription
      const newQ = result.data?.CreateQuestion;
      if (newQ) {
        setEventData(d => d ? { ...d, questions: [newQ, ...d.questions] } : d);
      }
    } catch (error) { console.error("Error creating question:", error); }
  };

  const handleUpvote = async (questionId: string) => {
    if (!guestUser) return;
    const hasVoted = votedQuestionIds.has(questionId);
    const increment = hasVoted ? -1 : 1;
    // Optimistic UI
    setEventData(d => d ? {
      ...d,
      questions: d.questions.map(q => q.id === questionId
        ? { ...q, upvotes: q.upvotes + increment }
        : q)
    } : null);
    setVotedQuestionIds(ids => {
      const newIds = new Set(ids);
      hasVoted ? newIds.delete(questionId) : newIds.add(questionId);
      return newIds;
    });
    // Backend call
    try {
      await client.graphql({ query: upvoteQuestion, variables: { input: { eventId, questionId, userId: guestUser.id } } });
    } catch (error) {
      console.error("Error upvoting:", error);
      // Rollback nếu cần
      setEventData(d => d ? {
        ...d,
        questions: d.questions.map(q => q.id === questionId
          ? { ...q, upvotes: q.upvotes - increment }
          : q)
      } : null);
      setVotedQuestionIds(ids => {
        const newIds = new Set(ids);
        !hasVoted ? newIds.delete(questionId) : newIds.add(questionId);
        return newIds;
      });
    }
  };

  const handleSubmitVote = async (pollId: string, optionText: string) => {
    if (!guestUser || votedPollIds.has(pollId)) return;
    // Optimistic update
    setEventData(d => d ? {
      ...d,
      polls: d.polls.map(p => p.id === pollId
        ? { ...p, totalVotes: p.totalVotes + 1, options: p.options.map(o => o.text === optionText ? { ...o, votes: o.votes + 1 } : o), myVote: optionText }
        : p)
    } : null);
    setVotedPollIds(ids => new Set(ids).add(pollId));
    try {
      await client.graphql({ query: submitPollVote, variables: { input: { eventId, pollId, optionText, userId: guestUser.id } } });
    } catch (error: any) {
      // Nếu lỗi đã vote rồi thì rollback optimistic update
      const errorMsg = error?.errors?.[0]?.message;
      if (errorMsg && errorMsg.includes("already voted")) {
        setEventData(d => d ? {
          ...d,
          polls: d.polls.map(p => {
            if (p.id !== pollId) return p;
            // Rollback lại số vote và myVote
            const optionIdx = p.options.findIndex(o => o.text === optionText);
            if (optionIdx === -1) return p;
            const newOptions = [...p.options];
            newOptions[optionIdx] = { ...newOptions[optionIdx], votes: newOptions[optionIdx].votes - 1 };
            return { ...p, totalVotes: p.totalVotes - 1, options: newOptions, myVote: null };
          })
        } : null);
        setVotedPollIds(ids => {
          const newIds = new Set(ids);
          newIds.delete(pollId);
          return newIds;
        });
        alert("You have already voted on this poll.");
      } else {
        console.error("Error submitting vote:", error);
      }
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({ ...newPoll, options: newOptions });
  };

  const handleAddPollOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = newPoll.options.map(o => ({ text: o })).filter(o => o.text.trim() !== '');
    if (newPoll.questionText.trim() === '' || validOptions.length < 2) {
      alert("Poll must have a question and at least two options.");
      return;
    }
    try {
      await client.graphql({
        query: createPoll,
        variables: { input: { eventId, questionText: newPoll.questionText, options: validOptions } }
      });
      setShowPollModal(false);
      setNewPoll({ questionText: '', options: ['', ''] });
    } catch (error) { console.error("Error creating poll:", error); }
  };

  // --- Giao diện (UI) ---
  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Loading Event...</p>
      </div>
    </div>
  );
  
  if (!eventData) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event not found</h3>
        <p className="text-gray-600 dark:text-gray-400">The event you're looking for doesn't exist or has been removed.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Event Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              {eventData.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{eventData.name}</h1>
              {eventData.description && (
                <p className="text-gray-600 dark:text-gray-400 text-lg">{eventData.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button 
                onClick={() => setActiveTab('qa')} 
                className={`py-3 px-6 text-lg font-semibold rounded-lg transition-all ${
                  activeTab === 'qa' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Q&A
                  <span className="bg-gray-200 dark:bg-gray-700 text-xs px-2 py-1 rounded-full">{eventData.questions.length}</span>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('polls')} 
                className={`py-3 px-6 text-lg font-semibold rounded-lg transition-all ${
                  activeTab === 'polls' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Polls
                  <span className="bg-gray-200 dark:bg-gray-700 text-xs px-2 py-1 rounded-full">{eventData.polls.length}</span>
                </div>
              </button>
            </div>
            
            {/* Create Poll Button */}
            {authUser && activeTab === 'polls' && (
              <button 
                onClick={() => setShowPollModal(true)} 
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Poll
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Q&A Content */}
            {activeTab === 'qa' && (
              <div className="space-y-6">
                {/* Add Question Form */}
                <form onSubmit={handleAddQuestion} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <textarea 
                        className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none" 
                        rows={3} 
                        placeholder="Ask a question about this event..." 
                        value={newQuestionContent} 
                        onChange={e => setNewQuestionContent(e.target.value)}
                      />
                      <button 
                        type="submit" 
                        disabled={!newQuestionContent.trim()}
                        className="mt-3 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                      >
                        Submit Question
                      </button>
                    </div>
                  </div>
                </form>

                {/* Questions List */}
                <div className="space-y-4">
                  {[...eventData.questions].sort((a, b) => b.upvotes - a.upvotes).map(question => {
                    const isVoted = votedQuestionIds.has(question.id);
                    return (
                      <div key={question.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <p className="text-lg text-gray-900 dark:text-white mb-4">{question.content}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium">{question.author.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <span>By: {question.author.name}</span>
                            </div>
                            <span>•</span>
                            <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                          </div>
                          <button
                            onClick={() => handleUpvote(question.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                              isVoted
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            <svg className="w-5 h-5" fill={isVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span>{question.upvotes}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Polls Content */}
            {activeTab === 'polls' && (
              <div className="space-y-8">
                {eventData.polls.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No polls yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">Polls will appear here when they're created.</p>
                  </div>
                ) : (
                  eventData.polls.map(poll => {
                    const isOwner = authUser?.id && eventData.creatorId && authUser.id === eventData.creatorId;
                    const hasVoted = poll.myVote != null;
                    return (
                      <div key={poll.id} className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">{poll.questionText}</h3>
                        <div className="space-y-4 mb-6">
                          {poll.options.map(option => {
                            const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
                            return (
                              <div key={option.text}>
                                <button
                                  onClick={() => !isOwner && !hasVoted && handleSubmitVote(poll.id, option.text)}
                                  disabled={isOwner || hasVoted}
                                  className="w-full text-left p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl relative overflow-hidden disabled:cursor-not-allowed hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                                >
                                  {/* Progress Bar */}
                                  <div
                                    className="absolute top-0 left-0 h-full bg-blue-100 dark:bg-blue-900 transition-all duration-500 rounded-xl"
                                    style={{ width: (isOwner || hasVoted) ? `${percentage}%` : '0%' }}
                                  />
                                  
                                  {/* Content */}
                                  <div className="relative flex justify-between items-center font-medium">
                                    <span className="text-gray-900 dark:text-white">{option.text}</span>
                                    <div className="flex items-center gap-3">
                                      {(isOwner || hasVoted) && (
                                        <>
                                          <span className="text-sm text-gray-600 dark:text-gray-400">{option.votes} votes</span>
                                          <span className="font-bold text-blue-600 dark:text-blue-400">{percentage.toFixed(0)}%</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Poll Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {poll.totalVotes} total votes
                          </p>
                          {isOwner && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-medium">
                              Event Owner - View Only
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Poll</h2>
                <button
                  onClick={() => setShowPollModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreatePoll} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Poll Question *
                </label>
                <input 
                  type="text" 
                  placeholder="Enter your poll question" 
                  value={newPoll.questionText} 
                  onChange={(e) => setNewPoll({ ...newPoll, questionText: e.target.value })} 
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Options *
                </label>
                <div className="space-y-3">
                  {newPoll.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                        {index + 1}
                      </span>
                      <input 
                        type="text" 
                        placeholder={`Option ${index + 1}`} 
                        value={option} 
                        onChange={(e) => handlePollOptionChange(index, e.target.value)} 
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                      />
                    </div>
                  ))}
                </div>
                <button 
                  type="button" 
                  onClick={handleAddPollOption} 
                  className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Option
                </button>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowPollModal(false)} 
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-medium"
                >
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
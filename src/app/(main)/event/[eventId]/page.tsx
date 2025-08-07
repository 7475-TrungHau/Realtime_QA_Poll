'use client';

import React, { useState } from 'react';

// Định nghĩa interface cho câu hỏi
interface Question {
  id: string;
  content: string;
  author: string;
  votes: number;
  isAnswered: boolean;
  createdAt: Date;
}

export default function EventQAPage() {
  // State để lưu trữ danh sách câu hỏi
  const [questions, setQuestions] = useState<Question[]>([
    // Dữ liệu mẫu
    {
      id: 'q1',
      content: 'Câu hỏi đầu tiên về sự kiện này là gì?',
      author: 'User 1',
      votes: 10,
      isAnswered: false,
      createdAt: new Date('2023-10-26T10:00:00Z'),
    },
    {
      id: 'q2',
      content: 'Làm thế nào để tham gia buổi hỏi đáp?',
      author: 'User 2',
      votes: 5,
      isAnswered: true,
      createdAt: new Date('2023-10-26T10:05:00Z'),
    },
  ]);

  // State cho nội dung câu hỏi mới
  const [newQuestionContent, setNewQuestionContent] = useState('');

  // Hàm xử lý khi người dùng nhập câu hỏi mới
  const handleNewQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewQuestionContent(e.target.value);
  };

  // Hàm xử lý khi submit câu hỏi mới
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestionContent.trim() === '') return;

    const newQ: Question = {
      id: Math.random().toString(36).substring(2, 9), // Tạo ID ngẫu nhiên
      content: newQuestionContent,
      author: 'Anonymous', // Có thể thay bằng tên người dùng thực tế
      votes: 0,
      isAnswered: false,
      createdAt: new Date(),
    };
    setQuestions([newQ, ...questions]); // Thêm câu hỏi mới vào đầu danh sách
    setNewQuestionContent(''); // Xóa nội dung input
  };

  // Hàm xử lý upvote
  const handleUpvote = (id: string) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, votes: q.votes + 1 } : q
    ));
  };

  // Hàm xử lý đánh dấu đã trả lời
  const handleToggleAnswered = (id: string) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, isAnswered: !q.isAnswered } : q
    ));
  };

  // Hàm xử lý xóa câu hỏi
  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Q&A for Event</h1>

      {/* Form thêm câu hỏi mới */}
      <form onSubmit={handleAddQuestion} className="mb-6 p-4 border rounded-lg shadow-sm">
        <textarea
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Đặt câu hỏi của bạn..."
          value={newQuestionContent}
          onChange={handleNewQuestionChange}
        ></textarea>
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Gửi câu hỏi
        </button>
      </form>

      {/* Danh sách câu hỏi */}
      <div className="space-y-4">
        {questions.sort((a, b) => b.votes - a.votes).map(question => (
          <div key={question.id} className="p-4 border rounded-lg shadow-sm bg-white">
            <p className="font-semibold text-lg">{question.content}</p>
            <p className="text-sm text-gray-600">Bởi: {question.author} - {new Date(question.createdAt).toLocaleString()}</p>
            <div className="flex items-center mt-2 space-x-4">
              <button
                onClick={() => handleUpvote(question.id)}
                className="flex items-center space-x-1 text-blue-500 hover:text-blue-700"
              >
                <span>👍</span>
                <span>{question.votes}</span>
              </button>
              <button
                onClick={() => handleToggleAnswered(question.id)}
                className={`px-2 py-1 rounded-md text-sm ${question.isAnswered ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}
              >
                {question.isAnswered ? 'Đã trả lời' : 'Chưa trả lời'}
              </button>
              <button
                onClick={() => handleDeleteQuestion(question.id)}
                className="px-2 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
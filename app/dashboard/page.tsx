'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PollList from '@/components/polls/PollList';

export default function DashboardPage() {
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual polls from API
    const mockPolls = [
      { id: '1', title: 'Favorite Programming Language', votes: 42, created_at: new Date().toISOString() },
      { id: '2', title: 'Best Frontend Framework', votes: 28, created_at: new Date().toISOString() },
      { id: '3', title: 'Most Important Developer Skill', votes: 15, created_at: new Date().toISOString() },
    ];
    
    setTimeout(() => {
      setPolls(mockPolls);
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Polls</h1>
        <Link 
          href="/polls/create" 
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Create New Poll
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p>Loading polls...</p>
        </div>
      ) : (
        <PollList polls={polls} />
      )}
    </div>
  );
}
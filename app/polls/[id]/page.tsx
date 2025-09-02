'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PollDetails from '@/components/polls/PollDetails';
import VoteForm from '@/components/polls/VoteForm';

export default function PollPage() {
  const params = useParams();
  const pollId = params.id as string;
  const [poll, setPoll] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual poll data from API
    const mockPoll = {
      id: pollId,
      title: 'Favorite Programming Language',
      description: 'Vote for your favorite programming language',
      options: [
        { id: '1', text: 'JavaScript', votes: 15 },
        { id: '2', text: 'Python', votes: 12 },
        { id: '3', text: 'TypeScript', votes: 8 },
        { id: '4', text: 'Java', votes: 7 },
      ],
      totalVotes: 42,
      created_at: new Date().toISOString(),
    };
    
    setTimeout(() => {
      setPoll(mockPoll);
      setIsLoading(false);
    }, 1000);
  }, [pollId]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <p>Loading poll...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-4">
      {poll ? (
        <>
          <PollDetails poll={poll} />
          <div className="mt-8">
            <VoteForm pollId={pollId} options={poll.options} />
          </div>
        </>
      ) : (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Poll not found
        </div>
      )}
    </div>
  );
}
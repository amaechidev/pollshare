'use client';

import Link from 'next/link';

interface Poll {
  id: string;
  title: string;
  votes: number;
  created_at: string;
}

interface PollListProps {
  polls: Poll[];
}

export default function PollList({ polls }: PollListProps) {
  if (polls.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <p className="text-gray-600">You haven&apos;t created any polls yet.</p>
        <Link 
          href="/polls/create" 
          className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Create your first poll
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => (
        <Link key={poll.id} href={`/polls/${poll.id}`}>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <h2 className="text-lg font-medium">{poll.title}</h2>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
              <span>{poll.votes} votes</span>
              <span>Created: {new Date(poll.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
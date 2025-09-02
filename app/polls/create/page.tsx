'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PollForm from '@/components/polls/PollForm';

export default function CreatePollPage() {
  const router = useRouter();
  
  const handlePollCreated = () => {
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Create New Poll</h1>
      <PollForm onPollCreated={handlePollCreated} />
    </div>
  );
}
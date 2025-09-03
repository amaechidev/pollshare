// components/polls/VoteForm.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { voteOnPoll } from "@/lib/actions/poll-actions";
import { Sparkles } from "lucide-react";

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
}

interface VoteFormProps {
  pollId: string;
  options: PollOption[];
}

// Function to generate and retrieve a simple client-side fingerprint
function getVoterFingerprint(): string {
  let fingerprint = localStorage.getItem("voter_fingerprint");
  if (!fingerprint) {
    fingerprint = crypto.randomUUID(); // Generate a new unique ID
    localStorage.setItem("voter_fingerprint", fingerprint);
  }
  return fingerprint;
}

export default function VoteForm({ pollId, options }: VoteFormProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) {
      toast.error("Please select an option to vote.");
      return;
    }

    const voterFingerprint = getVoterFingerprint();

    // Optimistic update: temporarily increment vote count for the selected option
    // (This is a simplified optimistic update and doesn't update total poll votes)
    const optimisticOptions = options.map((option) =>
      option.id === selectedOption
        ? { ...option, vote_count: option.vote_count + 1 }
        : option
    );
    // You would typically manage this via a state variable or a more robust
    // optimistic update mechanism that can be rolled back. For now,
    // we'll rely on revalidation after the server action completes.

    startTransition(async () => {
      const result = await voteOnPoll(pollId, selectedOption, voterFingerprint);

      if (result.success) {
        toast.success("Vote cast successfully!", {
          description: "Thank you for participating.",
        });
        // Revalidation in server action will fetch updated data, so no need for client-side state update here
      } else {
        toast.error("Failed to cast vote", {
          description:
            result.error ||
            "You might have already voted or an error occurred.",
        });
        // On error, potentially revert optimistic update if implemented more fully
      }
    });
  };

  return (
    <Card className="mt-8 shadow-lg rounded-xl">
      <CardHeader className="p-6">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Cast Your Vote
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Choose your preferred option from the list below.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <RadioGroup
            onValueChange={setSelectedOption}
            value={selectedOption || ""}
            className="space-y-4"
          >
            {options.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                <Label
                  htmlFor={`option-${option.id}`}
                  className="text-lg font-medium text-gray-800 dark:text-gray-200 cursor-pointer flex-1"
                >
                  {option.option_text}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <CardFooter className="flex justify-end pt-6 pr-0 pb-0 pl-0">
            <Button
              type="submit"
              disabled={!selectedOption || isPending}
              className="mt-6 w-full sm:w-auto"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Voting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Vote Now
                </div>
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

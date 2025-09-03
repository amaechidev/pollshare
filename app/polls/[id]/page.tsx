import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth"; // Assuming you want auth even for viewing polls
import PollDetails from "@/components/polls/PollDetails"; // We'll create this next
import VoteForm from "@/components/polls/VoteForm"; // We'll create this next
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import PollResultsChart from "@/components/polls/PollResultsChart";

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
}

interface Poll {
  id: string;
  title: string;
  description?: string | null;
  is_active: boolean;
  is_public: boolean;
  vote_count: number;
  creator_id: string;
  expires_at?: string | null;
  created_at: string;
  options: PollOption[]; // Include options in the poll type
}

export default async function PollPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pollId = params.id;
  const unauthorizedError = searchParams.error === "unauthorized";
  const supabase = await createClient();

  try {
    // Optionally require auth to view polls, or fetch user if needed for other features
    // const session = await requireAuth();
    // const userId = session.user.id;

    // Fetch poll details
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(`*, poll_options(id, option_text, option_order, vote_count)`) // Fetch options directly
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      console.error("Error fetching poll:", pollError);
      notFound(); // Show 404 page
    }

    // Ensure options are sorted by option_order
    const sortedOptions = (poll.poll_options || []).sort(
      (a: any, b: any) => a.option_order - b.option_order
    );

    const fullPoll: Poll = {
      ...poll,
      options: sortedOptions,
    };

    const totalVotes = fullPoll.options.reduce(
      (sum, option) => sum + option.vote_count,
      0
    );

    // Determine if the current user has already voted (requires fetching user and votes)
    // For simplicity, we'll check this by attempting to get the user, and if found,
    // checking for their vote. If not found, we assume anonymous, and rely on server-side fingerprint.
    let hasUserVoted = false;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: existingVote, error: checkVoteError } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", pollId)
        .eq("voter_id", userData.user.id)
        .single();
      if (!checkVoteError && existingVote) {
        hasUserVoted = true;
      }
    }

    return (
      <div className="container mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
        {unauthorizedError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unauthorized Access</AlertTitle>
            <AlertDescription>
              You do not have permission to edit this poll.
            </AlertDescription>
          </Alert>
        )}

        <PollDetails poll={fullPoll} />

        {/* Render VoteForm or PollResultsChart based on conditions */}
        {fullPoll.is_active && !hasUserVoted && totalVotes === 0 ? (
          <div className="mt-8">
            <VoteForm pollId={fullPoll.id} options={fullPoll.options} />
          </div>
        ) : (
          <div className="mt-8">
            <PollResultsChart
              options={fullPoll.options}
              totalVotes={totalVotes}
            />
            {/* {fullPoll.is_active && !hasUserVoted && totalVotes > 0 && (
              <div className="mt-8">
                <VoteForm pollId={fullPoll.id} options={fullPoll.options} />
              </div>
            )} */}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("PollPage server error:", error);
    return (
      <div className="container mx-auto max-w-3xl py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred while loading the poll."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}

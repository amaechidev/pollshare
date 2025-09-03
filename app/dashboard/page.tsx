// app/dashboard/page.tsx
import PollList from "@/components/polls/PollList";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Plus, AlertCircle } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
// import { getUserPolls } from "@/lib/polls";

export default async function DashboardPage() {
  try {
    const supabase = await createClient();
    const session = await requireAuth();
    const userId = session.user.id;

    // Fetch user's polls
    const { data: polls, error } = await supabase
      .from("polls")
      .select(`*`)
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching polls:", error);
      throw new Error(`Failed to fetch polls: ${error.message}`);
    }

    // const polls = [
    //   {
    //     id: "1",
    //     title: "Favorite Color",
    //     description: "Choose your favorite color from the options below.",
    //     is_active: true,
    //     is_public: true,
    //     vote_count: 150,
    //     creator_id: userId,
    //     expires_at: "2024-12-31T23:59:59Z",
    //     created_at: "2024-01-15T10:00:00Z",
    //   },
    //   {
    //     id: "2",
    //     title: "Best Programming Language",
    //     description: "Which programming language do you prefer for web development?",
    //     is_active: true,
    //     is_public: false,
    //     vote_count: 230,
    //     creator_id: userId,
    //     expires_at: "2024-11-01T18:00:00Z",
    //     created_at: "2024-02-20T14:30:00Z",
    //   },
    //   {
    //     id: "3",
    //     title: "Dream Travel Destination",
    //     description: "Where would you like to travel next?",
    //     is_active: false,
    //     is_public: true,
    //     vote_count: 90,
    //     creator_id: userId,
    //     expires_at: "2024-10-01T12:00:00Z",
    //     created_at: "2024-03-10T09:00:00Z",
    //   },
    // ];

    return (
      <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              My Polls
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage and track all your polls in one place
            </p>
            {polls.length > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {polls.length} poll{polls.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>
          <Button asChild className="w-fit">
            <Link href="/polls/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Poll
            </Link>
          </Button>
        </div>

        {polls.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No polls yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Get started by creating your first poll
            </p>
            <Button asChild>
              <Link href="/polls/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Poll
              </Link>
            </Button>
          </div>
        ) : (
          <PollList polls={polls} currentUserId={userId} />
        )}
      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);

    return (
      <div className="container mx-auto max-w-5xl py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred. Please try refreshing the page."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}

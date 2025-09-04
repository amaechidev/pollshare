import PollList from "@/components/polls/PollList";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Plus, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toast } from "sonner";
// import { getUserPolls } from "@/lib/polls";

const PAGE_SIZE = 9; // Number of polls per page

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  try {
    const supabase = await createClient();
    const session = await requireAuth();
    const userId = session.user.id;

    const currentPage = Number(searchParams.page) || 1;
    const offset = (currentPage - 1) * PAGE_SIZE;

    // Fetch total count of polls for pagination
    const { count, error: countError } = await supabase
      .from("polls")
      .select("id", { count: "exact" })
      .eq("creator_id", userId);

    if (countError) {
      console.error("Error fetching poll count:", countError);
      throw new Error(`Failed to fetch poll count: ${countError.message}`);
    }

    const totalPolls = count || 0;
    const totalPages = Math.ceil(totalPolls / PAGE_SIZE);

    // Fetch user's polls
    const { data: polls, error } = await supabase
      .from("polls")
      .select(`*`)
      .eq("creator_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1); // Use range for pagination

    if (error) {
      console.error("Error fetching polls:", error);

      toast.error(" Failed to load your polls. Please try again later.");

      throw new Error(`Failed to fetch polls: ${error.message}`);
    }

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
            {totalPolls > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {totalPolls} poll{totalPolls !== 1 ? "s" : ""} found
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

        {totalPolls === 0 ? (
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
          <>
            <PollList polls={polls || []} currentUserId={userId} />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  disabled={currentPage <= 1}
                >
                  <Link href={`/dashboard?page=${currentPage - 1}`}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  disabled={currentPage >= totalPages}
                >
                  <Link href={`/dashboard?page=${currentPage + 1}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </>
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

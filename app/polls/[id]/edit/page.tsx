import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { PollForm } from "@/components/polls/PollForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
}

export default async function EditPollPage({
  params,
}: {
  params: { id: string };
}) {
  const pollId = await params.id;
  const supabase = await createClient();

  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      console.error("Error fetching poll for edit:", pollError);
      notFound(); // Show 404 if poll not found
    }

    // Check if the current user is the creator of the poll
    if (poll.creator_id !== userId) {
      // Redirect to the poll view page if not authorized
      redirect(`/polls/${pollId}?error=unauthorized`);
    }

    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .select("id, option_text, option_order")
      .eq("poll_id", pollId)
      .order("option_order", { ascending: true });

    if (optionsError) {
      console.error("Error fetching poll options for edit:", optionsError);
      notFound(); // Show 404 if options not found or error
    }

    const initialData = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      is_active: poll.is_active,
      is_public: poll.is_public,
      expires_at: poll.expires_at,
      options: options || [],
    };

    return <PollForm initialData={initialData} mode="edit" />;
  } catch (error) {
    console.error("EditPollPage server error:", error);
    // You might want a more sophisticated error page or component here
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
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

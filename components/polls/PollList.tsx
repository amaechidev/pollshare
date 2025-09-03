"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Clock,
  Lock,
  Earth,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { deletePoll } from "@/lib/actions/poll-actions";
import { useRouter } from "next/navigation";

interface Poll {
  id: string;
  title: string;
  description?: string;
  vote_count: number;
  created_at: string;
  is_active: boolean;
  is_public: boolean;
  expires_at?: string;
  creator_id: string; // Add creator_id to the Poll interface
}

interface PollListProps {
  polls: Poll[];
  currentUserId: string;
}

export default function PollList({ polls, currentUserId }: PollListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    if (!pollToDelete) return;

    const result = await deletePoll(pollToDelete);

    if (result.success) {
      toast.success("Poll deleted successfully", {
        description: "The poll has been permanently removed.",
      });
      // No need to revalidatePath here, it's done in the server action
      // If you want an immediate UI update without full page refresh, you might
      // need to manage state locally or use a global state management solution.
      // For now, revalidatePath in the server action is sufficient.
    } else {
      toast.error("Failed to delete poll", {
        description: result.error || "An unknown error occurred.",
      });
    }
    setIsDeleteDialogOpen(false);
    setPollToDelete(null);
  };

  if (polls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg shadow-sm">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg text-gray-600 mb-4">
          You haven&apos;t created any polls yet.
        </p>
        <Link href="/polls/create">
          <Button>Create your first poll</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {polls.map((poll) => (
          <Card
            key={poll.id}
            className="relative h-full flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl dark:bg-gray-800"
          >
            <Link href={`/polls/${poll.id}`} className="block">
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 dark:from-purple-600 dark:via-pink-700 dark:to-red-700" />
              <CardHeader className="px-6 py-4">
                <CardTitle className="mb-2 text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">
                  {poll.title}
                </CardTitle>
                {poll.description && (
                  <p className="text-base text-gray-600 dark:text-gray-300 line-clamp-2">
                    {poll.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-grow px-6 py-4">
                <div className="mb-3 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <BarChart className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">{poll.vote_count} votes</span>
                </div>
                <div className="mb-3 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  {poll.is_public ? (
                    <Earth className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <Lock className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="font-medium">
                    {poll.is_public ? "Public Poll" : "Private Poll"}
                  </span>
                </div>
                {poll.expires_at && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">
                      Expires: {new Date(poll.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Link>
            <CardFooter className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-700">
              <Badge variant={poll.is_active ? "default" : "secondary"}>
                {poll.is_active ? "Active" : "Ended"}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Created: {new Date(poll.created_at).toLocaleDateString()}
              </span>

              {poll.creator_id === currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/polls/${poll.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setPollToDelete(poll.id);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              poll and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Clock, Earth, Lock, CalendarDays } from "lucide-react";

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
}

interface PollDetailsProps {
  poll: {
    id: string;
    title: string;
    description?: string | null;
    is_active: boolean;
    is_public: boolean;
    vote_count: number;
    creator_id: string;
    expires_at?: string | null;
    created_at: string;
    options: PollOption[];
  };
}

export default function PollDetails({ poll }: PollDetailsProps) {
  const totalVotes = poll.options.reduce(
    (sum, option) => sum + option.vote_count,
    0
  );

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-black">
        <CardTitle className="text-3xl font-extrabold mb-2">
          {poll.title}
        </CardTitle>
        {poll.description && (
          <CardDescription className="text-blue-700 text-lg">
            {poll.description}
          </CardDescription>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium text-blue-100">
          <Badge
            variant="secondary"
            className="bg-white/20 text-black hover:bg-white/30"
          >
            <BarChart className="h-4 w-4 mr-1.5" /> {totalVotes} Total Votes
          </Badge>
          <Badge
            variant="secondary"
            className="bg-white/20 text-black hover:bg-white/30"
          >
            {poll.is_public ? (
              <Earth className="h-4 w-4 mr-1.5" />
            ) : (
              <Lock className="h-4 w-4 mr-1.5" />
            )}
            {poll.is_public ? "Public Poll" : "Private Poll"}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-white/20 text-black hover:bg-white/30"
          >
            <Clock className="h-4 w-4 mr-1.5" />
            {poll.is_active ? "Active" : "Inactive"}
          </Badge>
          {poll.expires_at && (
            <Badge
              variant="secondary"
              className="bg-black/20 text-black hover:bg-white/30"
            >
              <CalendarDays className="h-4 w-4 mr-1.5" /> Expires:{" "}
              {new Date(poll.expires_at).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Options:
        </h3>
        {poll.options.length > 0 ? (
          <div className="space-y-3">
            {poll.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700 p-4 shadow-sm"
              >
                <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {option.option_text}
                </span>
                <Badge
                  variant="outline"
                  className="text-blue-600 dark:text-blue-400"
                >
                  {option.vote_count} votes
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No options available for this poll.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

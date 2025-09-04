"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formSchema } from "../schemas/poll-schema";
import z from "zod";
import { headers } from "next/headers";

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
  created_at: string;
}

// Helper function to get user and check authentication
async function checkUserAuthentication(supabase: any) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    // A real error occurred with the Supabase auth system
    return {
      authenticated: false,
      userId: null,
      error: userError.message,
    };
  }

  if (!user) {
    // No user is logged in, but no error from the auth system
    return { authenticated: false, userId: null, error: null };
  }

  return { authenticated: true, userId: user.id, error: null };
}

// Helper function to fetch poll details and check its status
async function fetchAndValidatePoll(supabase: any, pollId: string) {
  const { data: poll, error: fetchPollError } = await supabase
    .from("polls")
    .select("is_active, is_public")
    .eq("id", pollId)
    .single();

  if (fetchPollError || !poll) {
    console.error("Error fetching poll for voting:", fetchPollError);
    return { success: false, error: "Poll not found." };
  }
  if (!poll.is_active) {
    return { success: false, error: "This poll is not active." };
  }
  return { success: true, error: null };
}

// Helper function to check for existing votes
async function checkExistingVote(
  supabase: any,
  pollId: string,
  finalVoterId: string | null,
  finalVoterFingerprint: string
) {
  const { data: existingVote, error: checkVoteError } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .or(
      `voter_id.eq.${finalVoterId},voter_fingerprint.eq.${finalVoterFingerprint}`
    )
    .single();

  if (checkVoteError && checkVoteError.code !== "PGRST116") {
    // PGRST116 means "no rows found"
    console.error("Error checking for existing vote:", checkVoteError);
    return { success: false, error: "Failed to check for existing vote." };
  }
  if (existingVote) {
    return { success: false, error: "You have already voted on this poll." };
  }
  return { success: true, error: null };
}

// Helper function to insert the vote record
async function insertVoteRecord(
  supabase: any,
  pollId: string,
  optionId: string,
  finalVoterId: string | null,
  finalVoterFingerprint: string,
  voterIp: string | null,
  userAgent: string | null
) {
  const { error: insertVoteError } = await supabase.from("votes").insert({
    poll_id: pollId,
    poll_option_id: optionId,
    voter_id: finalVoterId,
    voter_fingerprint: finalVoterFingerprint,
    voter_ip: voterIp,
    user_agent: userAgent,
  });

  if (insertVoteError) {
    console.error("Error inserting vote:", insertVoteError);
    return { success: false, error: insertVoteError.message };
  }
  return { success: true, error: null };
}

// Helper function to increment vote counts
async function incrementVoteCounts(
  supabase: any,
  pollId: string,
  optionId: string
) {
  const { error: incrementOptionError } = await supabase.rpc(
    "increment_option_vote_count",
    { option_id: optionId }
  );
  if (incrementOptionError) {
    console.error(
      "Error incrementing option vote count:",
      incrementOptionError
    );
    return { success: false, error: "Failed to update option vote count." };
  }

  const { error: incrementPollError } = await supabase.rpc(
    "increment_poll_vote_count",
    { p_id: pollId }
  );
  if (incrementPollError) {
    console.error("Error incrementing poll vote count:", incrementPollError);
    return { success: false, error: "Failed to update poll vote count." };
  }
  return { success: true, error: null };
}

export async function deletePoll(pollId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "User not authenticated." };
  }

  // First, verify the user is the creator of the poll
  const { data: poll, error: fetchError } = await supabase
    .from("polls")
    .select("creator_id")
    .eq("id", pollId)
    .single();

  if (fetchError || !poll) {
    console.error("Error fetching poll for deletion:", fetchError);
    return { success: false, error: "Poll not found or unauthorized access." };
  }

  if (poll.creator_id !== user.id) {
    return {
      success: false,
      error: "Unauthorized: You are not the creator of this poll.",
    };
  }

  // If authorized, proceed with deletion
  const { error: deleteError } = await supabase
    .from("polls")
    .delete()
    .eq("id", pollId);

  if (deleteError) {
    console.error("Error deleting poll:", deleteError);
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/dashboard");
  // Optionally redirect to dashboard after deletion, or handle it on the client
  // redirect("/dashboard");
  return { success: true };
}

export async function updatePoll(
  pollId: string,
  values: z.infer<typeof formSchema>
): Promise<{ success: boolean; error?: string; pollId?: string }> {
  const supabase = await createClient();

  // Validate input using zod schema
  const validationResult = formSchema.safeParse(values);

  if (!validationResult.success) {
    return { success: false, error: validationResult.error.message };
  }

  const { title, description, is_active, is_public, expires_at, options } =
    validationResult.data;

  try {
    // Get the current user's ID for authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated." };
    }

    // Verify the user is the creator of the poll
    const { data: existingPoll, error: fetchError } = await supabase
      .from("polls")
      .select("creator_id")
      .eq("id", pollId)
      .single();

    if (fetchError || !existingPoll) {
      return { success: false, error: "Poll not found or unauthorized." };
    }

    if (existingPoll.creator_id !== user.id) {
      return {
        success: false,
        error: "Unauthorized: You are not the creator of this poll.",
      };
    }

    // Update poll data
    const { error: updatePollError } = await supabase
      .from("polls")
      .update({
        title,
        description,
        is_active,
        is_public,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      })
      .eq("id", pollId);

    if (updatePollError) {
      console.error("Error updating poll:", updatePollError);
      return { success: false, error: updatePollError.message };
    }

    // Fetch existing poll options to compare
    const { data: existingOptions, error: fetchOptionsError } = await supabase
      .from("poll_options")
      .select("id, option_text")
      .eq("poll_id", pollId);

    if (fetchOptionsError) {
      console.error("Error fetching existing options:", fetchOptionsError);
      return { success: false, error: fetchOptionsError.message };
    }

    const existingOptionIds = new Set(existingOptions?.map((o) => o.id));
    const newOptionsToInsert: Array<
      Omit<PollOption, "id" | "created_at" | "vote_count">
    > = [];
    const optionsToUpdate: Array<
      Omit<PollOption, "created_at" | "vote_count">
    > = [];

    options.forEach((option: { id?: string; value: string }, index) => {
      // Check if option.id exists and corresponds to an existing option
      const existing = existingOptions?.find((o) => o.id === option.id);

      if (existing && option.id) {
        // Update existing option
        optionsToUpdate.push({
          id: option.id,
          poll_id: pollId,
          option_text: option.value,
          option_order: index,
        });
        existingOptionIds.delete(option.id); // Mark as processed
      } else {
        // Insert new option
        newOptionsToInsert.push({
          poll_id: pollId,
          option_text: option.value,
          option_order: index,
        });
      }
    });

    // Delete options that are no longer present
    if (existingOptionIds.size > 0) {
      const { error: deleteOptionsError } = await supabase
        .from("poll_options")
        .delete()
        .in("id", Array.from(existingOptionIds));

      if (deleteOptionsError) {
        console.error("Error deleting old poll options:", deleteOptionsError);
        return { success: false, error: deleteOptionsError.message };
      }
    }

    // Insert new options
    if (newOptionsToInsert.length > 0) {
      const { error: insertOptionsError } = await supabase
        .from("poll_options")
        .insert(newOptionsToInsert);

      if (insertOptionsError) {
        console.error("Error inserting new poll options:", insertOptionsError);
        return { success: false, error: insertOptionsError.message };
      }
    }

    // Update existing options
    for (const option of optionsToUpdate) {
      const { error: updateOptionError } = await supabase
        .from("poll_options")
        .update({
          option_text: option.option_text,
          option_order: option.option_order,
        })
        .eq("id", option.id);

      if (updateOptionError) {
        console.error("Error updating poll option:", updateOptionError);
        return { success: false, error: updateOptionError.message };
      }
    }

    revalidatePath("/dashboard"); // Revalidate dashboard
    revalidatePath(`/polls/${pollId}`); // Revalidate individual poll page

    return { success: true, pollId };
  } catch (error) {
    console.error("Unexpected error in updatePoll:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function voteOnPoll(
  pollId: string,
  optionId: string,
  voterFingerprint: string | null = null // Add optional voterFingerprint parameter
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const headersList = await headers();
    const voterIp =
      headersList.get("x-forwarded-for") ||
      headersList.get("cf-connecting-ip") ||
      headersList.get("x-real-ip") ||
      null;
    const userAgent = headersList.get("user-agent") || null;

    const {
      authenticated,
      userId,
      error: authCheckError,
    } = await checkUserAuthentication(supabase);
    if (authCheckError) return { success: false, error: authCheckError };

    let finalVoterId: string | null = null;
    let finalVoterFingerprint: string | null = null;

    if (authenticated && userId) {
      finalVoterId = userId;
      finalVoterFingerprint = userId; // Use user ID as fingerprint for authenticated users
    } else if (voterFingerprint) {
      finalVoterFingerprint = voterFingerprint; // Use client-provided fingerprint for anonymous
    } else {
      return {
        success: false,
        error: "Missing voter identifier for anonymous vote.",
      };
    }

    // 2. Fetch and validate poll details
    const { success: pollValid, error: pollError } = await fetchAndValidatePoll(
      supabase,
      pollId
    );
    if (!pollValid) return { success: false, error: pollError ?? undefined };

    // 3. Check for duplicate votes
    const { success: notDuplicate, error: duplicateError } =
      await checkExistingVote(
        supabase,
        pollId,
        finalVoterId,
        finalVoterFingerprint!
      );
    if (!notDuplicate)
      return { success: false, error: duplicateError ?? undefined };

    // 4. Insert the vote record
    const { success: voteInserted, error: insertError } =
      await insertVoteRecord(
        supabase,
        pollId,
        optionId,
        finalVoterId,
        finalVoterFingerprint!,
        voterIp,
        userAgent
      );
    if (!voteInserted) return { success: false, error: insertError };

    // 5. Increment vote counts
    const { success: countsIncremented, error: incrementError } =
      await incrementVoteCounts(supabase, pollId, optionId);
    if (!countsIncremented)
      return { success: false, error: incrementError ?? undefined };

    revalidatePath(`/polls/${pollId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in voteOnPoll:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

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
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Fetch poll to ensure it's active and public (if not already handled by RLS on insert)
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

    let finalVoterId: string | null = null;
    let finalVoterFingerprint: string | null = null;

    if (user) {
      finalVoterId = user.id;
      finalVoterFingerprint = user.id; // Use user ID as fingerprint for authenticated users
    } else if (voterFingerprint) {
      finalVoterFingerprint = voterFingerprint; // Use client-provided fingerprint for anonymous
    } else {
      return {
        success: false,
        error: "Missing voter identifier for anonymous vote.",
      };
    }

    // Check for duplicate votes (based on voter_id or fingerprint + poll_id)
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

    // Insert the vote record
    const { error: insertVoteError } = await supabase.from("votes").insert({
      poll_id: pollId,
      poll_option_id: optionId,
      voter_id: finalVoterId, // Will be user.id or null
      voter_fingerprint: finalVoterFingerprint, // Will be user.id or client-generated
      voter_ip: voterIp, // Include voter IP
      user_agent: userAgent, // Include User Agent
    });

    if (insertVoteError) {
      console.error("Error inserting vote:", insertVoteError);
      return { success: false, error: insertVoteError.message };
    }

    // Increment vote counts using the SQL functions
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
      { p_id: pollId } // Use p_id as defined in SQL function
    );
    if (incrementPollError) {
      console.error("Error incrementing poll vote count:", incrementPollError);
      return { success: false, error: "Failed to update poll vote count." };
    }

    revalidatePath(`/polls/${pollId}`); // Revalidate the poll page to show updated counts
    revalidatePath("/dashboard"); // Also revalidate dashboard if vote counts are shown there

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in voteOnPoll:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

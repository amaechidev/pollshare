"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formSchema } from "@/lib/schemas/poll-schema";

export async function createPoll(
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
    // Get the current user's ID
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: userError?.message || "User not authenticated.",
      };
    }

    // Insert poll data
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        title,
        description,
        is_active,
        is_public,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null, // Convert to ISO string for Supabase
        creator_id: user.id, // Set the creator_id
      })
      .select("id")
      .single();

    if (pollError || !poll) {
      console.error("Error creating poll:", pollError);
      return {
        success: false,
        error: pollError?.message || "Failed to create poll.",
      };
    }

    const pollId = poll.id;

    // Prepare poll options for insertion
    const pollOptions = options.map((option, index) => ({
      poll_id: pollId,
      option_text: option.value,
      option_order: index,
    }));

    // Insert poll options
    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(pollOptions);

    if (optionsError) {
      console.error("Error creating poll options:", optionsError);
      // Consider rolling back the poll creation if options fail
      await supabase.from("polls").delete().eq("id", pollId);
      return {
        success: false,
        error: optionsError.message || "Failed to create poll options.",
      };
    }

    revalidatePath("/dashboard"); // Revalidate dashboard to show new poll
    return { success: true, pollId };
  } catch (error) {
    console.error("Unexpected error in createPoll:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

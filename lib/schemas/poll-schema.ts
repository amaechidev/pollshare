import { z } from "zod";

export const formSchema = z.object({
  title: z
    .string()
    .min(2, {
      message: "Title must be at least 2 characters.",
    })
    .max(100, "Title must be less than 100 characters."),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters.")
    .optional(),
  is_active: z.boolean(),
  is_public: z.boolean(),
  expires_at: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z
          .string()
          .min(1, "Option cannot be empty.")
          .max(200, "Option too long."),
      })
    )
    .min(2, "Please add at least two options.")
    .max(10, "You can add a maximum of 10 options."),
});

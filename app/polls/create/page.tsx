"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useState } from "react";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  PlusCircle,
  Trash2,
  ArrowLeft,
  Sparkles,
  Clock,
  Globe,
  Lock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const formSchema = z.object({
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
  is_active: z.boolean().default(true),
  is_public: z.boolean().default(true),
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

function CreatePollForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      is_active: true,
      is_public: true,
      expires_at: "",
      options: [{ value: "" }, { value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      console.log(values);
      // TODO: Implement server action for poll creation
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating poll:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const canAddMore = fields.length < 10;
  const canRemove = fields.length > 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="container mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create Poll
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Share your question with the world
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Poll Title */}
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium text-gray-900 dark:text-white">
                      What's your question?
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ask something interesting..."
                        className="text-lg border-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500 dark:text-gray-400">
                      Make it clear and engaging
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Poll Description */}
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900 dark:text-white">
                      Add context (optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide additional details or context..."
                        className="border-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-4 resize-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Poll Options */}
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
              <div className="mb-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                  Poll Options
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add 2-10 options for people to choose from
                </p>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <FormField
                    control={form.control}
                    key={field.id}
                    name={`options.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                            {index + 1}
                          </div>
                          <FormControl className="flex-1">
                            <Input
                              placeholder={`Option ${index + 1}`}
                              className="border-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 transition-all"
                              {...field}
                            />
                          </FormControl>
                          {canRemove && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="flex-shrink-0 rounded-full p-2 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                {canAddMore && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => append({ value: "" })}
                    className="w-full mt-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group"
                  >
                    <PlusCircle className="mr-2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Add another option
                    </span>
                  </Button>
                )}
              </div>
            </div>

            {/* Poll Settings */}
            <div className="bg-white dark:bg-gray-900/50 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                Settings
              </h3>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        {field.value ? (
                          <Globe className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Lock className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <FormLabel className="text-base font-medium text-gray-900 dark:text-white">
                            {field.value ? "Public Poll" : "Private Poll"}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {field.value
                              ? "Anyone can find and vote on this poll"
                              : "Only people with the link can vote"}
                          </FormDescription>
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-blue-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        {field.value ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <FormLabel className="text-base font-medium text-gray-900 dark:text-white">
                            {field.value ? "Active Now" : "Start Later"}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {field.value
                              ? "Poll will be live immediately"
                              : "You can activate it later"}
                          </FormDescription>
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 text-lg font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Poll...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Create Poll
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default function CreatePollPage() {
  return <CreatePollForm />;
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useUser } from "@/lib/contexts/userContext";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define the form schema with Zod
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { forgotPassword } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsSubmitting(true);
      const { error } = await forgotPassword(values.email);

      if (error) {
        toast.error(error);
        return;
      }

      // Success is already handled by the toast in the forgotPassword function
      form.reset();
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-[#000A1F]">
      <div className="flex w-full flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-start">
            <Image
              src="/assets/global/app-logo-white.svg"
              alt="Logo"
              width={20}
              height={30}
              className="h-16 w-auto"
            />
          </div>

          <h1 className="text-3xl font-bold text-yadn-primary-gray">
            Reset Password
          </h1>
          <p className="text-yadn-primary-gray/70">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          {/* Reset Password Form */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Email"
                        disabled={isSubmitting}
                        className="bg-yadn-primary-gray/5 border-yadn-primary-gray/10 text-yadn-primary-gray placeholder:text-yadn-primary-gray/40 focus:border-yadn-accent-green focus:ring-yadn-accent-green"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-yadn-background font-medium py-6"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-yadn-accent-green hover:underline text-sm"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

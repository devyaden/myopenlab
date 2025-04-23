"use client";

import { InputWithIcon } from "@/components/input-with-icon";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/contexts/userContext";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { forgotPassword } = useUser();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    await forgotPassword(data.email);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Image
            src="/assets/global/app-logo.png"
            alt="Logo"
            width={64}
            height={64}
            className="mb-6"
          />
          <h1 className="text-2xl font-semibold text-center">
            Forgot Password?
          </h1>
          <p className="text-muted-foreground text-center mt-2">
            Enter your email to receive a password reset link
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <InputWithIcon
              id="email"
              type="email"
              label="Email"
              placeholder="Enter your email"
              error={errors?.email?.message}
              {...register("email")}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Checking Email..." : "Send Reset Link"}
          </Button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/contexts/userContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { InputWithIcon } from "../input-with-icon";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn, signInWithGoogle } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      toast.success("Successfully logged in!");
    } catch (error: any) {
      toast.error(error.message ?? "Something went wrong!");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message ?? "Failed to sign in with Google");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <InputWithIcon
          {...register("email")}
          label="Email"
          type="email"
          placeholder="Enter your email"
          error={errors?.email?.message}
        />
      </div>

      <div className="space-y-1">
        <div className="relative">
          <InputWithIcon
            {...register("password")}
            type="password"
            label="Password"
            placeholder="Enter password"
            showPasswordToggle
            error={errors?.password?.message}
          />
        </div>
        <div className="flex justify-end w-full">
          <a
            href="/forgot-password"
            className="text-sm text-gray-600 hover:text-yadn-accent-green"
          >
            Forgot Password?
          </a>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Logging in..." : "Login To Dashboard"}
      </Button>

      <div className="text-center text-sm text-gray-500 my-4">
        Or Login With Your Email
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 border-gray-200 hover:bg-gray-50"
        onClick={handleGoogleSignIn}
      >
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Google</title>
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
        Login with Google
      </Button>
    </form>
  );
}

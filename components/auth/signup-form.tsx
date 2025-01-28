"use client";

import { Button } from "@/components/ui/button";
import useSignupFormStore from "@/lib/store/useSignupFormStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";
import { InputWithIcon } from "../input-with-icon";
import { useUser } from "@/lib/contexts/userContext";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const { updateFormData } = useSignupFormStore();
  const { checkIfEmailExists } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      const emailExists = await checkIfEmailExists(data.email);

      if (emailExists) {
        toast.error("Email already exists. Please login instead.");
        return;
      }

      updateFormData("personalInfo", {
        email: data.email,
      });
      router.push("/auth/onboarding/company");

      toast.success("Completed Onboarding Step 1 of 3");
      console.log(data);
    } catch (error) {
      toast.error("Something went wrong!");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <InputWithIcon
          {...register("email")}
          type="email"
          label="Work Email Address"
          placeholder="Enter your email"
          error={errors?.email?.message}
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-yadn-pink hover:bg-yadn-pink/90 text-white font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Checking Email..." : "Start Your Journey"}
      </Button>

      <div className="text-center text-sm text-gray-500 my-4">
        Or Login With Your Email
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 border-gray-200 hover:bg-gray-50"
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

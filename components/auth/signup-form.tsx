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
        role: "user",
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
        className="w-full h-12 bg-yadn-accent-green hover:bg-yadn-accent-green/90 text-white font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Checking Email..." : "Start Your Journey"}
      </Button>
    </form>
  );
}

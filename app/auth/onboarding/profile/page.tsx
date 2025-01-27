"use client";

import { User, Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { InputWithIcon } from "@/components/input-with-icon";
import { Button } from "@/components/ui/button";
import { signupSchema, type SignupFormData } from "@/lib/schemas/signup.schema";
import { useRouter } from "next/navigation";
import useSignupFormStore from "@/lib/store/useSignupFormStore";
import { useEffect } from "react";

export default function SignupForm() {
  const router = useRouter();
  const { formData, updateFormData } = useSignupFormStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormData) => {
    toast.success("Account created successfully!");
    updateFormData("personalInfo", {
      username: data.username,
      email: data.email,
    });
    console.log(data);
  };

  useEffect(() => {
    if (formData.personalInfo) {
      setValue("email", formData.personalInfo.email);
    }
  }, [formData.personalInfo]);

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="flex justify-center mb-6">
        <img src="/assets/global/app-logo.png" alt="" className="h-12 w-auto" />
      </div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold mb-1">
          <span className="text-yadn-pink">Hang tight!</span> Your setup is
          almost finished.
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputWithIcon
          label="Username"
          icon={<User className="h-5 w-5 text-gray-400" />}
          {...register("username")}
          error={errors.username?.message}
          placeholder="Create Username"
          className="border-gray-200 placeholder:text-gray-400"
        />

        <InputWithIcon
          label="Email Address"
          icon={<Mail className="h-5 w-5 text-gray-400" />}
          {...register("email")}
          error={errors.email?.message}
          placeholder="John.Doe@gmail.com"
          type="email"
          className="border-gray-200 placeholder:text-gray-400"
        />

        <InputWithIcon
          label="Password"
          icon={<Lock className="h-5 w-5 text-gray-400" />}
          {...register("password")}
          error={errors.password?.message}
          placeholder="Enter password"
          type="password"
          showPasswordToggle
          className="border-gray-200 placeholder:text-gray-400"
        />

        <InputWithIcon
          label="Confirm Password"
          icon={<Lock className="h-5 w-5 text-gray-400" />}
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
          placeholder="Re-Enter password"
          type="password"
          showPasswordToggle
          className="border-gray-200 placeholder:text-gray-400"
        />

        <Button
          type="submit"
          className="w-full bg-yadn-pink hover:bg-yadn-pink-dark text-white font-medium"
        >
          Continue
        </Button>
      </form>
    </div>
  );
}

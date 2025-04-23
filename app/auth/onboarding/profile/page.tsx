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
import { useUser } from "@/lib/contexts/userContext";
import Image from "next/image";

export default function SignupForm() {
  const { formData, clearFormData } = useSignupFormStore();
  const router = useRouter();

  const { signUp } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    const { error } = await signUp(
      {
        personalInfo: data,
        companyInfo: formData.companyInfo,
      },
      data.password
    );

    if (!error) {
      clearFormData();
      router.push("/authentication");
    }
  };

  useEffect(() => {
    if (formData.personalInfo) {
      setValue("email", formData?.personalInfo?.email || "");
    }
  }, [formData.personalInfo]);

  useEffect(() => {
    toast("🌟 Step 3 of 3: Personal Information", {
      duration: Infinity,
      position: "bottom-center",
      icon: "👤",
    });

    return () => {
      toast.dismiss();
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-center min-h-screen p-4">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-center">
          <Image
            src="/assets/global/app-logo.png"
            alt="Logo"
            width={60}
            height={60}
          />
        </div>
        <div className="text-center mb-3 mt-3">
          <h1 className="text-xl font-semibold">
            <span className="text-yadn-accent-green">Hang tight!</span> Your
            setup is almost finished.
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <InputWithIcon
            label="Name"
            icon={<User className="h-4 w-4 text-gray-400" />}
            {...register("name")}
            error={errors.name?.message}
            placeholder="Enter your name"
            className="border-gray-200 placeholder:text-gray-400"
          />

          <InputWithIcon
            label="Username"
            icon={<User className="h-4 w-4 text-gray-400" />}
            {...register("username")}
            error={errors.username?.message}
            placeholder="Create Username"
            className="border-gray-200 placeholder:text-gray-400"
          />

          {/* <InputWithIcon
            label="Email Address"
            icon={<Mail className="h-4 w-4 text-gray-400" />}
            {...register("email")}
            error={errors.email?.message}
            placeholder="John.Doe@gmail.com"
            type="email"
            className="border-gray-200 placeholder:text-gray-400"
          /> */}

          <InputWithIcon
            label="Password"
            icon={<Lock className="h-4 w-4 text-gray-400" />}
            {...register("password")}
            error={errors.password?.message}
            placeholder="Enter password"
            type="password"
            showPasswordToggle
            className="border-gray-200 placeholder:text-gray-400"
          />

          <InputWithIcon
            label="Confirm Password"
            icon={<Lock className="h-4 w-4 text-gray-400" />}
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            placeholder="Re-Enter password"
            type="password"
            showPasswordToggle
            className="border-gray-200 placeholder:text-gray-400"
          />

          <Button
            type="submit"
            className="w-full bg-yadn-accent-green hover:bg-yadn-accent-green-dark text-white font-medium mt-3"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}

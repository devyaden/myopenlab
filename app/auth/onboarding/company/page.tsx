"use client";

import { InputWithIcon } from "@/components/input-with-icon";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  companyFormSchema,
  companySizes,
  positions,
  sectors,
  type CompanyFormData,
} from "@/lib/schemas/company-form.schema";
import useSignupFormStore from "@/lib/store/useSignupFormStore";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function CompanyForm() {
  const router = useRouter();
  const { updateFormData } = useSignupFormStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
  });

  const onSubmit = (data: CompanyFormData) => {
    updateFormData("companyInfo", {
      companyName: data.companyName,
      companyEmail: data.companyEmail,
      companySector: data.companySector,
      companySize: data.companySize,
      userPosition: data.position,
    });

    toast.success("Form submitted successfully!");
    router.push("/auth/onboarding/profile");
  };

  useEffect(() => {
    toast("🚀 Step 2 of 3: Company Details", {
      duration: Infinity,
      position: "bottom-center",
      icon: "💼",
    });

    return () => {
      toast.dismiss();
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-center min-h-screen p-4 ">
      <div className="flex flex-col space-y-3">
        <div className="flex justify-center">
          <Image
            src="/assets/global/app-logo.png"
            alt="Logo"
            width={48}
            height={48}
          />
        </div>
        <h1 className="text-xl font-semibold text-center">More About You</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputWithIcon
            label="Company Name"
            {...register("companyName")}
            error={errors.companyName?.message}
            placeholder="Enter your Company Name"
            className="border-gray-200 placeholder:text-gray-400"
          />

          <InputWithIcon
            label="Company Email"
            {...register("companyEmail")}
            error={errors.companyEmail?.message}
            placeholder="Enter Company Email Address"
            type="email"
            className="border-gray-200 placeholder:text-gray-400"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Company Sector
            </label>
            <Select
              onValueChange={(value) => setValue("companySector", value as any)}
            >
              <SelectTrigger
                className={cn(
                  "border-gray-200 bg-white text-gray-900 focus-visible:ring-offset-0 focus-visible:ring-0",
                  errors.companySector ? "border-red-500" : ""
                )}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companySector && (
              <p className="text-red-500 text-xs">
                {errors.companySector.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Your Position in Company
            </label>
            <div className="flex flex-wrap gap-1">
              {positions.map((position) => (
                <Button
                  key={position}
                  type="button"
                  variant={
                    watch("position") === position ? "default" : "outline"
                  }
                  onClick={() => setValue("position", position)}
                  className={cn(
                    "rounded-full px-3 py-0 h-7 text-xs",
                    watch("position") === position
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {position}
                </Button>
              ))}
            </div>
            {errors.position && (
              <p className="text-red-500 text-xs">{errors.position.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Company Size
            </label>
            <Select
              onValueChange={(value) => setValue("companySize", value as any)}
            >
              <SelectTrigger
                className={cn(
                  "border-gray-200 bg-white text-gray-900",
                  errors.companySize ? "border-red-500" : ""
                )}
              >
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {companySizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size} employees
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companySize && (
              <p className="text-red-500 text-xs">
                {errors.companySize.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-yadn-pink hover:bg-yadn-pink-dark text-white font-medium mt-4"
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}

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
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function CompanyForm() {
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
    toast.success("Form submitted successfully!");
    console.log(data);
  };

  return (
    <div className="w-full max-w-[460px] mx-auto my-auto p-6">
      <div className="flex justify-center mb-6">
        <img src="/assets/global/app-logo.png" alt="" className="h-12 w-auto" />
      </div>
      <h1 className="text-2xl font-semibold text-center mb-8">
        More About You
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Company Sector
          </label>
          <Select
            onValueChange={(value) => setValue("companySector", value as any)}
          >
            <SelectTrigger
              className={cn(
                "border-gray-200 bg-white text-gray-900",
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
            <p className="text-red-500 text-sm">
              {errors.companySector.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Your Position in Company
          </label>
          <div className="flex flex-wrap gap-2">
            {positions.map((position) => (
              <Button
                key={position}
                type="button"
                variant={watch("position") === position ? "default" : "outline"}
                onClick={() => setValue("position", position)}
                className={cn(
                  "rounded-full px-4 h-8 text-sm",
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
            <p className="text-red-500 text-sm">{errors.position.message}</p>
          )}
        </div>

        <div className="space-y-2">
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
            <p className="text-red-500 text-sm">{errors.companySize.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#E31B54] hover:bg-[#C71548] text-white font-medium"
        >
          Continue
        </Button>
      </form>
    </div>
  );
}

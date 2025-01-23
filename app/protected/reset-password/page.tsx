"use client";

import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/contexts/userContext";
import { LockIcon } from "lucide-react";
import Image from "next/image";

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Message;
}) {
  const { resetPassword } = useUser();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 w-screen">
      <div className="flex flex-col items-center w-full">
        <div className="mb-8 flex items-center justify-between w-full max-w-sm">
          <h1 className="text-3xl font-bold">إعادة تعيين كلمة المرور</h1>
          <Image
            src="/your-logo.png"
            alt="Company Logo"
            width={50}
            height={50}
            className="mr-4"
          />
        </div>

        <form className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
          <p className="text-sm text-gray-700 mb-4">
            يرجى إدخال كلمة المرور الجديدة أدناه.
          </p>

          <div className="mb-4 relative">
            <Label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              كلمة المرور الجديدة
            </Label>
            <Input
              type="password"
              name="password"
              placeholder="كلمة المرور الجديدة"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pl-10"
              required
            />
            <LockIcon className="w-5 h-5 absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="mb-6 relative">
            <Label
              htmlFor="confirmPassword"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              تأكيد كلمة المرور
            </Label>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="تأكيد كلمة المرور"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pl-10"
              required
            />
            <LockIcon className="w-5 h-5 absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400" />
          </div>

          <SubmitButton
            className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            formAction={(formData) => {
              const password = formData.get("password") as string;
              const confirmPassword = formData.get("confirmPassword") as string;
              resetPassword(password, confirmPassword);
            }}
          >
            إعادة تعيين كلمة المرور
          </SubmitButton>
          <FormMessage message={searchParams} />
        </form>
      </div>
    </div>
  );
}

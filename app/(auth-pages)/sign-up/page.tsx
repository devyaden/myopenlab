import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import AuthHeader from "@/components/header-auth";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { LockIcon, MailIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Signup({ searchParams }: { searchParams: Message }) {
  if ("message" in searchParams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 w-screen">
        <div className="flex flex-col items-center w-full">
          <div className="mb-8 flex items-center justify-between w-full max-w-sm">
            <h1 className="text-3xl font-bold">إنشاء حساب</h1>
            <Image
              src="/logo.png"
              alt="Company Logo"
              width={50}
              height={50}
              className="ml-4"
            />
          </div>
          <FormMessage message={searchParams} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 w-screen">
      <div className="flex flex-col items-center w-full justify-center">
        <AuthHeader title="إنشاء حساب جديد" subTitle="المعلومات الشخصية" />
        <form className=" bg-light_background p-8 rounded-lg shadow-lg w-full max-w-sm">
          <div className="mb-4 relative">
            <Input
              name="email"
              placeholder="البريد الإلكتروني"
              required
              icon={<MailIcon className="w-5 h-5 text-white" />}
            />
          </div>

          <div className="relative">
            <Input
              type="password"
              name="password"
              placeholder="كلمة المرور الخاصة بك"
              minLength={6}
              required
              icon={<LockIcon className="w-5 h-5 text-white " />}
            />
          </div>
          <Link
            className="inline-block align-baseline text-sm  hover:text-blue-800 underline mt-2"
            href="/sign-in"
          >
            هل لديك حساب بالفعل؟{" "}
          </Link>

          <SubmitButton
            className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mt-20"
            formAction={signUpAction}
            pendingText="جاري التسجيل..."
          >
            إنشاء حساب
          </SubmitButton>
          <FormMessage message={searchParams} />
        </form>
      </div>
    </div>
  );
}

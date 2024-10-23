import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { MailIcon } from "lucide-react";
import AuthHeader from "@/components/header-auth";

export default function ForgotPassword({
  searchParams,
}: {
  searchParams: Message;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 w-screen">
      <div className="flex flex-col items-center w-full">
        <AuthHeader title="نسيت كلمة المرور" />

        <form className="bg-light_background p-8 rounded-lg shadow-lg w-full max-w-sm">
          <p className=" text-gray-700 mb-8 font-semibold">
            يرجى إدخال عنوان البريد الإلكتروني الخاص بك أدناه. سنرسل لك رابطًا
            لإعادة تعيين كلمة المرور.
          </p>
          <div className="flex flex-col [&>input]:mb-3">
            <div className="mb-4 relative">
              <Input
                name="email"
                placeholder="البريد الإلكتروني"
                required
                icon={<MailIcon className="w-5 h-5 text-white" />}
              />
            </div>

            <div className="px-12 mt-12">
              <SubmitButton
                className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4  w-full mb-4"
                formAction={forgotPasswordAction}
              >
                إعادة تعيين كلمة المرور
              </SubmitButton>
            </div>
            <FormMessage message={searchParams} />
          </div>
        </form>
      </div>
    </div>
  );
}

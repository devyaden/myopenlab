import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import AuthHeader from "@/components/header-auth";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockIcon, MailIcon } from "lucide-react";
import Link from "next/link";

export default function Login({ searchParams }: { searchParams: Message }) {
  return (
    <div className="min-h-screen flex items-center justify-center w-screen">
      <div className="flex flex-col items-center w-full">
        <AuthHeader title="تسجيل الدخول" />

        <form className=" bg-light_background p-8 rounded-lg shadow-lg w-full max-w-sm">
          <div className="mb-4 relative">
            <Input
              name="email"
              type="email"
              placeholder="البريد الإلكتروني"
              required
              icon={<MailIcon className=" text-white h-5 w-5" />}
            />
          </div>

          <div className="mb-6 relative">
            <Input
              type="password"
              name="password"
              // className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline pl-10"
              placeholder="كلمة المرور"
              required
              icon={<LockIcon className="text-white h-5 w-5" />}
            />

            <Link
              className="inline-block align-baseline text-sm  hover:text-blue-800 underline mt-2"
              href="/forgot-password"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          <div className="px-12">
            <SubmitButton
              className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-4  focus:outline-none focus:shadow-outline w-full mb-2"
              pendingText="تسجيل الدخول..."
              formAction={signInAction}
            >
              تسجيل الدخول
            </SubmitButton>

            <Button className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 focus:outline-none focus:shadow-outline w-full mb-2">
              <div className="h-4 w-4 ml-2">
                <svg role="img" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  />
                </svg>
              </div>
              تسجيل الدخول عبر جوجل
            </Button>

            <Button className="bg-dark_background  text-white font-bold py-3 px-4 focus:outline-none focus:shadow-outline w-full mb-2 border border-white">
              <Link href="/sign-up" className="text-center font-medium block">
                إنشاء حساب جديد
              </Link>
            </Button>
          </div>
          <FormMessage message={searchParams} />
        </form>
      </div>
    </div>
  );
}

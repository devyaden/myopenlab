import SignupForm from "@/components/auth/signup-form-v2";
import Image from "next/image";

export default function SignUp() {
  return (
    <main className="flex min-h-screen bg-[#000A1F]">
      {/* Left side - Sign Up Form */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-3xl font-bold text-yadn-primary-gray">
            Create Account
          </h1>

          <SignupForm />
        </div>
      </div>

      {/* Logo */}
      <div className="absolute top-10 right-10 justify-center">
        <Image
          src="/assets/global/app-logo-white.svg"
          alt="Logo"
          width={60}
          height={60}
          className="h-10 w-auto"
        />
      </div>
    </main>
  );
}

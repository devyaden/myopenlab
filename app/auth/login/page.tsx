import SignInForm from "@/components/auth/sign-in-form";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen bg-[#000A1F]">
      {/* Left side - Sign In Form */}
      <div className="flex w-full md:w-1/2 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-3xl font-bold text-yadn-primary-gray">Sign In</h1>

          <SignInForm />
        </div>
      </div>

      {/* Right side - Decorative elements and tagline */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-opacity-20 bg-yadn-accent-green blur-xl"></div>
        <div className="absolute bottom-20 right-40 w-48 h-48 rounded-full bg-opacity-20 bg-yadn-primatext-yadn-primary-gray blur-xl"></div>
        <div className="absolute top-1/2 left-20 w-72 h-72 rounded-full bg-opacity-10 bg-yadn-accent-green blur-xl"></div>

        {/* Tagline */}
        <div className="relative z-10 max-w-md px-8">
          <h2 className="text-5xl font-bold text-yadn-primary-gray leading-tight text-center">
            Map your ideas to life
          </h2>
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
      </div>
    </main>
  );
}

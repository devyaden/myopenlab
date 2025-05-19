"use client";

import CompleteProfileForm from "@/components/auth/complete-profile-form";

export default function CompleteProfilePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen  py-12 px-4 sm:px-6 lg:px-8 bg-[#000A1F]">
      <div className="w-full max-w-md">
        <CompleteProfileForm />
      </div>
    </div>
  );
}

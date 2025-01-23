import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex">
      <div className="fixed inset-0 z-0">
        <Image
          src="https://irtkurtmlknxxmcfytln.supabase.co/storage/v1/object/public/yadn-diagrams/auth-background.svg"
          alt="Authentication Background"
          fill
          style={{
            objectFit: "contain",
            objectPosition: "left center",
          }}
          quality={100}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex w-full">
        {/* Left Side (Optional) - Can be empty or used for decorative content */}
        <div className="hidden lg:block lg:flex-1 bg-transparent"></div>

        {/* Right Side - Authentication Content */}
        <div className=" max-w-md">{children}</div>
      </div>
    </div>
  );
}

import SignInForm from "@/components/auth/sign-in-form";
import Image from "next/image";
import Link from "next/link";
import { AtlasAuthAside } from "@/components/auth/atlas-auth-aside";

export default function Home() {
  return (
    <main className="flex min-h-screen bg-background text-foreground">
      {/* Left — the form. One obvious task: sign in. */}
      <div className="flex w-full flex-col px-6 py-10 md:w-1/2 lg:px-16">
        <Link href="/" className="inline-flex items-center" aria-label="Olab home">
          <Image
            src="/assets/global/app-logo.svg"
            alt="Olab"
            width={92}
            height={28}
            className="h-7 w-auto dark:hidden"
            priority
          />
          <Image
            src="/assets/global/app-logo-white.svg"
            alt="Olab"
            width={92}
            height={28}
            className="hidden h-7 w-auto dark:block"
            priority
          />
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your operating model.
              </p>
            </div>
            <SignInForm />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground md:text-start">
          © Olab — the living playbook for your team.
        </p>
      </div>

      {/* Right — the Atlas signature: a living map of the operating model. */}
      <AtlasAuthAside />
    </main>
  );
}

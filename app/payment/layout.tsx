import { ReactNode } from "react";

// Force dynamic rendering for all payment routes
export const dynamic = 'force-dynamic';

export default function PaymentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

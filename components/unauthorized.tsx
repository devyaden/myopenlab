import React from "react";
import { Button } from "@/components/ui/button";
import { LockIcon, ShieldAlertIcon } from "lucide-react";
import Link from "next/link";

export function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <ShieldAlertIcon className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>

        <p className="text-gray-600 mb-6">
          You don't have permission to view this canvas. The owner may have set
          it to private or you might need to be added as a collaborator.
        </p>

        <div className="flex justify-center gap-4">
          <Link href="/protected" passHref>
            <Button variant="default">Go to Dashboard</Button>
          </Link>

          <Link href="/" passHref>
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

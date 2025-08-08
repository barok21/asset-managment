"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log to your monitoring here
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              A client-side error occurred. You can try again.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => reset()}>Try again</Button>
              <Button
                variant="outline"
                onClick={() =>
                  typeof window !== "undefined"
                    ? window.location.reload()
                    : undefined
                }
              >
                Reload
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

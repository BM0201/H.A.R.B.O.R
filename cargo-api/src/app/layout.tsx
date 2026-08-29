import type { ReactNode } from "react";
import type { Metadata } from "next";

/**
 * Minimal root layout for the API-only backend project.
 * The backend never renders real UI — this layout exists only because
 * Next.js requires it. All routes under `/api/*` and `/health` return JSON.
 */
export const metadata: Metadata = {
  title: "HARBOR API",
  description: "Backend API for HARBOR — BM CARGO courier system",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

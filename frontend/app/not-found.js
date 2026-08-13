"use client";

import Link from "next/link";
import { Boxes, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6 text-center select-none">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
        <Boxes className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground">404 — Page Not Found</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        The inventory workspace route you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button asChild variant="default" size="sm" className="font-semibold">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}

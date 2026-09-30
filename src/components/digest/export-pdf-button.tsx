"use client";

import { Button } from "@/components/ui/button";

export function ExportPdfButton({ label = "PDF" }: { label?: string }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      type="button"
      onClick={() => {
        window.print();
      }}
    >
      {label}
    </Button>
  );
}

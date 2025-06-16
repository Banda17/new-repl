import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SelectDetention } from "@db/schema";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>
    </div>
  );
}
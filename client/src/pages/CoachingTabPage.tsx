import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PunctualityPage from "./PunctualityPage";

export default function CoachingTabPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6">
        <Tabs defaultValue="punctuality" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <TabsList className="grid w-full grid-cols-1 max-w-md">
              <TabsTrigger value="punctuality" className="text-sm font-medium">
                Punctuality Analysis
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="punctuality" className="space-y-0">
            <PunctualityPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
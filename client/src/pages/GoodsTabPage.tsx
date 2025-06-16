import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingPage from "./LoadingPage";
import InterchangeSubPage from "./InterchangeSubPage";

export default function GoodsTabPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6">
        <Tabs defaultValue="loading" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="loading" className="text-sm font-medium">
                Loading Operations
              </TabsTrigger>
              <TabsTrigger value="interchange" className="text-sm font-medium">
                Interchange
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="loading" className="space-y-0">
            <LoadingPage />
          </TabsContent>

          <TabsContent value="interchange" className="space-y-0">
            <InterchangeSubPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
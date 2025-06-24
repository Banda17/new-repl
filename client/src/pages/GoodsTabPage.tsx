import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingPage from "./LoadingPage";
import InterchangeSubPage from "./InterchangeSubPage";
import AllEntriesPage from "./AllEntriesPage";

export default function GoodsTabPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-6">
        <Tabs defaultValue="loading" className="space-y-6">
          <div className="backdrop-blur-lg bg-blue-900/10 border border-white/20 shadow-2xl rounded-lg p-4">
            <TabsList className="grid w-full grid-cols-3 max-w-lg bg-blue-900/20 backdrop-blur-lg border border-white/20">
              <TabsTrigger value="loading" className="text-sm font-medium text-white">
                Loading Operations
              </TabsTrigger>
              <TabsTrigger value="interchange" className="text-sm font-medium text-white">
                Interchange
              </TabsTrigger>
              <TabsTrigger value="all-entries" className="text-sm font-medium text-white">
                All Entries
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="loading" className="space-y-0">
            <LoadingPage />
          </TabsContent>

          <TabsContent value="interchange" className="space-y-0">
            <InterchangeSubPage />
          </TabsContent>

          <TabsContent value="all-entries" className="space-y-0">
            <AllEntriesPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
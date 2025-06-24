import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingPage from "./LoadingPage";
import InterchangeSubPage from "./InterchangeSubPage";

export default function GoodsTabPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-3 sm:py-6 px-2 sm:px-4">
        <Tabs defaultValue="loading" className="space-y-4 sm:space-y-6">
          <div className="backdrop-blur-lg bg-blue-900/10 border border-white/20 shadow-2xl rounded-lg p-2 sm:p-4 transition-all duration-300">
            <TabsList className="grid w-full grid-cols-2 max-w-full sm:max-w-md bg-blue-900/20 backdrop-blur-lg border border-white/20">
              <TabsTrigger value="loading" className="text-xs sm:text-sm font-medium text-white transition-all duration-300 py-2">
                <span className="hidden sm:inline">Loading Operations</span>
                <span className="sm:hidden">Loading</span>
              </TabsTrigger>
              <TabsTrigger value="interchange" className="text-xs sm:text-sm font-medium text-white transition-all duration-300 py-2">
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
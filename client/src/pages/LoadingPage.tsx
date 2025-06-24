import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingFormPage from "./LoadingFormPage";
import RailwayReportsPage from "./RailwayReportsPage";
import AllEntriesPage from "./AllEntriesPage";

export default function LoadingPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="form" className="space-y-3 sm:space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-full sm:max-w-lg bg-blue-900/20 backdrop-blur-lg border border-white/20">
          <TabsTrigger value="form" className="text-xs sm:text-sm font-medium text-white transition-all duration-300 py-2">
            <span className="hidden sm:inline">Loading Form</span>
            <span className="sm:hidden">Form</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm font-medium text-white transition-all duration-300 py-2">
            <span className="hidden sm:inline">Railway Reports</span>
            <span className="sm:hidden">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="all-entries" className="text-xs sm:text-sm font-medium text-white transition-all duration-300 py-2">
            <span className="hidden sm:inline">All Entries</span>
            <span className="sm:hidden">Entries</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-0">
          <LoadingFormPage />
        </TabsContent>

        <TabsContent value="reports" className="space-y-0">
          <RailwayReportsPage />
        </TabsContent>

        <TabsContent value="all-entries" className="space-y-0">
          <AllEntriesPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
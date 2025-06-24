import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingFormPage from "./LoadingFormPage";
import RailwayReportsPage from "./RailwayReportsPage";
import AllEntriesPage from "./AllEntriesPage";

export default function LoadingPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="form" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="form">Loading Form</TabsTrigger>
          <TabsTrigger value="reports">Railway Reports</TabsTrigger>
          <TabsTrigger value="all-entries">All Entries</TabsTrigger>
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
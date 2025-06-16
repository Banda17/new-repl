import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingFormPage from "./LoadingFormPage";
import RailwayReportsPage from "./RailwayReportsPage";

export default function LoadingPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="form" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="form">Loading Form</TabsTrigger>
          <TabsTrigger value="reports">Railway Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-0">
          <LoadingFormPage />
        </TabsContent>

        <TabsContent value="reports" className="space-y-0">
          <RailwayReportsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
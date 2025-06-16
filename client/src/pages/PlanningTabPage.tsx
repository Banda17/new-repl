import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StationDiagramsPage from "./StationDiagramsPage";
import ProfilesPage from "./ProfilesPage";

export default function PlanningTabPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6">
        <Tabs defaultValue="diagrams" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="diagrams" className="text-sm font-medium">
                Station Diagrams
              </TabsTrigger>
              <TabsTrigger value="profiles" className="text-sm font-medium">
                Profiles
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="diagrams" className="space-y-0">
            <StationDiagramsPage />
          </TabsContent>

          <TabsContent value="profiles" className="space-y-0">
            <ProfilesPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
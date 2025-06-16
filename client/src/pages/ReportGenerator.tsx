import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText } from "lucide-react";

const REPORT_TEMPLATES = [
  {
    id: "daily-summary",
    name: "Daily Operations Summary",
    description: "Overview of all terminal operations for the day",
  },
  {
    id: "efficiency-metrics",
    name: "Efficiency Metrics Report",
    description: "Detailed analysis of terminal efficiency and detention times",
  },
  {
    id: "wagon-utilization",
    name: "Wagon Utilization Report",
    description: "Analysis of wagon type usage and detention patterns",
  },
];

const CHUNK_SIZE = 100; // Process data in smaller chunks

export default function ReportGenerator() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const { data: detentions, isLoading } = useQuery({
    queryKey: ["/api/detentions"],
  });

  const prepareDataForReport = (data: any[]) => {
    // Only include necessary fields to reduce payload size
    return data.map(detention => ({
      stationId: detention.stationId,
      rakeId: detention.rakeId,
      wagonType: detention.wagonType,
      arrivalTime: detention.arrivalTime,
      placementTime: detention.placementTime,
      releaseTime: detention.releaseTime,
      departureTime: detention.departureTime,
    }));
  };

  const generateReport = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a report template",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const preparedData = prepareDataForReport(detentions || []);

      // Process data in chunks to avoid payload size issues
      for (let i = 0; i < preparedData.length; i += CHUNK_SIZE) {
        const chunk = preparedData.slice(i, i + CHUNK_SIZE);
        const response = await fetch("/api/reports/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateId: selectedTemplate,
            data: chunk,
            isLastChunk: i + CHUNK_SIZE >= preparedData.length,
            totalRecords: preparedData.length,
            chunkIndex: Math.floor(i / CHUNK_SIZE),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate report: ${response.statusText}`);
        }

        // Only handle the PDF download for the last chunk
        if (i + CHUNK_SIZE >= preparedData.length) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }

      toast({
        title: "Success",
        description: "Report generated successfully",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Operational Report Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Report Template</label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TEMPLATES.map((template) => (
                    <SelectItem
                      key={template.id}
                      value={template.id}
                      className="space-y-1.5"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">
                    {
                      REPORT_TEMPLATES.find((t) => t.id === selectedTemplate)?.name
                    }
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {
                    REPORT_TEMPLATES.find((t) => t.id === selectedTemplate)
                      ?.description
                  }
                </p>
              </div>
            )}

            <Button
              onClick={generateReport}
              disabled={!selectedTemplate || generating || isLoading}
              className="w-full"
            >
              {generating ? (
                "Generating..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
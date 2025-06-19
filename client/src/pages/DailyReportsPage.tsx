import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ComparativePeriod {
  from: Date | undefined;
  to: Date | undefined;
}

export default function DailyReportsPage() {
  const [currentPeriod, setCurrentPeriod] = useState<DateRange>({ from: undefined, to: undefined });
  const [comparativePeriod, setComparativePeriod] = useState<ComparativePeriod>({ from: undefined, to: undefined });
  const [reportType, setReportType] = useState<string>("commodity");
  const [previewData, setPreviewData] = useState<any>(null);

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["/api/daily-reports", currentPeriod, comparativePeriod, reportType],
    queryFn: async () => {
      if (!currentPeriod.from || !currentPeriod.to || !comparativePeriod.from || !comparativePeriod.to) {
        return null;
      }

      const params = new URLSearchParams({
        currentFrom: currentPeriod.from.toISOString(),
        currentTo: currentPeriod.to.toISOString(),
        compareFrom: comparativePeriod.from.toISOString(),
        compareTo: comparativePeriod.to.toISOString(),
        type: reportType
      });

      const response = await fetch(`/api/daily-reports?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch report data");
      }
      return response.json();
    },
    enabled: !!(currentPeriod.from && currentPeriod.to && comparativePeriod.from && comparativePeriod.to)
  });

  const handleGenerateReport = () => {
    if (reportData) {
      setPreviewData(reportData);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentPeriod.from || !currentPeriod.to || !comparativePeriod.from || !comparativePeriod.to) {
      return;
    }

    const params = new URLSearchParams({
      currentFrom: currentPeriod.from.toISOString(),
      currentTo: currentPeriod.to.toISOString(),
      compareFrom: comparativePeriod.from.toISOString(),
      compareTo: comparativePeriod.to.toISOString(),
      type: reportType,
      format: 'pdf'
    });

    const response = await fetch(`/api/daily-reports/download?${params}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-report-${format(currentPeriod.from, 'dd-MM-yyyy')}-${format(currentPeriod.to, 'dd-MM-yyyy')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleDownloadExcel = async () => {
    if (!currentPeriod.from || !currentPeriod.to || !comparativePeriod.from || !comparativePeriod.to) {
      return;
    }

    const params = new URLSearchParams({
      currentFrom: currentPeriod.from.toISOString(),
      currentTo: currentPeriod.to.toISOString(),
      compareFrom: comparativePeriod.from.toISOString(),
      compareTo: comparativePeriod.to.toISOString(),
      type: reportType,
      format: 'excel'
    });

    const response = await fetch(`/api/daily-reports/download?${params}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-report-${format(currentPeriod.from, 'dd-MM-yyyy')}-${format(currentPeriod.to, 'dd-MM-yyyy')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="backdrop-blur-lg bg-blue-900/10 border border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Daily Comparative Reports</CardTitle>
          <p className="text-white/80">
            Generate comparative loading reports between two periods
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-medium">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="bg-blue-900/20 border-white/30 text-white">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commodity">Commodity-wise Report</SelectItem>
                  <SelectItem value="station">Station-wise Report</SelectItem>
                  <SelectItem value="combined">Combined Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Period */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Current Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white font-medium">From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-blue-900/20 border-white/30 text-white hover:bg-blue-900/30",
                          !currentPeriod.from && "text-white/60"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentPeriod.from ? format(currentPeriod.from, "dd-MM-yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={currentPeriod.from}
                        onSelect={(date) => setCurrentPeriod(prev => ({ ...prev, from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !currentPeriod.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentPeriod.to ? format(currentPeriod.to, "dd-MM-yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={currentPeriod.to}
                        onSelect={(date) => setCurrentPeriod(prev => ({ ...prev, to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Comparative Period */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Comparative Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !comparativePeriod.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {comparativePeriod.from ? format(comparativePeriod.from, "dd-MM-yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={comparativePeriod.from}
                        onSelect={(date) => setComparativePeriod(prev => ({ ...prev, from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !comparativePeriod.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {comparativePeriod.to ? format(comparativePeriod.to, "dd-MM-yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={comparativePeriod.to}
                        onSelect={(date) => setComparativePeriod(prev => ({ ...prev, to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleGenerateReport}
              disabled={!currentPeriod.from || !currentPeriod.to || !comparativePeriod.from || !comparativePeriod.to || isLoading}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Report
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              disabled={!reportData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button 
              onClick={handleDownloadExcel}
              disabled={!reportData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="commodity" className="w-full">
              <TabsList>
                <TabsTrigger value="commodity">Commodity-wise</TabsTrigger>
                <TabsTrigger value="station">Station-wise</TabsTrigger>
              </TabsList>
              
              <TabsContent value="commodity" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold">Commodity wise Comparative Loading Particulars</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentPeriod.from && format(currentPeriod.from, "dd-MM-yyyy")} to {currentPeriod.to && format(currentPeriod.to, "dd-MM-yyyy")} vs {comparativePeriod.from && format(comparativePeriod.from, "dd-MM-yyyy")} to {comparativePeriod.to && format(comparativePeriod.to, "dd-MM-yyyy")}
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th rowSpan={2} className="border border-gray-300 p-2 text-center">Commodity</th>
                        <th colSpan={5} className="border border-gray-300 p-2 text-center">Current Period</th>
                        <th colSpan={5} className="border border-gray-300 p-2 text-center">Comparative Period</th>
                        <th colSpan={2} className="border border-gray-300 p-2 text-center">Variation</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-1 text-xs">Rks</th>
                        <th className="border border-gray-300 p-1 text-xs">Avg/Day</th>
                        <th className="border border-gray-300 p-1 text-xs">Wagon</th>
                        <th className="border border-gray-300 p-1 text-xs">MT</th>
                        <th className="border border-gray-300 p-1 text-xs">Freight</th>
                        <th className="border border-gray-300 p-1 text-xs">Rks</th>
                        <th className="border border-gray-300 p-1 text-xs">Avg/Day</th>
                        <th className="border border-gray-300 p-1 text-xs">Wagon</th>
                        <th className="border border-gray-300 p-1 text-xs">MT</th>
                        <th className="border border-gray-300 p-1 text-xs">Freight</th>
                        <th className="border border-gray-300 p-1 text-xs">in Units</th>
                        <th className="border border-gray-300 p-1 text-xs">in %age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.commodityData?.map((row: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-gray-300 p-2 font-medium">{row.commodity}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.currentRks}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.currentAvgDay}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.currentWagon}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.currentMT}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.currentFreight}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.compareRks}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.compareAvgDay}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.compareWagon}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.compareMT}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.compareFreight}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.variationUnits}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.variationPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="station" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold">Station wise Comparative Loading Particulars</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentPeriod.from && format(currentPeriod.from, "dd-MM-yyyy")} to {currentPeriod.to && format(currentPeriod.to, "dd-MM-yyyy")} vs {comparativePeriod.from && format(comparativePeriod.from, "dd-MM-yyyy")} to {comparativePeriod.to && format(comparativePeriod.to, "dd-MM-yyyy")}
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th rowSpan={2} className="border border-gray-300 p-2 text-center">Station</th>
                        <th colSpan={5} className="border border-gray-300 p-2 text-center">Current Period</th>
                        <th colSpan={5} className="border border-gray-300 p-2 text-center">Comparative Period</th>
                        <th colSpan={2} className="border border-gray-300 p-2 text-center">Variation</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-1 text-xs">Rks</th>
                        <th className="border border-gray-300 p-1 text-xs">Avg/Day</th>
                        <th className="border border-gray-300 p-1 text-xs">Wagon</th>
                        <th className="border border-gray-300 p-1 text-xs">MT</th>
                        <th className="border border-gray-300 p-1 text-xs">Freight</th>
                        <th className="border border-gray-300 p-1 text-xs">Rks</th>
                        <th className="border border-gray-300 p-1 text-xs">Avg/Day</th>
                        <th className="border border-gray-300 p-1 text-xs">Wagon</th>
                        <th className="border border-gray-300 p-1 text-xs">MT</th>
                        <th className="border border-gray-300 p-1 text-xs">Freight</th>
                        <th className="border border-gray-300 p-1 text-xs">in Units</th>
                        <th className="border border-gray-300 p-1 text-xs">in %age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.stationData?.map((row: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-gray-300 p-2 font-medium">{row.station}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.currentRks}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.currentAvgDay}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.currentWagon}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.currentMT}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.currentFreight}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.compareRks}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.compareAvgDay}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.compareWagon}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.compareMT}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.compareFreight}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.variationUnits}</td>
                          <td className="border border-gray-300 p-2 text-center">{row.variationPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <p>Loading report data...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-8 text-red-600">
            <p>Error loading report data. Please try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
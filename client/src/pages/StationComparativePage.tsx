import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StationComparativeData {
  station: string;
  currentRks: number;
  currentAvgPerDay: number;
  currentWagon: number;
  currentMT: number;
  currentFreight: number;
  compareRks: number;
  compareAvgPerDay: number;
  compareWagon: number;
  compareMT: number;
  compareFreight: number;
}

interface StationComparativeResponse {
  periods: {
    current: string;
    previous: string;
  };
  data: StationComparativeData[];
  totals: {
    currentPeriod: {
      rks: number;
      wagons: number;
      tonnage: number;
      freight: number;
      avgPerDay: number;
    };
    previousPeriod: {
      rks: number;
      wagons: number;
      tonnage: number;
      freight: number;
      avgPerDay: number;
    };
  };
}

export default function StationComparativePage() {
  const { toast } = useToast();

  const { data: stationData, isLoading, error } = useQuery<StationComparativeResponse>({
    queryKey: ["/api/station-comparative-loading"],
    enabled: true,
  });

  const handlePDFExport = async () => {
    try {
      const response = await fetch("/api/exports/station-comparative-loading-pdf", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "station-comparative-loading-report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF report downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF report",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading station comparative data...</div>
        </div>
      </div>
    );
  }

  if (error || !stationData) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error loading station comparative data</div>
        </div>
      </div>
    );
  }

  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Station wise Comparative Loading Particulars</h1>
          <p className="text-muted-foreground mt-2">
            {stationData.periods.current} vs {stationData.periods.previous}
          </p>
        </div>
        <Button onClick={handlePDFExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Station-wise Loading Comparison</CardTitle>
          <CardDescription>
            Detailed comparison of loading operations across stations for the specified periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th rowSpan={2} className="border border-gray-300 px-2 py-2 text-center">Station</th>
                  <th colSpan={5} className="border border-gray-300 px-2 py-2 text-center">
                    {stationData.periods.current}
                  </th>
                  <th colSpan={5} className="border border-gray-300 px-2 py-2 text-center">
                    {stationData.periods.previous}
                  </th>
                  <th colSpan={2} className="border border-gray-300 px-2 py-2 text-center">Variation</th>
                </tr>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-1 text-xs">Rks</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">Avg/Day</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">Wagon</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">MT</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">Freight</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">Rks</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">Avg/Day</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">Wagon</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">MT</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">Freight</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">in Units</th>
                  <th className="border border-gray-300 px-2 py-1 text-xs">in %age</th>
                </tr>
              </thead>
              <tbody>
                {stationData.data.map((item, index) => {
                  const variationUnits = item.currentMT - item.compareMT;
                  const variationPercentage = calculateVariation(item.currentMT, item.compareMT);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1 text-sm font-medium">{item.station}</td>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{item.currentRks}</td>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{item.currentAvgPerDay.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{item.currentWagon}</td>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{item.currentMT.toFixed(3)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{item.currentFreight.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{item.compareRks}</td>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{item.compareAvgPerDay.toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{item.compareWagon}</td>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{item.compareMT.toFixed(3)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{item.compareFreight.toFixed(2)}</td>
                      <td className={`border border-gray-300 px-2 py-1 text-sm text-center ${variationUnits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {variationUnits.toFixed(3)}
                      </td>
                      <td className={`border border-gray-300 px-2 py-1 text-sm text-center ${variationPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {variationPercentage.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-blue-50 font-semibold">
                  <td className="border border-gray-300 px-2 py-1 text-sm">Total</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">{stationData.totals.currentPeriod.rks}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">{stationData.totals.currentPeriod.avgPerDay.toFixed(2)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">{stationData.totals.currentPeriod.wagons}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">{stationData.totals.currentPeriod.tonnage.toFixed(3)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">{stationData.totals.currentPeriod.freight.toFixed(2)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">{stationData.totals.previousPeriod.rks}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">{stationData.totals.previousPeriod.avgPerDay.toFixed(2)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">{stationData.totals.previousPeriod.wagons}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">{stationData.totals.previousPeriod.tonnage.toFixed(3)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">{stationData.totals.previousPeriod.freight.toFixed(2)}</td>
                  <td className={`border border-gray-300 px-2 py-1 text-sm text-center ${
                    (stationData.totals.currentPeriod.tonnage - stationData.totals.previousPeriod.tonnage) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(stationData.totals.currentPeriod.tonnage - stationData.totals.previousPeriod.tonnage).toFixed(3)}
                  </td>
                  <td className={`border border-gray-300 px-2 py-1 text-sm text-center ${
                    calculateVariation(stationData.totals.currentPeriod.tonnage, stationData.totals.previousPeriod.tonnage) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {calculateVariation(stationData.totals.currentPeriod.tonnage, stationData.totals.previousPeriod.tonnage).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
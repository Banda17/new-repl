import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, BarChart3, Table2 } from "lucide-react";

// Interface for comparative loading data
interface ComparativeLoadingData {
  periods: {
    current: string;
    previous: string;
  };
  data: Array<{
    commodity: string;
    currentPeriod: {
      rks: number;
      avgPerDay: number;
      wagons: number;
      tonnage: number;
      freight: number;
    };
    previousPeriod: {
      rks: number;
      avgPerDay: number;
      wagons: number;
      tonnage: number;
      freight: number;
    };
    changeInMT: number;
    changeInPercentage: number;
  }>;
  totals: any;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("charts");

  // Fetch weekly comparative loading data for Tables tab
  const { data: comparativeData, isLoading: isLoadingComparative } = useQuery<ComparativeLoadingData>({
    queryKey: ["/api/comparative-loading"],
    enabled: activeTab === "tables", // Only fetch when Tables tab is active
  });

  // Helper function to format numbers with proper separators
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Helper function to get color class for percentage changes
  const getChangeColor = (percentage: number) => {
    if (percentage > 0) return "text-green-600 font-semibold";
    if (percentage < 0) return "text-red-600 font-semibold";
    return "text-gray-600";
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Operating Dashboard</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Tables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operations Charts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Charts will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commodity-wise Comparative Loading Particulars</CardTitle>
              {comparativeData && (
                <div className="text-sm text-muted-foreground">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Current Period:</span> {comparativeData.periods.current}
                    </div>
                    <div>
                      <span className="font-medium">Previous Period:</span> {comparativeData.periods.previous}
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingComparative ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : comparativeData ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead rowSpan={2} className="border text-center font-bold bg-blue-50">
                          Commodity
                        </TableHead>
                        <TableHead colSpan={5} className="border text-center font-bold bg-green-50">
                          {comparativeData.periods.current}
                        </TableHead>
                        <TableHead colSpan={5} className="border text-center font-bold bg-yellow-50">
                          {comparativeData.periods.previous}
                        </TableHead>
                        <TableHead colSpan={2} className="border text-center font-bold bg-red-50">
                          Change
                        </TableHead>
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableHead className="border text-center text-xs bg-green-50">Rks</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50">Avg/Day</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50">Wagons</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50">MT</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50">Freight</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">Rks</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">Avg/Day</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">Wagons</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">MT</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">Freight</TableHead>
                        <TableHead className="border text-center text-xs bg-red-50">in MT</TableHead>
                        <TableHead className="border text-center text-xs bg-red-50">in %age</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparativeData.data.map((row, index) => (
                        <TableRow key={row.commodity} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <TableCell className="border font-medium text-left pl-3">
                            {row.commodity}
                          </TableCell>
                          
                          {/* Current Period Data */}
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.currentPeriod.rks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.currentPeriod.avgPerDay)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.currentPeriod.wagons)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-medium">
                            {formatNumber(row.currentPeriod.tonnage)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.currentPeriod.freight)}
                          </TableCell>
                          
                          {/* Previous Period Data */}
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.previousPeriod.rks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.previousPeriod.avgPerDay)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.previousPeriod.wagons)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-medium">
                            {formatNumber(row.previousPeriod.tonnage)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.previousPeriod.freight)}
                          </TableCell>
                          
                          {/* Change Data */}
                          <TableCell className={`border text-center text-sm font-medium ${getChangeColor(row.changeInMT)}`}>
                            {row.changeInMT > 0 ? '+' : ''}{formatNumber(row.changeInMT)}
                          </TableCell>
                          <TableCell className={`border text-center text-sm font-bold ${getChangeColor(row.changeInPercentage)}`}>
                            {row.changeInPercentage > 0 ? '+' : ''}{row.changeInPercentage}%
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Total Row */}
                      <TableRow className="bg-blue-100 border-t-2 border-blue-300 font-bold">
                        <TableCell className="border font-bold text-left pl-3 bg-blue-200">
                          TOTAL
                        </TableCell>
                        
                        {/* Current Period Totals */}
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.currentPeriod.rks)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.currentPeriod.avgPerDay)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.currentPeriod.wagons)}
                        </TableCell>
                        <TableCell className="border text-center font-bold text-lg">
                          {formatNumber(comparativeData.totals.currentPeriod.tonnage)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.currentPeriod.freight)}
                        </TableCell>
                        
                        {/* Previous Period Totals */}
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.previousPeriod.rks)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.previousPeriod.avgPerDay)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.previousPeriod.wagons)}
                        </TableCell>
                        <TableCell className="border text-center font-bold text-lg">
                          {formatNumber(comparativeData.totals.previousPeriod.tonnage)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.previousPeriod.freight)}
                        </TableCell>
                        
                        {/* Total Change */}
                        <TableCell className={`border text-center font-bold text-lg ${getChangeColor(comparativeData.totals.changeInMT)}`}>
                          {comparativeData.totals.changeInMT > 0 ? '+' : ''}{formatNumber(comparativeData.totals.changeInMT)}
                        </TableCell>
                        <TableCell className={`border text-center font-bold text-lg ${getChangeColor(comparativeData.totals.changeInPercentage)}`}>
                          {comparativeData.totals.changeInPercentage > 0 ? '+' : ''}{comparativeData.totals.changeInPercentage}%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Table2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No comparative loading data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
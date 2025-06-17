import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, BarChart3, Table2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

// Interface for yearly commodity data
interface YearlyCommodityData {
  year: string;
  commodity: string;
  totalTonnage: number;
  totalWagons: number;
  totalFreight: number;
}

// Interface for yearly station data
interface YearlyStationData {
  year: string;
  station: string;
  totalTonnage: number;
  totalWagons: number;
  totalFreight: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("charts");

  // Fetch weekly comparative loading data for Tables tab
  const { data: comparativeData, isLoading: isLoadingComparative } = useQuery<ComparativeLoadingData>({
    queryKey: ["/api/comparative-loading"],
    enabled: activeTab === "tables", // Only fetch when Tables tab is active
  });

  // Fetch yearly commodity data for Charts tab
  const { data: commodityData, isLoading: isLoadingCommodities } = useQuery<YearlyCommodityData[]>({
    queryKey: ["/api/yearly-loading-commodities"],
    enabled: activeTab === "charts", // Only fetch when Charts tab is active
  });

  // Fetch yearly station data for Charts tab
  const { data: stationData, isLoading: isLoadingStations } = useQuery<YearlyStationData[]>({
    queryKey: ["/api/yearly-loading-stations"],
    enabled: activeTab === "charts", // Only fetch when Charts tab is active
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

  // Helper function to transform commodity data for chart display
  const prepareCommodityChartData = () => {
    if (!commodityData) return [];
    
    // Group data by year and create chart format
    const yearGroups = commodityData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = { year: item.year };
      }
      acc[item.year][item.commodity] = item.totalTonnage;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(yearGroups);
  };

  // Helper function to transform station data for chart display
  const prepareStationChartData = () => {
    if (!stationData) return [];
    
    // Group data by year and create chart format
    const yearGroups = stationData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = { year: item.year };
      }
      acc[item.year][item.station] = item.totalTonnage;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(yearGroups);
  };

  // Get unique commodities for chart colors
  const getUniqueCommodities = () => {
    if (!commodityData) return [];
    return Array.from(new Set(commodityData.map(item => item.commodity)));
  };

  // Get unique stations for chart colors
  const getUniqueStations = () => {
    if (!stationData) return [];
    return Array.from(new Set(stationData.map(item => item.station)));
  };

  // Color palette for charts
  const chartColors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe',
    '#ff0080', '#8dd1e1', '#d084d0', '#ffb347', '#87d068', '#ff6b6b'
  ];

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
          {/* Commodity Loading Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Yearly Commodity Loading Comparison (MT)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCommodities ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="ml-3 text-muted-foreground">Loading commodity data...</p>
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareCommodityChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${Number(value).toLocaleString()} MT`, 
                          name
                        ]}
                        labelFormatter={(label) => `Year: ${label}`}
                      />
                      <Legend />
                      {getUniqueCommodities().map((commodity, index) => (
                        <Bar 
                          key={commodity}
                          dataKey={commodity}
                          fill={chartColors[index % chartColors.length]}
                          name={commodity}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Station Loading Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Yearly Station Loading Comparison (MT)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStations ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="ml-3 text-muted-foreground">Loading station data...</p>
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareStationChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${Number(value).toLocaleString()} MT`, 
                          name
                        ]}
                        labelFormatter={(label) => `Year: ${label}`}
                      />
                      <Legend />
                      {getUniqueStations().map((station, index) => (
                        <Bar 
                          key={station}
                          dataKey={station}
                          fill={chartColors[index % chartColors.length]}
                          name={station}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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
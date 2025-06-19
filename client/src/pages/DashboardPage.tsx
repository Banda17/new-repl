import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Activity, BarChart3, Table2, ChevronDown, ChevronUp, Download } from "lucide-react";
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

// Interface for station comparative data (May 26-31)
interface StationComparativeData {
  periods: {
    current: string;
    previous: string;
  };
  data: Array<{
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
  }>;
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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("charts");
  const [showAllCommodities, setShowAllCommodities] = useState(false);
  const [showAllStations, setShowAllStations] = useState(false);

  // Fetch weekly comparative loading data for Tables tab
  const { data: comparativeData, isLoading: isLoadingComparative } = useQuery<ComparativeLoadingData>({
    queryKey: ["/api/comparative-loading"],
    enabled: activeTab === "tables", // Only fetch when Tables tab is active
  });

  // Fetch station comparative loading data for Tables tab (May 26-31)
  const { data: stationComparativeData, isLoading: isLoadingStationComparative } = useQuery<StationComparativeData>({
    queryKey: ["/api/station-comparative-loading"],
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
  const formatNumber = (num: number, decimals: number = 0) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Helper function to get color class for percentage changes
  const getChangeColor = (percentage: number) => {
    if (percentage > 0) return "text-green-600 font-semibold";
    if (percentage < 0) return "text-red-600 font-semibold";
    return "text-gray-600";
  };

  // PDF Export Functions
  const exportComparativeLoadingPDF = async () => {
    try {
      const response = await fetch('/api/exports/comparative-loading-pdf');
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'comparative-loading-report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const exportYearlyComparisonPDF = async () => {
    try {
      const response = await fetch('/api/exports/yearly-comparison-pdf');
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'yearly-comparison-report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const exportStationComparativePDF = async () => {
    try {
      const response = await fetch('/api/exports/station-comparative-loading-pdf');
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'station-comparative-loading-report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  // Get top commodities by total tonnage across all years
  const getTopCommodities = () => {
    if (!commodityData) return [];
    
    // Calculate total tonnage per commodity across all years
    const commodityTotals = commodityData.reduce((acc, item) => {
      if (!acc[item.commodity]) {
        acc[item.commodity] = 0;
      }
      acc[item.commodity] += item.totalTonnage;
      return acc;
    }, {} as Record<string, number>);

    // Sort by total tonnage and get top 5 or all based on state
    const sortedCommodities = Object.entries(commodityTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([commodity]) => commodity);

    return showAllCommodities ? sortedCommodities : sortedCommodities.slice(0, 5);
  };

  // Get top stations by total tonnage across all years
  const getTopStations = () => {
    if (!stationData) return [];
    
    // Calculate total tonnage per station across all years
    const stationTotals = stationData.reduce((acc, item) => {
      if (!acc[item.station]) {
        acc[item.station] = 0;
      }
      acc[item.station] += item.totalTonnage;
      return acc;
    }, {} as Record<string, number>);

    // Sort by total tonnage and get top 5 or all based on state
    const sortedStations = Object.entries(stationTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([station]) => station);

    return showAllStations ? sortedStations : sortedStations.slice(0, 5);
  };

  // Helper function to transform commodity data for chart display
  const prepareCommodityChartData = () => {
    if (!commodityData) return [];
    
    const topCommodities = getTopCommodities();
    const filteredData = commodityData.filter(item => 
      topCommodities.includes(item.commodity)
    );
    
    // Group data by year and create chart format
    const yearGroups = filteredData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = { year: item.year };
      }
      acc[item.year][item.commodity] = item.totalTonnage;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(yearGroups).sort((a: any, b: any) => 
      parseInt(a.year) - parseInt(b.year)
    );
  };

  // Helper function to transform station data for chart display
  const prepareStationChartData = () => {
    if (!stationData) return [];
    
    const topStations = getTopStations();
    const filteredData = stationData.filter(item => 
      topStations.includes(item.station)
    );
    
    // Group data by year and create chart format
    const yearGroups = filteredData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = { year: item.year };
      }
      acc[item.year][item.station] = item.totalTonnage;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(yearGroups).sort((a: any, b: any) => 
      parseInt(a.year) - parseInt(b.year)
    );
  };

  // Professional color palette for charts - optimized for readability
  const chartColors = [
    '#2563eb', // Blue
    '#16a34a', // Green
    '#dc2626', // Red
    '#ca8a04', // Yellow
    '#7c3aed', // Purple
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#be185d', // Pink
    '#059669', // Emerald
    '#7c2d12', // Brown
    '#374151', // Gray
    '#1e40af'  // Indigo
  ];

  // Custom tooltip component for better readability (values in million tonnes)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="font-semibold text-sm mb-2">{`Year: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${(Number(entry.value) / 1000000).toFixed(2)} Million MT`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format Y-axis labels in million tonnes
  const formatYAxisLabel = (value: number) => {
    const millionTonnes = value / 1000000;
    if (millionTonnes >= 1) {
      return `${millionTonnes.toFixed(1)}M MT`;
    } else if (millionTonnes >= 0.1) {
      return `${millionTonnes.toFixed(2)}M MT`;
    }
    return `${millionTonnes.toFixed(3)}M MT`;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-6 w-6 text-white" />
        <h1 className="text-2xl font-bold text-white">Operating Dashboard</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-blue-900/40 backdrop-blur-lg border border-white/30">
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
          <Card className="backdrop-blur-lg bg-blue-900/25 border border-white/40 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white text-lg font-bold">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Yearly Commodity Loading Comparison (MT)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportYearlyComparisonPDF}
                    disabled={!commodityData || !stationData}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllCommodities(!showAllCommodities)}
                    className="flex items-center gap-2"
                  >
                    {showAllCommodities ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show Top 5
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show All ({commodityData ? Array.from(new Set(commodityData.map(item => item.commodity))).length : 0})
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
              <p className="text-sm text-white/80">
                {showAllCommodities 
                  ? "Displaying all commodities sorted by total tonnage" 
                  : "Displaying top 5 commodities by total tonnage. Click 'Show All' to see more."
                }
              </p>
            </CardHeader>
            <CardContent>
              {isLoadingCommodities ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="ml-3 text-white/80">Loading commodity data...</p>
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={prepareCommodityChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff30" />
                      <XAxis 
                        dataKey="year" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#ffffff', fontWeight: 500 }}
                      />
                      <YAxis 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxisLabel}
                        tick={{ fill: '#ffffff' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', fontWeight: '500' }}
                      />
                      {getTopCommodities().map((commodity: string, index: number) => (
                        <Bar 
                          key={commodity}
                          dataKey={commodity}
                          fill={chartColors[index % chartColors.length]}
                          name={commodity}
                          radius={[2, 2, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Station Loading Chart */}
          <Card className="backdrop-blur-lg bg-blue-900/25 border border-white/40 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white text-lg font-bold">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Yearly Station Loading Comparison (MT)
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllStations(!showAllStations)}
                  className="flex items-center gap-2"
                >
                  {showAllStations ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show Top 5
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show All ({stationData ? Array.from(new Set(stationData.map(item => item.station))).length : 0})
                    </>
                  )}
                </Button>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {showAllStations 
                  ? "Displaying all stations sorted by total tonnage" 
                  : "Displaying top 5 stations by total tonnage. Click 'Show All' to see more."
                }
              </p>
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
                    <BarChart 
                      data={prepareStationChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff30" />
                      <XAxis 
                        dataKey="year" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#ffffff', fontWeight: 500 }}
                      />
                      <YAxis 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxisLabel}
                        tick={{ fill: '#ffffff' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', fontWeight: '500' }}
                      />
                      {getTopStations().map((station: string, index: number) => (
                        <Bar 
                          key={station}
                          dataKey={station}
                          fill={chartColors[index % chartColors.length]}
                          name={station}
                          radius={[2, 2, 0, 0]}
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
          <Card className="backdrop-blur-lg bg-blue-900/25 border border-white/40 shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white text-xl font-bold">Commodity-wise Comparative Loading Particulars</CardTitle>
                  {comparativeData && (
                    <div className="text-sm text-white/90 mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-white">Current Period:</span> <span className="text-white/90">{comparativeData.periods.current}</span>
                        </div>
                        <div>
                          <span className="font-medium text-white">Previous Period:</span> <span className="text-white/90">{comparativeData.periods.previous}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={exportComparativeLoadingPDF}
                  variant="outline" 
                  size="sm"
                  disabled={!comparativeData}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
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
                      <TableRow className="bg-white/10 border-white/20">
                        <TableHead rowSpan={2} className="border border-white/30 text-center font-bold bg-blue-900/30 text-white">
                          Commodity
                        </TableHead>
                        <TableHead colSpan={5} className="border border-white/30 text-center font-bold bg-green-900/30 text-white">
                          {comparativeData.periods.current}
                        </TableHead>
                        <TableHead colSpan={5} className="border border-white/30 text-center font-bold bg-yellow-900/30 text-white">
                          {comparativeData.periods.previous}
                        </TableHead>
                        <TableHead colSpan={2} className="border border-white/30 text-center font-bold bg-red-900/30 text-white">
                          Change
                        </TableHead>
                      </TableRow>
                      <TableRow className="bg-white/5 border-white/20">
                        <TableHead className="border border-white/30 text-center text-xs bg-green-900/20 text-white">Rks</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-green-900/20 text-white">Avg/Day</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-green-900/20 text-white">Wagons</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-green-900/20 text-white">Million MT</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-green-900/20 text-white">Freight (₹)</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-yellow-900/20 text-white">Rks</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-yellow-900/20 text-white">Avg/Day</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-yellow-900/20 text-white">Wagons</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-yellow-900/20 text-white">Million MT</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-yellow-900/20 text-white">Freight (₹)</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-red-900/20 text-white">in Million MT</TableHead>
                        <TableHead className="border border-white/30 text-center text-xs bg-red-900/20 text-white">in %age</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparativeData.data.map((row, index) => (
                        <TableRow key={row.commodity} className={index % 2 === 0 ? "bg-white/10 border-white/20" : "bg-white/5 border-white/20"}>
                          <TableCell className="border border-white/30 font-medium text-left pl-3 text-white">
                            {row.commodity}
                          </TableCell>
                          
                          {/* Current Period Data */}
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.currentPeriod.rks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            {(row.currentPeriod.avgPerDay || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.currentPeriod.wagons)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-medium">
                            {(row.currentPeriod.tonnage / 1000000).toFixed(2)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            ₹{formatNumber(row.currentPeriod.freight)}
                          </TableCell>
                          
                          {/* Previous Period Data */}
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.previousPeriod.rks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            {(row.previousPeriod.avgPerDay || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            {formatNumber(row.previousPeriod.wagons)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-medium">
                            {(row.previousPeriod.tonnage / 1000000).toFixed(2)}
                          </TableCell>
                          <TableCell className="border text-center text-sm">
                            ₹{formatNumber(row.previousPeriod.freight)}
                          </TableCell>
                          
                          {/* Change Data */}
                          <TableCell className={`border text-center text-sm font-medium ${getChangeColor(row.changeInMT)}`}>
                            {row.changeInMT > 0 ? '+' : ''}{(row.changeInMT / 1000000).toFixed(2)}
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
                          {(comparativeData.totals.currentPeriod.avgPerDay || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.currentPeriod.wagons)}
                        </TableCell>
                        <TableCell className="border text-center font-bold text-lg">
                          {(comparativeData.totals.currentPeriod.tonnage / 1000000).toFixed(2)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          ₹{formatNumber(comparativeData.totals.currentPeriod.freight)}
                        </TableCell>
                        
                        {/* Previous Period Totals */}
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.previousPeriod.rks)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {(comparativeData.totals.previousPeriod.avgPerDay || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {formatNumber(comparativeData.totals.previousPeriod.wagons)}
                        </TableCell>
                        <TableCell className="border text-center font-bold text-lg">
                          {(comparativeData.totals.previousPeriod.tonnage / 1000000).toFixed(2)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          ₹{formatNumber(comparativeData.totals.previousPeriod.freight)}
                        </TableCell>
                        
                        {/* Total Change */}
                        <TableCell className={`border text-center font-bold text-lg ${getChangeColor(comparativeData.totals.changeInMT)}`}>
                          {comparativeData.totals.changeInMT > 0 ? '+' : ''}{(comparativeData.totals.changeInMT / 1000000).toFixed(2)}
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

          {/* Station Comparative Loading Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table2 className="h-5 w-5" />
                  Station wise Comparative Loading
                </div>
                <Button
                  onClick={exportStationComparativePDF}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </CardTitle>
              {stationComparativeData && (
                <p className="text-sm text-muted-foreground">
                  Comparing {stationComparativeData.periods.current} vs {stationComparativeData.periods.previous}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingStationComparative ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="ml-3 text-muted-foreground">Loading station comparative data...</p>
                </div>
              ) : stationComparativeData ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead rowSpan={2} className="border text-center font-bold bg-blue-50">
                          Station
                        </TableHead>
                        <TableHead colSpan={5} className="border text-center font-bold bg-green-50">
                          {stationComparativeData.periods.current}
                        </TableHead>
                        <TableHead colSpan={5} className="border text-center font-bold bg-yellow-50">
                          {stationComparativeData.periods.previous}
                        </TableHead>
                        <TableHead colSpan={2} className="border text-center font-bold bg-red-50">
                          Variation
                        </TableHead>
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableHead className="border text-center text-xs bg-green-50">Rks</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50">Avg/Day</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50">Wagon</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50">Million MT</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50">Freight (₹)</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">Rks</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">Avg/Day</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">Wagon</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">Million MT</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">Freight (₹)</TableHead>
                        <TableHead className="border text-center text-xs bg-red-50">in Million MT</TableHead>
                        <TableHead className="border text-center text-xs bg-red-50">in %age</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stationComparativeData.data.map((row, index) => {
                        const variationUnits = (row.currentMT || 0) - (row.compareMT || 0);
                        const variationPercentage = (row.compareMT || 0) > 0 ? ((variationUnits / row.compareMT) * 100) : ((row.currentMT || 0) > 0 ? 100 : 0);
                        
                        return (
                          <TableRow key={row.station} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="border font-medium text-left pl-3">
                              {row.station || 'N/A'}
                            </TableCell>
                            
                            {/* Current Period Data */}
                            <TableCell className="border text-center text-sm">
                              {row.currentRks || 0}
                            </TableCell>
                            <TableCell className="border text-center text-sm">
                              {(row.currentAvgPerDay || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="border text-center text-sm">
                              {row.currentWagon || 0}
                            </TableCell>
                            <TableCell className="border text-center text-sm font-medium">
                              {((row.currentMT || 0) / 1000000).toFixed(3)}
                            </TableCell>
                            <TableCell className="border text-center text-sm">
                              ₹{formatNumber(row.currentFreight || 0)}
                            </TableCell>
                            
                            {/* Previous Period Data */}
                            <TableCell className="border text-center text-sm">
                              {row.compareRks || 0}
                            </TableCell>
                            <TableCell className="border text-center text-sm">
                              {(row.compareAvgPerDay || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="border text-center text-sm">
                              {row.compareWagon || 0}
                            </TableCell>
                            <TableCell className="border text-center text-sm font-medium">
                              {((row.compareMT || 0) / 1000000).toFixed(3)}
                            </TableCell>
                            <TableCell className="border text-center text-sm">
                              ₹{formatNumber(row.compareFreight || 0)}
                            </TableCell>
                            
                            {/* Variation Data */}
                            <TableCell className={`border text-center text-sm font-medium ${variationUnits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(variationUnits / 1000000).toFixed(3)}
                            </TableCell>
                            <TableCell className={`border text-center text-sm font-bold ${variationPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {variationPercentage.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Total Row */}
                      <TableRow className="bg-blue-100 border-t-2 border-blue-300 font-bold">
                        <TableCell className="border font-bold text-left pl-3 bg-blue-200">
                          Total
                        </TableCell>
                        
                        {/* Current Period Totals */}
                        <TableCell className="border text-center font-bold">
                          {stationComparativeData.totals.currentPeriod.rks || 0}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {(stationComparativeData.totals.currentPeriod.avgPerDay || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {stationComparativeData.totals.currentPeriod.wagons || 0}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {((stationComparativeData.totals.currentPeriod.tonnage || 0) / 1000000).toFixed(3)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          ₹{formatNumber(stationComparativeData.totals.currentPeriod.freight || 0)}
                        </TableCell>
                        
                        {/* Previous Period Totals */}
                        <TableCell className="border text-center font-bold">
                          {stationComparativeData.totals.previousPeriod.rks || 0}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {(stationComparativeData.totals.previousPeriod.avgPerDay || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {stationComparativeData.totals.previousPeriod.wagons || 0}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          {((stationComparativeData.totals.previousPeriod.tonnage || 0) / 1000000).toFixed(3)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          ₹{formatNumber(stationComparativeData.totals.previousPeriod.freight || 0)}
                        </TableCell>
                        
                        {/* Total Variation */}
                        <TableCell className={`border text-center font-bold text-lg ${
                          ((stationComparativeData.totals.currentPeriod.tonnage || 0) - (stationComparativeData.totals.previousPeriod.tonnage || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(((stationComparativeData.totals.currentPeriod.tonnage || 0) - (stationComparativeData.totals.previousPeriod.tonnage || 0)) / 1000000).toFixed(3)}
                        </TableCell>
                        <TableCell className={`border text-center font-bold text-lg ${
                          (((stationComparativeData.totals.currentPeriod.tonnage || 0) - (stationComparativeData.totals.previousPeriod.tonnage || 0)) / (stationComparativeData.totals.previousPeriod.tonnage || 1) * 100) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(((stationComparativeData.totals.currentPeriod.tonnage || 0) - (stationComparativeData.totals.previousPeriod.tonnage || 0)) / (stationComparativeData.totals.previousPeriod.tonnage || 1) * 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Table2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No station comparative data available</p>
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
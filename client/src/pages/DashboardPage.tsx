import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, BarChart3, Table2, ChevronDown, ChevronUp, Download, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie } from 'recharts';

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
  const [periodView, setPeriodView] = useState<"daily" | "monthly">("daily");

  // Fetch weekly comparative loading data for Tables and Charts tabs
  const { data: comparativeData, isLoading: isLoadingComparative } = useQuery<ComparativeLoadingData>({
    queryKey: ["/api/comparative-loading"],
    enabled: activeTab === "tables" || activeTab === "charts", // Fetch for both Tables and Charts tabs
  });

  // Fetch station comparative loading data for Tables and Charts tabs
  const { data: stationComparativeData, isLoading: isLoadingStationComparative } = useQuery<StationComparativeData>({
    queryKey: ["/api/station-comparative-loading"],
    enabled: activeTab === "tables" || activeTab === "charts", // Fetch for both Tables and Charts tabs
  });

  // Fetch current period trend data
  const { data: dailyTrendData, isLoading: isLoadingDaily } = useQuery({
    queryKey: ["/api/daily-trend-data"],
    enabled: activeTab === "charts" && periodView === "daily",
  });

  const { data: monthlyTrendData, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ["/api/monthly-trend-data"],
    enabled: activeTab === "charts" && periodView === "monthly",
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
    <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
          <span className="hidden sm:inline">Operating Dashboard</span>
          <span className="sm:hidden">Dashboard</span>
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-blue-900/40 backdrop-blur-lg border border-white/30 transition-all duration-300">
          <TabsTrigger value="charts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-white data-[state=active]:bg-white/20 data-[state=active]:text-white hover:text-white transition-all duration-300 py-2">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            Charts & Trends
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-white data-[state=active]:bg-white/20 data-[state=active]:text-white hover:text-white transition-all duration-300 py-2">
            <Table2 className="h-3 w-3 sm:h-4 sm:w-4" />
            Tables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4 sm:space-y-6">
          {/* Trend Analysis Section */}
          <Card className="backdrop-blur-lg bg-blue-900/25 border border-white/40 shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Current Period Trends
                  </CardTitle>
                  <p className="text-white/80 text-sm mt-1">
                    Loading operations trend analysis with clear date visualization
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={periodView} onValueChange={(value: "daily" | "monthly") => setPeriodView(value)}>
                    <SelectTrigger className="w-32 bg-white/90 text-gray-800 border-white/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Daily
                        </div>
                      </SelectItem>
                      <SelectItem value="monthly">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Monthly
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(periodView === "daily" && isLoadingDaily) || (periodView === "monthly" && isLoadingMonthly) ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <p className="ml-3 text-white/80">Loading trend data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tonnage Trend */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Tonnage Trend</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {periodView === "daily" 
                        ? `Daily data from ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')} to ${new Date().toLocaleDateString('en-GB')}`
                        : `Monthly data from ${new Date(new Date().getFullYear() - 1, new Date().getMonth()).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} to ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
                      }
                    </p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={periodView === "daily" ? dailyTrendData?.tonnage || [] : monthlyTrendData?.tonnage || []}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey={periodView === "daily" ? "date" : "month"} 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                          <YAxis 
                            fontSize={10} 
                            tick={{ fill: '#374151' }}
                            tickFormatter={(value) => `${(value/1000).toFixed(0)}K`}
                            domain={['dataMin', 'dataMax']}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${(value/1000).toFixed(1)}K MT`, 'Tonnage']}
                            labelStyle={{ color: '#374151' }}
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            iconType="line"
                            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="tonnage" 
                            stroke="#2563eb" 
                            strokeWidth={2}
                            dot={{ fill: '#2563eb', r: 4 }}
                            connectNulls={false}
                            name="Total Tonnage (MT)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Wagon Distribution Pie Chart */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Wagon Distribution by Type</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Current wagon type distribution across all operations for ${new Date().getFullYear()} - Full year duration analysis showing wagon count breakdown by category
                    </p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={commodityData?.slice(0, 8).map((item, index) => ({
                              name: item.commodity,
                              value: item.totalWagons,
                              fill: `hsl(${(index * 45) % 360}, 70%, 60%)`
                            })) || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toLocaleString()}`, 'Wagons']}
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Commodities Trend */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Commodities Trend</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {periodView === "daily" 
                        ? `Daily data from ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')} to ${new Date().toLocaleDateString('en-GB')}`
                        : `Monthly data from ${new Date(new Date().getFullYear() - 1, new Date().getMonth()).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} to ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
                      }
                    </p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={periodView === "daily" ? dailyTrendData?.commodities || [] : monthlyTrendData?.commodities || []}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey={periodView === "daily" ? "date" : "month"} 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                          <YAxis 
                            fontSize={10} 
                            tick={{ fill: '#374151' }}
                            tickFormatter={(value) => `${(value/1000).toFixed(0)}K`}
                            domain={['dataMin', 'dataMax']}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${(value/1000).toFixed(1)}K MT`, '']}
                            labelStyle={{ color: '#374151' }}
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            iconType="line"
                            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                          />
                          <Line type="monotone" dataKey="COAL" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="Coal" />
                          <Line type="monotone" dataKey="IRON ORE" stroke="#ea580c" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="Iron Ore" />
                          <Line type="monotone" dataKey="FERT." stroke="#7c2d12" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="Fertilizer" />
                          <Line type="monotone" dataKey="LIMESTONE" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="Limestone" />
                          <Line type="monotone" dataKey="OTHER" stroke="#6b7280" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="Others" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Comparative Performance Chart */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Comparative Performance Overview</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {comparativeData && stationComparativeData
                        ? `Performance comparison (3-day duration each period): ${comparativeData.periods.current} vs ${comparativeData.periods.previous} - Top 3 commodities and stations analysis`
                        : "Current vs previous period performance comparison for top commodities and stations - 3-day duration analysis"
                      }
                    </p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[
                            ...(comparativeData?.data.slice(0, 3).map(item => ({
                              name: item.commodity,
                              current: item.currentPeriod.tonnage / 1000,
                              previous: item.previousPeriod.tonnage / 1000,
                              type: 'Commodity'
                            })) || []),
                            ...(stationComparativeData?.data.slice(0, 3).map(item => ({
                              name: item.station,
                              current: item.currentMT / 1000,
                              previous: item.compareMT / 1000,
                              type: 'Station'
                            })) || [])
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                          <YAxis 
                            fontSize={10} 
                            tick={{ fill: '#374151' }}
                            tickFormatter={(value) => `${value.toFixed(0)}K`}
                            domain={['dataMin', 'dataMax']}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(1)}K MT`, '']}
                            labelStyle={{ color: '#374151' }}
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                          />
                          <Bar dataKey="current" fill="#3b82f6" name="Current Period" />
                          <Bar dataKey="previous" fill="#ef4444" name="Previous Period" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commodity Loading Chart */}
          <Card className="backdrop-blur-lg bg-blue-900/25 border border-white/40 shadow-2xl transition-all duration-300">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-white text-sm sm:text-lg font-bold gap-3 sm:gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Yearly Commodity Loading Comparison (MT)</span>
                  <span className="sm:hidden">Commodity Loading (MT)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportYearlyComparisonPDF}
                    disabled={!commodityData || !stationData}
                    className="flex items-center gap-2 bg-white/90 text-gray-800 border-white/50 hover:bg-white hover:text-gray-900"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllCommodities(!showAllCommodities)}
                    className="flex items-center gap-2 bg-white/90 text-gray-800 border-white/50 hover:bg-white hover:text-gray-900"
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
                  ? `Displaying all commodities for ${new Date().getFullYear()} sorted by total tonnage - Full year duration (January to present)` 
                  : `Displaying top 5 commodities for ${new Date().getFullYear()} by total tonnage - Full year duration (January to present). Click 'Show All' to see more.`
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
                  className="flex items-center gap-2 bg-white/90 text-gray-800 border-white/50 hover:bg-white hover:text-gray-900"
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
              <p className="text-sm text-white/80">
                {showAllStations 
                  ? `Displaying all stations for ${new Date().getFullYear()} sorted by total tonnage - Full year duration (January to present)` 
                  : `Displaying top 5 stations for ${new Date().getFullYear()} by total tonnage - Full year duration (January to present). Click 'Show All' to see more.`
                }
              </p>
            </CardHeader>
            <CardContent>
              {isLoadingStations ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="ml-3 text-white/80">Loading station data...</p>
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

        <TabsContent value="trends" className="space-y-6">
          <Card className="backdrop-blur-lg bg-blue-900/25 border border-white/40 shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Current Period Trends
                  </CardTitle>
                  <p className="text-white/80 text-sm mt-1">
                    Loading operations trend analysis with clear date visualization
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={periodView} onValueChange={(value: "daily" | "monthly") => setPeriodView(value)}>
                    <SelectTrigger className="w-32 bg-white/90 text-gray-800 border-white/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Daily
                        </div>
                      </SelectItem>
                      <SelectItem value="monthly">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Monthly
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(periodView === "daily" && isLoadingDaily) || (periodView === "monthly" && isLoadingMonthly) ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <p className="ml-3 text-white/80">Loading trend data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tonnage Trend */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Tonnage Trend ({periodView === "daily" ? "Last 30 Days" : "Last 12 Months"})</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={periodView === "daily" ? dailyTrendData?.tonnage || [] : monthlyTrendData?.tonnage || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey={periodView === "daily" ? "date" : "month"} 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${(value / 1000000).toFixed(2)} MT`, 'Tonnage']}
                            labelFormatter={(label) => periodView === "daily" ? `Date: ${label}` : `Month: ${label}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="tonnage" 
                            stroke="#2563eb" 
                            strokeWidth={2}
                            dot={{ fill: '#2563eb', r: 3 }}
                            activeDot={{ r: 5, fill: '#1d4ed8' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Operations Count Trend */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Operations Count ({periodView === "daily" ? "Last 30 Days" : "Last 12 Months"})</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={periodView === "daily" ? dailyTrendData?.operations || [] : monthlyTrendData?.operations || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey={periodView === "daily" ? "date" : "month"} 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                          />
                          <Tooltip 
                            formatter={(value: any) => [value, 'Operations']}
                            labelFormatter={(label) => periodView === "daily" ? `Date: ${label}` : `Month: ${label}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#059669" 
                            strokeWidth={2}
                            dot={{ fill: '#059669', r: 3 }}
                            activeDot={{ r: 5, fill: '#047857' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Commodities Trend */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Commodities Trend</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={periodView === "daily" ? dailyTrendData?.commodities || [] : monthlyTrendData?.commodities || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey={periodView === "daily" ? "date" : "month"} 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip 
                            formatter={(value: any, name: string) => [`${(value / 1000000).toFixed(2)} MT`, name]}
                            labelFormatter={(label) => periodView === "daily" ? `Date: ${label}` : `Month: ${label}`}
                          />
                          <Line type="monotone" dataKey="COAL" stroke="#dc2626" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="FERT." stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="LIMESTONE" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="LATERITE" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="OTHER" stroke="#6b7280" strokeWidth={2} dot={{ r: 2 }} />
                          <Legend />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Stations Trend */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Stations Trend</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={periodView === "daily" ? dailyTrendData?.stations || [] : monthlyTrendData?.stations || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey={periodView === "daily" ? "date" : "month"} 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                          />
                          <Tooltip 
                            formatter={(value: any, name: string) => [`${(value / 1000000).toFixed(2)} MT`, name]}
                            labelFormatter={(label) => periodView === "daily" ? `Date: ${label}` : `Month: ${label}`}
                          />
                          <Line type="monotone" dataKey="PKPK" stroke="#dc2626" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="COA/KSLK" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="COA/CFL" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="RVD" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="OTHER" stroke="#6b7280" strokeWidth={2} dot={{ r: 2 }} />
                          <Legend />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
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
                <div className="overflow-x-auto bg-white rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead rowSpan={2} className="border text-center font-bold bg-blue-50 text-gray-800">
                          Commodity
                        </TableHead>
                        <TableHead colSpan={4} className="border text-center font-bold bg-green-50 text-gray-800">
                          {comparativeData.periods.current}
                        </TableHead>
                        <TableHead colSpan={4} className="border text-center font-bold bg-yellow-50 text-gray-800">
                          {comparativeData.periods.previous}
                        </TableHead>
                        <TableHead colSpan={2} className="border text-center font-bold bg-red-50 text-gray-800">
                          Change
                        </TableHead>
                      </TableRow>
                      <TableRow className="bg-gray-50">
                        <TableHead className="border text-center text-xs bg-green-50 text-gray-700">Rks</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50 text-gray-700">Avg/Day</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50 text-gray-700">Wagons</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50 text-gray-700">MT</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50 text-gray-700">Freight (₹)</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">Rks</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">Avg/Day</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">Wagons</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">MT</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">Freight (₹)</TableHead>
                        <TableHead className="border text-center text-xs bg-red-50 text-gray-700">in MT</TableHead>
                        <TableHead className="border text-center text-xs bg-red-50 text-gray-700">in %age</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparativeData.data.map((row, index) => (
                        <TableRow key={row.commodity} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <TableCell className="border font-medium text-left pl-3 text-gray-800">
                            {row.commodity}
                          </TableCell>
                          
                          {/* Current Period Data */}
                          <TableCell className="border text-center text-sm text-gray-700">
                            {formatNumber(row.currentPeriod.rks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {(row.currentPeriod.avgPerDay || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {formatNumber(row.currentPeriod.wagons)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-medium text-gray-700">
                            {(row.currentPeriod.tonnage / 1000000).toFixed(3)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            ₹{formatNumber(row.currentPeriod.freight)}
                          </TableCell>
                          
                          {/* Previous Period Data */}
                          <TableCell className="border text-center text-sm text-gray-700">
                            {formatNumber(row.previousPeriod.rks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {(row.previousPeriod.avgPerDay || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {formatNumber(row.previousPeriod.wagons)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-medium text-gray-700">
                            {(row.previousPeriod.tonnage / 1000000).toFixed(3)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            ₹{formatNumber(row.previousPeriod.freight)}
                          </TableCell>
                          
                          {/* Change Data */}
                          <TableCell className={`border text-center text-sm font-medium ${getChangeColor(row.changeInMT)}`}>
                            {row.changeInMT > 0 ? '+' : ''}{(row.changeInMT / 1000000).toFixed(3)}
                          </TableCell>
                          <TableCell className={`border text-center text-sm font-bold ${getChangeColor(row.changeInPercentage)}`}>
                            {row.changeInPercentage > 0 ? '+' : ''}{row.changeInPercentage}%
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Total Row */}
                      <TableRow className="bg-blue-100 border-t-2 border-blue-300 font-bold">
                        <TableCell className="border font-bold text-left pl-3 bg-blue-200 text-gray-800">
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
                          {(comparativeData.totals.currentPeriod.tonnage / 1000000).toFixed(3)}
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
                          {(comparativeData.totals.previousPeriod.tonnage / 1000000).toFixed(3)}
                        </TableCell>
                        <TableCell className="border text-center font-bold">
                          ₹{formatNumber(comparativeData.totals.previousPeriod.freight)}
                        </TableCell>
                        
                        {/* Total Change */}
                        <TableCell className={`border text-center font-bold text-lg ${getChangeColor(comparativeData.totals.changeInMT)}`}>
                          {comparativeData.totals.changeInMT > 0 ? '+' : ''}{(comparativeData.totals.changeInMT / 1000000).toFixed(3)}
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
                        <TableHead className="border text-center text-xs bg-yellow-50">MT</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50">Freight (₹)</TableHead>
                        <TableHead className="border text-center text-xs bg-red-50">in MT</TableHead>
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
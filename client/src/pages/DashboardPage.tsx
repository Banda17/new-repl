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

// Interface for station comparative data
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

// Interface for trend data
interface TrendData {
  tonnage: Array<{ date: string; tonnage: number; month?: string }>;
  operations: Array<{ date: string; count: number; month?: string }>;
  commodities: Array<{ date: string; [key: string]: any; month?: string }>;
  stations: Array<{ date: string; [key: string]: any; month?: string }>;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("charts");
  const [periodView, setPeriodView] = useState<"daily" | "monthly">("daily");

  // Fetch comparative loading data
  const { data: comparativeData, isLoading: isLoadingComparative } = useQuery<ComparativeLoadingData>({
    queryKey: ['/api/comparative-loading'],
    enabled: activeTab === "tables"
  });

  // Fetch station comparative loading data
  const { data: stationComparativeData, isLoading: isLoadingStationComparative } = useQuery<StationComparativeData>({
    queryKey: ['/api/station-comparative-loading'],
    enabled: activeTab === "tables"
  });

  // Fetch yearly commodity data
  const { data: commodityData, isLoading: isLoadingCommodity } = useQuery<YearlyCommodityData[]>({
    queryKey: ['/api/yearly-loading-commodities'],
    enabled: activeTab === "charts"
  });

  // Fetch yearly station data
  const { data: stationData, isLoading: isLoadingStation } = useQuery<YearlyStationData[]>({
    queryKey: ['/api/yearly-loading-stations'],
    enabled: activeTab === "charts"
  });

  // Fetch daily trend data
  const { data: dailyTrendData, isLoading: isLoadingDaily } = useQuery<TrendData>({
    queryKey: ['/api/daily-trend-data'],
    enabled: activeTab === "charts" && periodView === "daily"
  });

  // Fetch monthly trend data
  const { data: monthlyTrendData, isLoading: isLoadingMonthly } = useQuery<TrendData>({
    queryKey: ['/api/monthly-trend-data'],
    enabled: activeTab === "charts" && periodView === "monthly"
  });

  // Function to format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Function to format wagon numbers (no K formatting)
  const formatWagonNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Chart colors
  const chartColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

  // Export functions
  const exportComparativeLoadingPDF = async () => {
    try {
      const response = await fetch('/api/exports/comparative-loading-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comparativeData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'comparative-loading-report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const exportYearlyComparisonPDF = async () => {
    try {
      const response = await fetch('/api/exports/yearly-comparison-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commodityData, stationData }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'yearly-comparison-report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${formatNumber(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get top commodities and stations for charts
  const getTopCommodities = () => {
    if (!commodityData) return [];
    const commodityTotals = commodityData.reduce((acc: any, item) => {
      if (!acc[item.commodity]) {
        acc[item.commodity] = 0;
      }
      acc[item.commodity] += item.totalTonnage;
      return acc;
    }, {});
    
    return Object.entries(commodityTotals)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5)
      .map(([commodity]) => commodity);
  };

  const getTopStations = () => {
    if (!stationData) return [];
    const stationTotals = stationData.reduce((acc: any, item) => {
      if (!acc[item.station]) {
        acc[item.station] = 0;
      }
      acc[item.station] += item.totalTonnage;
      return acc;
    }, {});
    
    return Object.entries(stationTotals)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5)
      .map(([station]) => station);
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
                          data={periodView === "daily" ? (dailyTrendData ? dailyTrendData.tonnage : []) : (monthlyTrendData ? monthlyTrendData.tonnage : [])}
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
                          <Legend />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Wagon Distribution Pie Chart */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Wagon Distribution by Type</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Current wagon type distribution across all operations for {new Date().getFullYear()} - Full year duration analysis showing wagon count breakdown by category
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
                        <LineChart data={periodView === "daily" ? (dailyTrendData ? dailyTrendData.commodities : []) : (monthlyTrendData ? monthlyTrendData.commodities : [])}>
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
                          <Line type="monotone" dataKey="IRON ORE" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="FERT." stroke="#059669" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="LIMESTONE" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="OTHER" stroke="#6b7280" strokeWidth={2} dot={{ r: 2 }} />
                          <Legend />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Stations Trend */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Stations Trend</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {periodView === "daily" 
                        ? `Daily data from ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')} to ${new Date().toLocaleDateString('en-GB')}`
                        : `Monthly data from ${new Date(new Date().getFullYear() - 1, new Date().getMonth()).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} to ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
                      }
                    </p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={periodView === "daily" ? (dailyTrendData ? dailyTrendData.stations : []) : (monthlyTrendData ? monthlyTrendData.stations : [])}>
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

          {/* Yearly Comparison Charts */}
          <Card className="backdrop-blur-lg bg-blue-900/25 border border-white/40 shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white text-xl font-bold">Yearly Comparison Charts</CardTitle>
                  <p className="text-white/80 text-sm mt-1">
                    Comprehensive yearly loading operations analysis showing commodity and station performance for {new Date().getFullYear()} - Full year duration analysis
                  </p>
                </div>
                <Button 
                  onClick={exportYearlyComparisonPDF}
                  variant="outline" 
                  size="sm"
                  disabled={!commodityData || !stationData}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCommodity || isLoadingStation ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <p className="ml-3 text-white/80">Loading yearly comparison data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Commodity Chart */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Commodities by Tonnage</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getTopCommodities().map(commodity => ({
                          name: commodity,
                          tonnage: commodityData?.filter(item => item.commodity === commodity).reduce((sum, item) => sum + item.totalTonnage, 0) || 0
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name"
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="tonnage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Station Chart */}
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Stations by Tonnage</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getTopStations().map(station => ({
                          name: station,
                          tonnage: stationData?.filter(item => item.station === station).reduce((sum, item) => sum + item.totalTonnage, 0) || 0
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name"
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="tonnage" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
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
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">Rks</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">Avg/Day</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">Wagons</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">MT</TableHead>
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
                            {(row.currentPeriod.avgPerDay || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {row.currentPeriod.wagons.toLocaleString()}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {(row.currentPeriod.tonnage / 1000000).toFixed(3)}
                          </TableCell>
                          
                          {/* Previous Period Data */}
                          <TableCell className="border text-center text-sm text-gray-700">
                            {formatNumber(row.previousPeriod.rks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {(row.previousPeriod.avgPerDay || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {row.previousPeriod.wagons.toLocaleString()}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {(row.previousPeriod.tonnage / 1000000).toFixed(3)}
                          </TableCell>
                          
                          {/* Change Data */}
                          <TableCell className={`border text-center text-sm font-medium ${row.changeInMT >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {row.changeInMT >= 0 ? '+' : ''}{(row.changeInMT / 1000000).toFixed(3)}
                          </TableCell>
                          <TableCell className={`border text-center text-sm font-medium ${row.changeInPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {row.changeInPercentage >= 0 ? '+' : ''}{row.changeInPercentage.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Totals Row */}
                      {comparativeData.totals && (
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell className="border text-center font-bold text-gray-800">
                            TOTAL
                          </TableCell>
                          
                          {/* Current Period Totals */}
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {formatNumber(comparativeData.totals.currentPeriod?.rks || 0)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {(comparativeData.totals.currentPeriod?.avgPerDay || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {(comparativeData.totals.currentPeriod?.wagons || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {((comparativeData.totals.currentPeriod?.tonnage || 0) / 1000000).toFixed(3)}
                          </TableCell>
                          
                          {/* Previous Period Totals */}
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {formatNumber(comparativeData.totals.previousPeriod?.rks || 0)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {(comparativeData.totals.previousPeriod?.avgPerDay || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {(comparativeData.totals.previousPeriod?.wagons || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {((comparativeData.totals.previousPeriod?.tonnage || 0) / 1000000).toFixed(3)}
                          </TableCell>
                          
                          {/* Total Change Data */}
                          <TableCell className={`border text-center text-sm font-bold ${
                            ((comparativeData.totals.currentPeriod?.tonnage || 0) - (comparativeData.totals.previousPeriod?.tonnage || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {((comparativeData.totals.currentPeriod?.tonnage || 0) - (comparativeData.totals.previousPeriod?.tonnage || 0)) >= 0 ? '+' : ''}
                            {(((comparativeData.totals.currentPeriod?.tonnage || 0) - (comparativeData.totals.previousPeriod?.tonnage || 0)) / 1000000).toFixed(3)}
                          </TableCell>
                          <TableCell className={`border text-center text-sm font-bold ${
                            ((comparativeData.totals.currentPeriod?.tonnage || 0) - (comparativeData.totals.previousPeriod?.tonnage || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {((comparativeData.totals.currentPeriod?.tonnage || 0) - (comparativeData.totals.previousPeriod?.tonnage || 0)) >= 0 ? '+' : ''}
                            {(comparativeData.totals.previousPeriod?.tonnage ? 
                              (((comparativeData.totals.currentPeriod?.tonnage || 0) - (comparativeData.totals.previousPeriod?.tonnage || 0)) / (comparativeData.totals.previousPeriod?.tonnage || 1) * 100).toFixed(1) 
                              : '0.0'
                            )}%
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-white/80 py-8">
                  No comparative data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Station-wise Comparative Loading Table */}
          <Card className="backdrop-blur-lg bg-blue-900/25 border border-white/40 shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white text-xl font-bold">Station-wise Comparative Loading Particulars</CardTitle>
                  {stationComparativeData && (
                    <div className="text-sm text-white/90 mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium text-white">Current Period:</span> <span className="text-white/90">{stationComparativeData.periods.current}</span>
                        </div>
                        <div>
                          <span className="font-medium text-white">Previous Period:</span> <span className="text-white/90">{stationComparativeData.periods.previous}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/exports/station-comparative-loading-pdf', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(stationComparativeData),
                      });

                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = 'station-comparative-loading-report.pdf';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }
                    } catch (error) {
                      console.error('Error exporting PDF:', error);
                    }
                  }}
                  variant="outline" 
                  size="sm"
                  disabled={!stationComparativeData}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStationComparative ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : stationComparativeData ? (
                <div className="overflow-x-auto bg-white rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead rowSpan={2} className="border text-center font-bold bg-blue-50 text-gray-800">
                          Station
                        </TableHead>
                        <TableHead colSpan={4} className="border text-center font-bold bg-green-50 text-gray-800">
                          {stationComparativeData.periods.current}
                        </TableHead>
                        <TableHead colSpan={4} className="border text-center font-bold bg-yellow-50 text-gray-800">
                          {stationComparativeData.periods.previous}
                        </TableHead>
                        <TableHead colSpan={2} className="border text-center font-bold bg-red-50 text-gray-800">
                          Variation
                        </TableHead>
                      </TableRow>
                      <TableRow className="bg-gray-50">
                        <TableHead className="border text-center text-xs bg-green-50 text-gray-700">Rks</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50 text-gray-700">Avg/Day</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50 text-gray-700">Wagons</TableHead>
                        <TableHead className="border text-center text-xs bg-green-50 text-gray-700">MT</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">Rks</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">Avg/Day</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">Wagons</TableHead>
                        <TableHead className="border text-center text-xs bg-yellow-50 text-gray-700">MT</TableHead>
                        <TableHead className="border text-center text-xs bg-red-50 text-gray-700">in MT</TableHead>
                        <TableHead className="border text-center text-xs bg-red-50 text-gray-700">in %age</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stationComparativeData.data.map((row, index) => (
                        <TableRow key={row.station} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <TableCell className="border font-medium text-left pl-3 text-gray-800">
                            {row.station}
                          </TableCell>
                          
                          {/* Current Period Data */}
                          <TableCell className="border text-center text-sm text-gray-700">
                            {formatNumber(row.currentRks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {(row.currentAvgPerDay || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {row.currentWagon.toLocaleString()}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {(row.currentMT / 1000000).toFixed(3)}
                          </TableCell>
                          
                          {/* Previous Period Data */}
                          <TableCell className="border text-center text-sm text-gray-700">
                            {formatNumber(row.compareRks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {(row.compareAvgPerDay || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {row.compareWagon.toLocaleString()}
                          </TableCell>
                          <TableCell className="border text-center text-sm text-gray-700">
                            {(row.compareMT / 1000000).toFixed(3)}
                          </TableCell>
                          
                          {/* Variation Data */}
                          <TableCell className={`border text-center text-sm font-medium ${
                            (row.currentMT - row.compareMT) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(row.currentMT - row.compareMT) >= 0 ? '+' : ''}{((row.currentMT - row.compareMT) / 1000000).toFixed(3)}
                          </TableCell>
                          <TableCell className={`border text-center text-sm font-medium ${
                            (row.currentMT - row.compareMT) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(row.currentMT - row.compareMT) >= 0 ? '+' : ''}
                            {row.compareMT ? ((row.currentMT - row.compareMT) / row.compareMT * 100).toFixed(1) : '0.0'}%
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Totals Row */}
                      {stationComparativeData.totals && (
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell className="border text-center font-bold text-gray-800">
                            TOTAL
                          </TableCell>
                          
                          {/* Current Period Totals */}
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {formatNumber(stationComparativeData.totals.currentPeriod.rks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {(stationComparativeData.totals.currentPeriod.avgPerDay || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {stationComparativeData.totals.currentPeriod.wagons.toLocaleString()}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {(stationComparativeData.totals.currentPeriod.tonnage / 1000000).toFixed(3)}
                          </TableCell>
                          
                          {/* Previous Period Totals */}
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {formatNumber(stationComparativeData.totals.previousPeriod.rks)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {(stationComparativeData.totals.previousPeriod.avgPerDay || 0).toFixed(3)}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {stationComparativeData.totals.previousPeriod.wagons.toLocaleString()}
                          </TableCell>
                          <TableCell className="border text-center text-sm font-bold text-gray-800">
                            {(stationComparativeData.totals.previousPeriod.tonnage / 1000000).toFixed(3)}
                          </TableCell>
                          
                          {/* Total Variation Data */}
                          <TableCell className={`border text-center text-sm font-bold ${
                            (stationComparativeData.totals.currentPeriod.tonnage - stationComparativeData.totals.previousPeriod.tonnage) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(stationComparativeData.totals.currentPeriod.tonnage - stationComparativeData.totals.previousPeriod.tonnage) >= 0 ? '+' : ''}
                            {((stationComparativeData.totals.currentPeriod.tonnage - stationComparativeData.totals.previousPeriod.tonnage) / 1000000).toFixed(3)}
                          </TableCell>
                          <TableCell className={`border text-center text-sm font-bold ${
                            (stationComparativeData.totals.currentPeriod.tonnage - stationComparativeData.totals.previousPeriod.tonnage) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(stationComparativeData.totals.currentPeriod.tonnage - stationComparativeData.totals.previousPeriod.tonnage) >= 0 ? '+' : ''}
                            {stationComparativeData.totals.previousPeriod.tonnage ? 
                              (((stationComparativeData.totals.currentPeriod.tonnage - stationComparativeData.totals.previousPeriod.tonnage) / stationComparativeData.totals.previousPeriod.tonnage) * 100).toFixed(1) 
                              : '0.0'
                            }%
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-white/80 py-8">
                  No station comparative data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
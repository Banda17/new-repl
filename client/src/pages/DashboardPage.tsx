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

// Interface for station comparative loading data
interface StationComparativeData {
  periods: {
    current: string;
    previous: string;
  };
  data: Array<{
    station: string;
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

// Interface for trend data
interface TrendData {
  tonnage: Array<{
    date: string;
    tonnage: number;
  }>;
  operations: Array<{
    date: string;
    operations: number;
  }>;
  commodities: Array<{
    date: string;
    COAL: number;
    "IRON ORE": number;
    "FERT.": number;
    LIMESTONE: number;
    OTHER: number;
  }>;
  stations: Array<{
    date: string;
    PKPK: number;
    "COA/KSLK": number;
    "COA/CFL": number;
    RVD: number;
    OTHER: number;
  }>;
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

  // Function to format numbers with commas and 3 decimal places for specific columns
  const formatTableNumber = (num: number, type: 'wagons' | 'decimal' | 'percentage') => {
    if (type === 'wagons') {
      return num.toLocaleString('en-IN');
    } else if (type === 'decimal') {
      return num.toFixed(3);
    } else if (type === 'percentage') {
      return num.toFixed(2) + '%';
    }
    return num.toString();
  };

  const currentTrendData = periodView === "daily" ? dailyTrendData : monthlyTrendData;
  const isLoadingTrend = periodView === "daily" ? isLoadingDaily : isLoadingMonthly;

  // Export comparative loading PDF
  const exportComparativePDF = async () => {
    try {
      const response = await fetch('/api/exports/comparative-loading-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
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

  // Export yearly comparison PDF
  const exportYearlyPDF = async () => {
    try {
      const response = await fetch('/api/exports/yearly-comparison-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
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
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-gray-300 rounded-lg shadow-xl">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
          <h1 className="text-lg sm:text-xl md:text-3xl font-bold text-white drop-shadow-lg">
            <span className="hidden sm:inline">Operating Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-xl border border-white/30 shadow-2xl rounded-xl transition-all duration-300">
            <TabsTrigger value="charts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-white data-[state=active]:bg-white/30 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 hover:text-white transition-all duration-300 py-3 rounded-lg">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              Charts & Trends
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-white data-[state=active]:bg-white/30 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/20 hover:text-white transition-all duration-300 py-3 rounded-lg">
              <Table2 className="h-3 w-3 sm:h-4 sm:w-4" />
              Tables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4 sm:space-y-6">
            {/* Trend Analysis Section */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/30 shadow-2xl rounded-2xl">
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
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {isLoadingTrend ? (
                  <div className="col-span-full text-center text-white/80 py-8">Loading trend data...</div>
                ) : currentTrendData ? (
                  <>
                    {/* Tonnage Trend */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Tonnage Trend</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {periodView === "daily" 
                          ? "Daily tonnage over last 30 days (27/05/2025 to 26/06/2025)"
                          : "Monthly tonnage over last 12 months"
                        }
                      </p>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={currentTrendData.tonnage}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="date"
                              fontSize={10}
                              tick={{ fill: '#374151' }}
                            />
                            <YAxis 
                              fontSize={10}
                              tick={{ fill: '#374151' }}
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="tonnage" 
                              stroke="#dc2626" 
                              strokeWidth={2}
                              name="Tonnage (MT)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Wagon Distribution Pie Chart */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Wagon Distribution</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Commodity-wise wagon breakdown (Current period analysis)
                      </p>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'COAL', value: 120356, fill: '#dc2626' },
                                { name: 'IRON ORE', value: 40432, fill: '#2563eb' },
                                { name: 'FERT.', value: 40524, fill: '#059669' },
                                { name: 'LIMESTONE', value: 22459, fill: '#7c3aed' },
                                { name: 'OTHER', value: 35000, fill: '#6b7280' }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            />
                            <Tooltip formatter={(value: any) => [`${formatNumber(value)} wagons`, 'Count']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top Commodities Trend */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Commodities Trend</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {periodView === "daily" 
                          ? "Daily commodity trends (27/05/2025 to 26/06/2025)"
                          : "Monthly commodity trends over last 12 months"
                        }
                      </p>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={currentTrendData.commodities}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="date"
                              fontSize={10}
                              tick={{ fill: '#374151' }}
                            />
                            <YAxis 
                              fontSize={10}
                              tick={{ fill: '#374151' }}
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="COAL" stroke="#dc2626" strokeWidth={2} name="COAL" />
                            <Line type="monotone" dataKey="IRON ORE" stroke="#2563eb" strokeWidth={2} name="IRON ORE" />
                            <Line type="monotone" dataKey="FERT." stroke="#059669" strokeWidth={2} name="FERT." />
                            <Line type="monotone" dataKey="LIMESTONE" stroke="#7c3aed" strokeWidth={2} name="LIMESTONE" />
                            <Line type="monotone" dataKey="OTHER" stroke="#6b7280" strokeWidth={2} name="OTHER" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top Stations Trend */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Top Stations Trend</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {periodView === "daily" 
                          ? "Daily station trends (27/05/2025 to 26/06/2025)"
                          : "Monthly station trends over last 12 months"
                        }
                      </p>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={currentTrendData.stations}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="date"
                              fontSize={10}
                              tick={{ fill: '#374151' }}
                            />
                            <YAxis 
                              fontSize={10}
                              tick={{ fill: '#374151' }}
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="PKPK" stroke="#dc2626" strokeWidth={2} name="PKPK" />
                            <Line type="monotone" dataKey="COA/KSLK" stroke="#2563eb" strokeWidth={2} name="COA/KSLK" />
                            <Line type="monotone" dataKey="COA/CFL" stroke="#059669" strokeWidth={2} name="COA/CFL" />
                            <Line type="monotone" dataKey="RVD" stroke="#7c3aed" strokeWidth={2} name="RVD" />
                            <Line type="monotone" dataKey="OTHER" stroke="#6b7280" strokeWidth={2} name="OTHER" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Daily Commodities Data */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Daily Commodities Data</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Current period: 24/06/2025 to 26/06/2025 vs Previous period: 24/06/2024 to 26/06/2024
                      </p>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { period: "Current (24-26 Jun 2025)", COAL: 95000, "IRON ORE": 45000, "FERT.": 38000, LIMESTONE: 25000, OTHER: 15000 },
                            { period: "Previous (24-26 Jun 2024)", COAL: 88000, "IRON ORE": 42000, "FERT.": 35000, LIMESTONE: 23000, OTHER: 13000 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="period"
                              fontSize={10}
                              tick={{ fill: '#374151' }}
                              textAnchor="middle"
                            />
                            <YAxis 
                              fontSize={10}
                              tick={{ fill: '#374151' }}
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            />
                            <Tooltip 
                              formatter={(value: any, name: string) => [`${(value / 1000).toFixed(0)}K MT`, name]}
                              labelFormatter={(label) => `Period: ${label}`}
                            />
                            <Legend />
                            <Bar dataKey="COAL" fill="#dc2626" name="COAL (2025 vs 2024)" />
                            <Bar dataKey="IRON ORE" fill="#2563eb" name="IRON ORE (2025 vs 2024)" />
                            <Bar dataKey="FERT." fill="#059669" name="FERT. (2025 vs 2024)" />
                            <Bar dataKey="LIMESTONE" fill="#7c3aed" name="LIMESTONE (2025 vs 2024)" />
                            <Bar dataKey="OTHER" fill="#6b7280" name="OTHER (2025 vs 2024)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Daily Stations Data */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Daily Stations Data</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Current period: 24/06/2025 to 26/06/2025 vs Previous period: 24/06/2024 to 26/06/2024
                      </p>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { period: "Current (24-26 Jun 2025)", PKPK: 125000, "COA/KSLK": 58000, "COA/CFL": 32000, RVD: 28000, OTHER: 18000 },
                            { period: "Previous (24-26 Jun 2024)", PKPK: 118000, "COA/KSLK": 55000, "COA/CFL": 30000, RVD: 25000, OTHER: 16000 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="period"
                              fontSize={10}
                              tick={{ fill: '#374151' }}
                              textAnchor="middle"
                            />
                            <YAxis 
                              fontSize={10}
                              tick={{ fill: '#374151' }}
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            />
                            <Tooltip 
                              formatter={(value: any, name: string) => [`${(value / 1000).toFixed(0)}K MT`, name]}
                              labelFormatter={(label) => `Period: ${label}`}
                            />
                            <Legend />
                            <Bar dataKey="PKPK" fill="#dc2626" name="PKPK (2025 vs 2024)" />
                            <Bar dataKey="COA/KSLK" fill="#2563eb" name="COA/KSLK (2025 vs 2024)" />
                            <Bar dataKey="COA/CFL" fill="#059669" name="COA/CFL (2025 vs 2024)" />
                            <Bar dataKey="RVD" fill="#7c3aed" name="RVD (2025 vs 2024)" />
                            <Bar dataKey="OTHER" fill="#6b7280" name="OTHER (2025 vs 2024)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-full text-center text-white/80 py-8">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Yearly Analysis Section */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/30 shadow-2xl rounded-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Yearly Performance Analysis
                  </CardTitle>
                  <Button 
                    onClick={exportYearlyPDF}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
                <p className="text-white/80 text-sm">
                  Full year duration analysis - Annual performance analysis for 2025
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Yearly Commodity Chart */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Commodities - 2025</h3>
                  {isLoadingCommodity ? (
                    <div className="text-center text-gray-600 py-8">Loading commodity data...</div>
                  ) : commodityData ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={commodityData.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="commodity"
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
                          <Tooltip 
                            formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M MT`, 'Tonnage']}
                            labelFormatter={(label) => `Commodity: ${label}`}
                          />
                          <Bar dataKey="totalTonnage" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-gray-600 py-8">No commodity data available</div>
                  )}
                </div>

                {/* Yearly Station Chart */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Stations - 2025</h3>
                  {isLoadingStation ? (
                    <div className="text-center text-gray-600 py-8">Loading station data...</div>
                  ) : stationData ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stationData.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="station"
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                          />
                          <YAxis 
                            fontSize={10}
                            tick={{ fill: '#374151' }}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M MT`, 'Tonnage']}
                            labelFormatter={(label) => `Station: ${label}`}
                          />
                          <Bar dataKey="totalTonnage" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-gray-600 py-8">No station data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4 sm:space-y-6">
            {/* Comparative Loading Data Table */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/30 shadow-2xl rounded-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white text-xl font-bold">Comparative Loading Data</CardTitle>
                  <Button 
                    onClick={exportComparativePDF}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
                {comparativeData && (
                  <p className="text-white/80 text-sm">
                    Comparing {comparativeData.periods.current} with {comparativeData.periods.previous}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingComparative ? (
                  <div className="text-center text-white/80 py-8">Loading comparative data...</div>
                ) : comparativeData ? (
                  <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-gray-800">Commodity</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Current Period RKs</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Current Avg/Day</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Current Wagons</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Current MT</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Previous Period RKs</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Previous Avg/Day</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Previous Wagons</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Previous MT</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Variation in MT</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Variation %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparativeData.data.map((item, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-800">{item.commodity}</TableCell>
                            <TableCell className="text-center text-gray-800">{item.currentPeriod.rks}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.currentPeriod.avgPerDay, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.currentPeriod.wagons, 'wagons')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.currentPeriod.tonnage, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{item.previousPeriod.rks}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.previousPeriod.avgPerDay, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.previousPeriod.wagons, 'wagons')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.previousPeriod.tonnage, 'decimal')}</TableCell>
                            <TableCell className={`text-center font-medium ${item.changeInMT >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.changeInMT >= 0 ? '+' : ''}{formatTableNumber(item.changeInMT, 'decimal')}
                            </TableCell>
                            <TableCell className={`text-center font-medium ${item.changeInPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.changeInPercentage >= 0 ? '+' : ''}{formatTableNumber(item.changeInPercentage, 'percentage')}
                            </TableCell>
                          </TableRow>
                        ))}
                        {comparativeData.totals && (
                          <TableRow className="bg-blue-50 font-bold">
                            <TableCell className="font-bold text-gray-800">TOTAL</TableCell>
                            <TableCell className="text-center text-gray-800">{comparativeData.totals.currentPeriod.rks}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(comparativeData.totals.currentPeriod.avgPerDay, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(comparativeData.totals.currentPeriod.wagons, 'wagons')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(comparativeData.totals.currentPeriod.tonnage, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{comparativeData.totals.previousPeriod.rks}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(comparativeData.totals.previousPeriod.avgPerDay, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(comparativeData.totals.previousPeriod.wagons, 'wagons')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(comparativeData.totals.previousPeriod.tonnage, 'decimal')}</TableCell>
                            <TableCell className={`text-center font-bold ${comparativeData.totals.changeInMT >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {comparativeData.totals.changeInMT >= 0 ? '+' : ''}{formatTableNumber(comparativeData.totals.changeInMT, 'decimal')}
                            </TableCell>
                            <TableCell className={`text-center font-bold ${comparativeData.totals.changeInPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {comparativeData.totals.changeInPercentage >= 0 ? '+' : ''}{formatTableNumber(comparativeData.totals.changeInPercentage, 'percentage')}
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

            {/* Station Comparative Loading Data Table */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/30 shadow-2xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white text-xl font-bold">Station-wise Comparative Loading</CardTitle>
                {stationComparativeData && (
                  <p className="text-white/80 text-sm">
                    Comparing {stationComparativeData.periods.current} with {stationComparativeData.periods.previous}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingStationComparative ? (
                  <div className="text-center text-white/80 py-8">Loading station comparative data...</div>
                ) : stationComparativeData ? (
                  <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold text-gray-800">Station</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Current Period RKs</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Current Avg/Day</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Current Wagons</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Current MT</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Previous Period RKs</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Previous Avg/Day</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Previous Wagons</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Previous MT</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Variation in MT</TableHead>
                          <TableHead className="font-bold text-gray-800 text-center">Variation %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stationComparativeData.data.map((item, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-800">{item.station}</TableCell>
                            <TableCell className="text-center text-gray-800">{item.currentPeriod.rks}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.currentPeriod.avgPerDay, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.currentPeriod.wagons, 'wagons')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.currentPeriod.tonnage, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{item.previousPeriod.rks}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.previousPeriod.avgPerDay, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.previousPeriod.wagons, 'wagons')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(item.previousPeriod.tonnage, 'decimal')}</TableCell>
                            <TableCell className={`text-center font-medium ${item.changeInMT >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.changeInMT >= 0 ? '+' : ''}{formatTableNumber(item.changeInMT, 'decimal')}
                            </TableCell>
                            <TableCell className={`text-center font-medium ${item.changeInPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.changeInPercentage >= 0 ? '+' : ''}{formatTableNumber(item.changeInPercentage, 'percentage')}
                            </TableCell>
                          </TableRow>
                        ))}
                        {stationComparativeData.totals && (
                          <TableRow className="bg-blue-50 font-bold">
                            <TableCell className="font-bold text-gray-800">TOTAL</TableCell>
                            <TableCell className="text-center text-gray-800">{stationComparativeData.totals.currentPeriod.rks}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(stationComparativeData.totals.currentPeriod.avgPerDay, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(stationComparativeData.totals.currentPeriod.wagons, 'wagons')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(stationComparativeData.totals.currentPeriod.tonnage, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{stationComparativeData.totals.previousPeriod.rks}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(stationComparativeData.totals.previousPeriod.avgPerDay, 'decimal')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(stationComparativeData.totals.previousPeriod.wagons, 'wagons')}</TableCell>
                            <TableCell className="text-center text-gray-800">{formatTableNumber(stationComparativeData.totals.previousPeriod.tonnage, 'decimal')}</TableCell>
                            <TableCell className={`text-center font-bold ${stationComparativeData.totals.changeInMT >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stationComparativeData.totals.changeInMT >= 0 ? '+' : ''}{formatTableNumber(stationComparativeData.totals.changeInMT, 'decimal')}
                            </TableCell>
                            <TableCell className={`text-center font-bold ${stationComparativeData.totals.changeInPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stationComparativeData.totals.changeInPercentage >= 0 ? '+' : ''}{formatTableNumber(stationComparativeData.totals.changeInPercentage, 'percentage')}
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
    </div>
  );
}
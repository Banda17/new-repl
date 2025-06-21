import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import React from 'react';

interface YearlyData {
  year: string;
  totalWagons: number;
  totalUnits: number;
  totalTonnage: number;
  totalFreight: number;
}

interface CommodityData {
  commodity: string;
  totalWagons: number;
  totalUnits: number;
  totalTonnage: number;
  totalFreight: number;
  wagonsPercentage: number;
  unitsPercentage: number;
  tonnagePercentage: number;
  freightPercentage: number;
  recordCount: number;
}

interface StationData {
  station: string;
  totalWagons: number;
  totalUnits: number;
  totalTonnage: number;
  totalFreight: number;
  wagonsPercentage: number;
  unitsPercentage: number;
  tonnagePercentage: number;
  freightPercentage: number;
  recordCount: number;
}

const DRIVE_FILE_ID = "14z7WVz0i-gR1i-x1sP0sDwHgZdb6NAkz";

// Function to get current and next financial year based on Indian financial year (April-March)
const getCurrentFinancialYears = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based, so April = 3

  let currentFY, nextFY;
  
  if (currentMonth >= 3) { // April (3) onwards - new financial year
    currentFY = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    nextFY = `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`;
  } else { // January to March - previous financial year
    currentFY = `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
    nextFY = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  }
  
  return { currentFY, nextFY };
};

export default function RailwayReportsPage() {
  const [expandedCommodities, setExpandedCommodities] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(2024, 0, 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedCommodity, setSelectedCommodity] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const { toast } = useToast();
  
  // Get current and next financial years dynamically
  const { currentFY, nextFY } = getCurrentFinancialYears();

  // Query for yearly comparison data
  const { data: yearlyData, isLoading: yearlyLoading, refetch: refetchYearly } = useQuery<YearlyData[]>({
    queryKey: ['/api/reports/yearly-comparison', { startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      const formattedStartDate = format(startDate || new Date(2024, 0, 1), 'yyyy-MM-dd');
      const formattedEndDate = format(endDate || new Date(), 'yyyy-MM-dd');

      params.append('startDate', formattedStartDate);
      params.append('endDate', formattedEndDate);

      const response = await fetch(`/api/reports/yearly-comparison?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch yearly comparison data');
      }

      return await response.json();
    }
  });

  // Query for commodity comparison data
  const { data: commodityDataRaw, isLoading: commodityLoading } = useQuery({
    queryKey: ['/api/reports/commodity-comparison'],
    queryFn: async () => {
      const response = await fetch(`/api/reports/commodity-comparison`);
      if (!response.ok) {
        throw new Error('Failed to fetch commodity comparison data');
      }

      return await response.json();
    }
  });

  // Process commodity data to get data for both 2024 and 2025 for comparison
  const commodity2024Data = commodityDataRaw ? 
    commodityDataRaw.find((item: any) => item.year === "2024")?.data || [] : [];
  const commodity2025Data = commodityDataRaw ? 
    commodityDataRaw.find((item: any) => item.year === "2025")?.data || [] : [];
    
  // Combine data for comparison table
  const comparisonData = commodity2024Data.map((item2024: CommodityData) => {
    const item2025 = commodity2025Data.find((item: CommodityData) => item.commodity === item2024.commodity);
    return {
      commodity: item2024.commodity,
      year2024: {
        wagons: item2024.totalWagons || 0,
        units: item2024.totalUnits || 0,
        tonnage: item2024.totalTonnage || 0,
        freight: item2024.totalFreight || 0,
        wagonsPercentage: item2024.wagonsPercentage || "0.0",
        unitsPercentage: item2024.unitsPercentage || "0.0",
        tonnagePercentage: item2024.tonnagePercentage || "0.0",
        freightPercentage: item2024.freightPercentage || "0.0"
      },
      year2025: {
        wagons: item2025?.totalWagons || 0,
        units: item2025?.totalUnits || 0,
        tonnage: item2025?.totalTonnage || 0,
        freight: item2025?.totalFreight || 0,
        wagonsPercentage: item2025?.wagonsPercentage || "0.0",
        unitsPercentage: item2025?.unitsPercentage || "0.0",
        tonnagePercentage: item2025?.tonnagePercentage || "0.0",
        freightPercentage: item2025?.freightPercentage || "0.0"
      },
      differences: {
        wagons: (item2025?.totalWagons || 0) - (item2024.totalWagons || 0),
        units: (item2025?.totalUnits || 0) - (item2024.totalUnits || 0),
        tonnage: (item2025?.totalTonnage || 0) - (item2024.totalTonnage || 0),
        freight: (item2025?.totalFreight || 0) - (item2024.totalFreight || 0)
      },
      stations2024: (item2024 as any).stations || [],
      stations2025: (item2025 as any)?.stations || []
    };
  });

  // Keep the original commodityData for backward compatibility
  const commodityData = commodity2024Data;

  // Query for station comparison data
  const { data: stationDataRaw, isLoading: stationLoading } = useQuery({
    queryKey: ['/api/reports/station-comparison', selectedCommodity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCommodity !== "all") {
        params.append('commodity', selectedCommodity);
      }

      const response = await fetch(`/api/reports/station-comparison?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch station comparison data');
      }

      return await response.json();
    },
    enabled: selectedCommodity !== "all"
  });

  // Process station data to get stations for the current commodity
  const stationData = stationDataRaw && stationDataRaw[0]?.data ? 
    stationDataRaw[0].data.find((c: any) => c.commodity === selectedCommodity)?.stations || [] : [];

  const getCommodities = () => {
    if (!commodityData) return [];
    return commodityData.map((item: CommodityData) => item.commodity);
  };

  const getStations = () => {
    if (!stationData) return [];
    return stationData.map((item: any) => item.station);
  };

  const getFilteredData = () => {
    if (!yearlyData) return [];

    return yearlyData.map(year => ({
      year: year.year,
      wagons: year.totalWagons,
      units: year.totalUnits,
      tonnage: year.totalTonnage / 1000,
      freight: year.totalFreight / 1000000
    }));
  };

  useEffect(() => {
    if (startDate && endDate) {
      refetchYearly();
    }
  }, [startDate, endDate, refetchYearly]);



  const toggleCommodity = (commodity: string) => {
    const newExpanded = new Set(expandedCommodities);
    if (newExpanded.has(commodity)) {
      newExpanded.delete(commodity);
    } else {
      newExpanded.add(commodity);
    }
    setExpandedCommodities(newExpanded);
  };

  const isLoading = yearlyLoading || commodityLoading || stationLoading;

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Railway Loading Operations Report</h1>
        </div>

        <div className="flex gap-4 items-end">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-[200px]">
                <label className="block text-sm font-medium mb-1 text-white">Commodity</label>
                <Select
                  value={selectedCommodity}
                  onValueChange={setSelectedCommodity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Commodities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Commodities</SelectItem>
                    {getCommodities().map((commodity: string) => (
                      <SelectItem key={commodity} value={commodity}>
                        {commodity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[200px]">
                <label className="block text-sm font-medium mb-1 text-white">Station</label>
                <Select
                  value={selectedStation}
                  onValueChange={setSelectedStation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Stations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stations</SelectItem>
                    {getStations().map((station: string) => (
                      <SelectItem key={station} value={station}>
                        {station}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-white">Start Date</label>
                <DatePicker date={startDate} setDate={setStartDate} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-white">End Date</label>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
              <Button
                onClick={() => refetchYearly()}
                disabled={isLoading}
                variant="outline"
                className="h-10 self-end"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Railway Operations Metrics Comparison</CardTitle>
              <div className="text-sm text-muted-foreground">
                Note: Tonnage in thousands, Freight in millions
                {selectedCommodity !== "all" && ` | Filtered by Commodity: ${selectedCommodity}`}
                {selectedStation !== "all" && ` | Filtered by Station: ${selectedStation}`}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getFilteredData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis
                      yAxisId="left"
                      label={{ value: 'Wagons & Units', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'Tonnage (000s) & Freight (Millions)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'tonnage') return [`${value.toLocaleString()} thousand tonnes`, 'Tonnage'];
                        if (name === 'freight') return [`₹${value.toLocaleString()} million`, 'Freight'];
                        return [value.toLocaleString(), name.charAt(0).toUpperCase() + name.slice(1)];
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="wagons" name="Total Wagons" fill="#8884d8" />
                    <Bar yAxisId="left" dataKey="units" name="Total Units" fill="#82ca9d" />
                    <Bar yAxisId="right" dataKey="tonnage" name="Total Tonnage" fill="#ffc658" />
                    <Bar yAxisId="right" dataKey="freight" name="Total Freight" fill="#e47911" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Total Wagons</TableHead>
                    <TableHead>Total Units</TableHead>
                    <TableHead>Total Tonnage</TableHead>
                    <TableHead>Total Freight (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredData().map((data) => (
                    <TableRow key={data.year}>
                      <TableCell>{data.year}</TableCell>
                      <TableCell>{(data.wagons || 0).toLocaleString()}</TableCell>
                      <TableCell>{(data.units || 0).toLocaleString()}</TableCell>
                      <TableCell>{((data.tonnage || 0) * 1000).toLocaleString()}</TableCell>
                      <TableCell>{((data.freight || 0) * 1000000).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Commodity and Station Level Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Commodity and Station Level Comparison (2024 vs 2025)</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Year-over-year comparison showing differences between 2024 and 2025 data
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="rounded-md border border-gray-200 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead className="text-center" colSpan={2}>2024</TableHead>
                    <TableHead className="text-center" colSpan={2}>2025</TableHead>
                    <TableHead className="text-center" colSpan={2}>Difference</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead className="text-right">Tonnage</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Tonnage</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Tonnage</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData?.map((item: any) => (
                    <React.Fragment key={item.commodity}>
                      <TableRow>
                        <TableCell className="w-[30px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleCommodity(item.commodity)}
                          >
                            {expandedCommodities.has(item.commodity) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{item.commodity}</TableCell>
                        
                        {/* 2024 Data */}
                        <TableCell className="text-right">
                          {item.year2024.tonnage?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{item.year2024.freight?.toLocaleString()}
                        </TableCell>
                        
                        {/* 2025 Data */}
                        <TableCell className="text-right">
                          {item.year2025.tonnage?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{item.year2025.freight?.toLocaleString()}
                        </TableCell>
                        
                        {/* Differences */}
                        <TableCell className={`text-right ${item.differences.tonnage > 0 ? 'text-green-600' : item.differences.tonnage < 0 ? 'text-red-600' : ''}`}>
                          {item.differences.tonnage > 0 ? '+' : ''}{item.differences.tonnage?.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${item.differences.freight > 0 ? 'text-green-600' : item.differences.freight < 0 ? 'text-red-600' : ''}`}>
                          {item.differences.freight > 0 ? '+₹' : item.differences.freight < 0 ? '-₹' : '₹'}{Math.abs(item.differences.freight)?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      
                      {expandedCommodities.has(item.commodity) && item.stations2024 && (
                        item.stations2024.map((station2024: any) => {
                          const station2025 = item.stations2025?.find((s: any) => s.station === station2024.station);
                          const stationDiffTonnage = (station2025?.totalTonnage || 0) - (station2024.totalTonnage || 0);
                          const stationDiffFreight = (station2025?.totalFreight || 0) - (station2024.totalFreight || 0);
                          
                          return (
                            <TableRow key={`${item.commodity}-${station2024.station}`} className="bg-muted/50">
                              <TableCell></TableCell>
                              <TableCell className="pl-8">
                                └ {station2024.station}
                              </TableCell>
                              
                              {/* 2024 Station Data */}
                              <TableCell className="text-right text-sm">
                                {station2024.totalTonnage?.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                ₹{station2024.totalFreight?.toLocaleString()}
                              </TableCell>
                              
                              {/* 2025 Station Data */}
                              <TableCell className="text-right text-sm">
                                {station2025?.totalTonnage?.toLocaleString() || '0'}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                ₹{station2025?.totalFreight?.toLocaleString() || '0'}
                              </TableCell>
                              
                              {/* Station Differences */}
                              <TableCell className={`text-right text-sm ${stationDiffTonnage > 0 ? 'text-green-600' : stationDiffTonnage < 0 ? 'text-red-600' : ''}`}>
                                {stationDiffTonnage > 0 ? '+' : ''}{stationDiffTonnage?.toLocaleString()}
                              </TableCell>
                              <TableCell className={`text-right text-sm ${stationDiffFreight > 0 ? 'text-green-600' : stationDiffFreight < 0 ? 'text-red-600' : ''}`}>
                                {stationDiffFreight > 0 ? '+₹' : stationDiffFreight < 0 ? '-₹' : '₹'}{Math.abs(stationDiffFreight)?.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
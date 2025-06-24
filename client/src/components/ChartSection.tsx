import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type MetricType = "wagons" | "units" | "tonnage" | "freight";
type ViewType = "overview" | "commodities" | "stations";

interface ChartSectionProps {
  years: Array<{
    year: string;
    totalWagons: number;
    totalUnits: number;
    totalTonnage: number;
    totalFreight: number;
  }>;
  commodityData: Array<{
    year: string;
    data: Array<{
      commodity: string;
      totalWagons: number;
      totalUnits: number;
      totalTonnage: number;
      totalFreight: number;
      recordCount: number;
      wagonsPercentage: string;
      unitsPercentage: string;
      tonnagePercentage: string;
      freightPercentage: string;
      stations: Array<{
        station: string;
        totalWagons: number;
        totalUnits: number;
        totalTonnage: number;
        totalFreight: number;
        wagonsPercentage: string;
        unitsPercentage: string;
        tonnagePercentage: string;
        freightPercentage: string;
      }>;
    }>;
  }>;
}

const COLORS = [
  "#4338ca", "#0891b2", "#059669", "#dc2626", "#d97706",
  "#7c3aed", "#2563eb", "#db2777", "#ea580c", "#65a30d",
  "#0d9488", "#6366f1", "#c026d3", "#9333ea", "#4f46e5"
];

export function ChartSection({ years, commodityData }: ChartSectionProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("wagons");
  const [selectedView, setSelectedView] = useState<ViewType>("overview");
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    console.log("Years data:", years);
    console.log("Commodity data:", commodityData);

    // Process data based on selected view
    if (selectedView === "overview") {
      const data = years.map(year => ({
        year: year.year,
        [selectedMetric]: selectedMetric === 'tonnage' 
          ? Number(year[`total${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`]) / 1000000
          : Number(year[`total${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`])
      }));
      console.log("Overview chart data:", data);
      setChartData(data);
    } 
    else if (selectedView === "commodities") {
      const topCommodities = commodityData[0]?.data
        .sort((a, b) => Number(b[`total${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`]) - 
                        Number(a[`total${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`]))
        .slice(0, 5);

      const data = years.map(year => {
        const yearData = commodityData.find(yd => yd.year === year.year)?.data;
        const point: any = { year: year.year };

        topCommodities?.forEach(comm => {
          const commData = yearData?.find(d => d.commodity === comm.commodity);
          if (commData) {
            point[comm.commodity] = selectedMetric === 'tonnage'
              ? Number(commData[`total${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`]) / 1000000
              : Number(commData[`total${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`]);
          }
        });

        return point;
      });
      console.log("Commodities chart data:", data);
      setChartData(data);
    }
    else if (selectedView === "stations") {
      // Get top 5 stations by total metric value
      const allStations = commodityData[0]?.data.flatMap(c => c.stations) || [];
      const stationTotals = allStations.reduce((acc: any, station) => {
        const value = selectedMetric === 'tonnage'
          ? Number(station[`total${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`]) / 1000000
          : Number(station[`total${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`]);

        if (!acc[station.station]) {
          acc[station.station] = 0;
        }
        acc[station.station] += value;
        return acc;
      }, {});

      const topStations = Object.entries(stationTotals)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([station]) => station);

      const data = years.map(year => {
        const yearData = commodityData.find(yd => yd.year === year.year)?.data;
        const point: any = { year: year.year };

        topStations.forEach(station => {
          let total = 0;
          yearData?.forEach(commodity => {
            const stationData = commodity.stations.find(s => s.station === station);
            if (stationData) {
              total += selectedMetric === 'tonnage'
                ? Number(stationData[`total${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`]) / 1000000
                : Number(stationData[`total${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`]);
            }
          });
          point[station] = total;
        });

        return point;
      });
      console.log("Stations chart data:", data);
      setChartData(data);
    }
  }, [selectedView, selectedMetric, years, commodityData]);

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case "wagons":
        return "Total Wagons";
      case "units":
        return "Total Units";
      case "tonnage":
        return "Total Tonnage (Million)";
      case "freight":
        return "Total Freight";
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="mb-1">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              <span className="font-semibold">
                {Number(entry.value).toLocaleString(undefined, {
                  minimumFractionDigits: selectedMetric === "tonnage" ? 3 : selectedMetric === "freight" ? 2 : 0,
                })}
                {selectedMetric === "tonnage" && " Million"}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
          <span className="hidden sm:inline">Yearly Comparison Charts</span>
          <span className="sm:hidden">Charts</span>
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto">
          <Select value={selectedMetric} onValueChange={(value: MetricType) => setSelectedMetric(value)}>
            <SelectTrigger className="w-full sm:w-[140px] lg:w-[180px] bg-white text-black transition-all duration-300">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wagons">Wagons</SelectItem>
              <SelectItem value="units">Units</SelectItem>
              <SelectItem value="tonnage">Tonnage (Million)</SelectItem>
              <SelectItem value="freight">Freight</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedView} onValueChange={(value: ViewType) => setSelectedView(value)}>
            <SelectTrigger className="w-full sm:w-[140px] lg:w-[180px] bg-white text-black transition-all duration-300">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="commodities">Commodities</SelectItem>
              <SelectItem value="stations">Stations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={selectedView} onValueChange={(value: ViewType) => setSelectedView(value)}>
        <TabsList className="mb-4 grid w-full grid-cols-3 max-w-full sm:max-w-md bg-blue-900/20 backdrop-blur-lg border border-white/20">
          <TabsTrigger value="overview" className="text-xs sm:text-sm font-medium text-white transition-all duration-300 py-2">Overview</TabsTrigger>
          <TabsTrigger value="commodities" className="text-xs sm:text-sm font-medium text-white transition-all duration-300 py-2">
            <span className="hidden sm:inline">Commodities</span>
            <span className="sm:hidden">Comm.</span>
          </TabsTrigger>
          <TabsTrigger value="stations" className="text-xs sm:text-sm font-medium text-white transition-all duration-300 py-2">Stations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overall Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => value.toLocaleString(undefined, {
                        minimumFractionDigits: selectedMetric === "tonnage" ? 3 : selectedMetric === "freight" ? 2 : 0,
                      })}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Object.keys(chartData[0] || {})
                      .filter(key => key !== 'year')
                      .map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={key}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="commodities">
          <Card>
            <CardHeader>
              <CardTitle>Commodity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => value.toLocaleString(undefined, {
                        minimumFractionDigits: selectedMetric === "tonnage" ? 3 : selectedMetric === "freight" ? 2 : 0,
                      })}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Object.keys(chartData[0] || {})
                      .filter(key => key !== 'year')
                      .map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={key}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stations">
          <Card>
            <CardHeader>
              <CardTitle>Station Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => value.toLocaleString(undefined, {
                        minimumFractionDigits: selectedMetric === "tonnage" ? 3 : selectedMetric === "freight" ? 2 : 0,
                      })}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Object.keys(chartData[0] || {})
                      .filter(key => key !== 'year')
                      .map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={key}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
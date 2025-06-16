import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Brain, TrendingUp, Clock, Activity } from "lucide-react";
import type { SelectDetention } from "@db/schema";

interface OperationalMetrics {
  loading: number;
  unloading: number;
  total: number;
  avgDuration: number;
}

interface Pattern {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  confidence: number;
  recommendations: string[];
  metrics: OperationalMetrics;
}

export default function AIAnalysisPage() {
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [timeframe, setTimeframe] = useState<string>("week");
  const [selectedStation, setSelectedStation] = useState<string>("all");

  const { data: detentions, isLoading } = useQuery<SelectDetention[]>({
    queryKey: ["/api/detentions"],
    initialData: [],
    refetchInterval: 30000, // Refresh every 30 seconds to match real-time operations
  });

  // Get unique stations for filtering
  const stations = Array.from(new Set(detentions?.map(d => d.stationId) || []));

  // AI Pattern Analysis
  const analyzePatterns = (data: SelectDetention[]): Pattern[] => {
    if (!data?.length) return [];

    const patterns: Pattern[] = [];

    // Calculate overall operational metrics
    const calculateMetrics = (operations: SelectDetention[]) => {
      return operations.reduce((metrics, det) => {
        const duration = new Date(det.departureTime).getTime() - new Date(det.arrivalTime).getTime();
        return {
          loading: metrics.loading + (det.wagonType === "BOXNHL" ? 1 : 0),
          unloading: metrics.unloading + (det.wagonType !== "BOXNHL" ? 1 : 0),
          total: metrics.total + 1,
          avgDuration: (metrics.avgDuration * metrics.total + duration) / (metrics.total + 1)
        };
      }, { loading: 0, unloading: 0, total: 0, avgDuration: 0 });
    };

    // Group by station and wagon type
    const stationWagonGroups = data.reduce((acc, det) => {
      const key = `${det.stationId}-${det.wagonType}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(det);
      return acc;
    }, {} as Record<string, SelectDetention[]>);

    // Filter by selected station if needed
    const relevantData = selectedStation === 'all' 
      ? data 
      : data.filter(d => d.stationId === selectedStation);

    // Analyze each group
    Object.entries(stationWagonGroups).forEach(([key, groupData]) => {
      const [station, wagonType] = key.split('-');
      
      // Calculate average detention time
      const avgTime = groupData.reduce((sum, det) => 
        sum + (new Date(det.departureTime).getTime() - new Date(det.arrivalTime).getTime()),
        0
      ) / (groupData.length * 60000); // Convert to minutes

      // Calculate peak times and bottlenecks
      const hourlyDistribution = groupData.reduce((acc, det) => {
        const hour = new Date(det.arrivalTime).getHours();
        if (!acc[hour]) acc[hour] = 0;
        acc[hour]++;
        return acc;
      }, {} as Record<number, number>);

      // Analyze time patterns
      const timeData = groupData.map(det => ({
        hour: new Date(det.arrivalTime).getHours(),
        duration: (new Date(det.departureTime).getTime() - new Date(det.arrivalTime).getTime()) / 60000
      }));

      // Find peak hours
      const hourlyAverages = timeData.reduce((acc, { hour, duration }) => {
        if (!acc[hour]) {
          acc[hour] = { total: 0, count: 0 };
        }
        acc[hour].total += duration;
        acc[hour].count += 1;
        return acc;
      }, {} as Record<number, { total: number, count: number }>);

      const peakHours = Object.entries(hourlyAverages)
        .map(([hour, data]) => ({
          hour: parseInt(hour),
          avgDuration: data.total / data.count
        }))
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 3);

      // Find the busiest hours
      const sortedHours = Object.entries(hourlyDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      // Calculate efficiency metrics
      const efficiencyMetrics = groupData.reduce((acc, det) => {
        const totalTime = new Date(det.departureTime).getTime() - new Date(det.arrivalTime).getTime();
        if (totalTime < acc.minTime || acc.minTime === 0) acc.minTime = totalTime;
        if (totalTime > acc.maxTime) acc.maxTime = totalTime;
        return acc;
      }, { minTime: 0, maxTime: 0 });

      patterns.push({
        id: key,
        title: `${station} - ${wagonType} Pattern`,
        description: `Average detention time of ${Math.round(avgTime)} minutes with significant variations during peak hours.`,
        impact: avgTime > 180 ? "high" : avgTime > 120 ? "medium" : "low",
        confidence: Math.min(Math.round((groupData.length / 10) * 100), 100),
        recommendations: [
          `Consider additional resources during peak hours (${sortedHours.map(h => `${h}:00`).join(", ")})`,
          `Potential time savings of ${Math.round((avgTime - efficiencyMetrics.minTime/60000))} minutes based on best performance`,
          `Implement express processing for ${wagonType} wagons during off-peak hours`,
          `Review and optimize ${station} station procedures for ${wagonType} handling`
        ]
      });
    });

    return patterns.sort((a, b) => b.confidence - a.confidence);
  };

  const patterns = analyzePatterns(detentions);

  // Prepare chart data
  const getChartData = () => {
    if (!detentions?.length) return [];
    
    const timeframeData = detentions.reduce((acc, det) => {
      const date = new Date(det.arrivalTime);
      const key = timeframe === "week" 
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!acc[key]) {
        acc[key] = { 
          date: key,
          avgDetention: 0,
          totalOperations: 0,
          totalTime: 0,
          loading: 0,
          unloading: 0
        };
      }
      
      const duration = (new Date(det.departureTime).getTime() - new Date(det.arrivalTime).getTime()) / 60000;
      acc[key].totalTime += duration;
      acc[key].totalOperations += 1;
      acc[key].avgDetention = acc[key].totalTime / acc[key].totalOperations;
      acc[key].loading += (det.wagonType === "BOXNHL" ? 1 : 0);
      acc[key].unloading += (det.wagonType !== "BOXNHL" ? 1 : 0);
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(timeframeData);
  };

  if (isLoading) {
    return <div>Loading AI analysis...</div>;
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Pattern Analysis</h1>
        <div className="flex gap-4">
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select station" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stations</SelectItem>
              {stations.map(station => (
                <SelectItem key={station} value={station}>{station}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Our AI has analyzed {detentions?.length || 0} detention records
            {selectedStation !== 'all' ? ` for ${selectedStation}` : ''} and identified the following patterns:
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence>
          {patterns.slice(0, 3).map((pattern, index) => (
            <motion.div
              key={pattern.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className={`hover:shadow-lg cursor-pointer transform transition-all duration-200 ${
                  selectedPattern?.id === pattern.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedPattern(pattern)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {pattern.title}
                  </CardTitle>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {pattern.impact === "high" ? (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    ) : pattern.impact === "medium" ? (
                      <Activity className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-primary" />
                    )}
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mt-2">
                    {pattern.description}
                  </p>
                  <motion.div 
                    className="mt-4"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        Confidence: {pattern.confidence}%
                      </div>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${pattern.confidence}%` }}
                          transition={{ duration: 0.8, delay: index * 0.2 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {selectedPattern && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mt-6">
              <CardHeader>
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle>Pattern Analysis: {selectedPattern.title}</CardTitle>
                </motion.div>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="font-medium mb-2">Impact Analysis</h3>
                  <p className="text-muted-foreground">
                    {selectedPattern.description}
                  </p>
                </motion.div>

                <div>
                  <h3 className="font-medium mb-2">Recommendations</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {selectedPattern.recommendations.map((rec, index) => (
                      <motion.li
                        key={index}
                        className="text-muted-foreground"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        {rec}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Trend Analysis</h3>
                  <motion.div 
                    className="h-[300px]"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                            border: "none"
                          }}
                        />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="loading"
                          name="Loading Operations"
                          fill="#8884d8"
                          animationDuration={1500}
                          animationBegin={200}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="unloading"
                          name="Unloading Operations"
                          fill="#82ca9d"
                          animationDuration={1500}
                          animationBegin={400}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="avgDetention"
                          name="Avg Detention (min)"
                          fill="#ffc658"
                          animationDuration={1500}
                          animationBegin={600}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
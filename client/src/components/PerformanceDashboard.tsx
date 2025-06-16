import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  LineChart,
  Line,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Clock, Activity } from "lucide-react";
import type { SelectDetention } from "@db/schema";

interface PerformanceMetrics {
  totalOperations: number;
  avgLoadingTime: number;
  avgUnloadingTime: number;
  efficiencyScore: number;
}

interface PerformanceDashboardProps {
  detentions: SelectDetention[];
}

export function PerformanceDashboard({ detentions }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalOperations: 0,
    avgLoadingTime: 0,
    avgUnloadingTime: 0,
    efficiencyScore: 0,
  });

  const [timeframeData, setTimeframeData] = useState<any[]>([]);

  useEffect(() => {
    if (!detentions?.length) return;

    // Calculate metrics
    const loadingOperations = detentions.filter(d => d.wagonType === "BOXNHL");
    const unloadingOperations = detentions.filter(d => d.wagonType !== "BOXNHL");

    const calculateAvgTime = (operations: SelectDetention[]) => {
      if (!operations.length) return 0;
      return operations.reduce((sum, det) => 
        sum + (new Date(det.departureTime).getTime() - new Date(det.arrivalTime).getTime()),
        0
      ) / (operations.length * 60000); // Convert to minutes
    };

    const avgLoadingTime = calculateAvgTime(loadingOperations);
    const avgUnloadingTime = calculateAvgTime(unloadingOperations);

    // Calculate efficiency score (0-100)
    const targetLoadingTime = 120; // 2 hours target
    const targetUnloadingTime = 180; // 3 hours target
    const loadingEfficiency = Math.min(100, (targetLoadingTime / avgLoadingTime) * 100);
    const unloadingEfficiency = Math.min(100, (targetUnloadingTime / avgUnloadingTime) * 100);
    const efficiencyScore = (loadingEfficiency + unloadingEfficiency) / 2;

    setMetrics({
      totalOperations: detentions.length,
      avgLoadingTime,
      avgUnloadingTime,
      efficiencyScore: Math.round(efficiencyScore),
    });

    // Prepare timeframe data
    const timeData = detentions.reduce((acc: Record<string, any>, det) => {
      const date = new Date(det.arrivalTime).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          loading: 0,
          unloading: 0,
          avgTime: 0,
          totalTime: 0,
          count: 0,
        };
      }

      const duration = (new Date(det.departureTime).getTime() - new Date(det.arrivalTime).getTime()) / 60000;
      acc[date][det.wagonType === "BOXNHL" ? "loading" : "unloading"]++;
      acc[date].totalTime += duration;
      acc[date].count++;
      acc[date].avgTime = acc[date].totalTime / acc[date].count;

      return acc;
    }, {});

    setTimeframeData(Object.values(timeData));
  }, [detentions]);

  if (!detentions?.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <AnimatePresence>
        {/* Total Operations Card */}
        <motion.div
          key="total-operations"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Operations
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOperations}</div>
              <div className="text-xs text-muted-foreground">
                Operations processed
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading Time Card */}
        <motion.div
          key="loading-time"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Loading Time
              </CardTitle>
              <ArrowUpRight className={`h-4 w-4 ${
                metrics.avgLoadingTime > 180 ? 'text-destructive' : 'text-primary'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(metrics.avgLoadingTime)} min
              </div>
              <div className="text-xs text-muted-foreground">
                Average loading duration
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Unloading Time Card */}
        <motion.div
          key="unloading-time"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Unloading Time
              </CardTitle>
              <ArrowDownRight className={`h-4 w-4 ${
                metrics.avgUnloadingTime > 240 ? 'text-destructive' : 'text-primary'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(metrics.avgUnloadingTime)} min
              </div>
              <div className="text-xs text-muted-foreground">
                Average unloading duration
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Efficiency Score Card */}
        <motion.div
          key="efficiency-score"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Efficiency Score
              </CardTitle>
              <Clock className={`h-4 w-4 ${
                metrics.efficiencyScore > 80 ? 'text-primary' : 
                metrics.efficiencyScore > 60 ? 'text-yellow-500' : 'text-destructive'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.efficiencyScore}%</div>
              <div className="text-xs text-muted-foreground">
                Overall performance score
              </div>
              <motion.div 
                className="mt-4 h-2 bg-secondary rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.efficiencyScore}%` }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Charts Section */}
      <motion.div 
        className="md:col-span-2 lg:col-span-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeframeData}>
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
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="unloading"
                    name="Unloading Operations"
                    fill="#82ca9d"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="avgTime"
                    name="Avg Time (min)"
                    fill="#ffc658"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

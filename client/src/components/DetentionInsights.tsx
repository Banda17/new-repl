import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, Clock, Activity } from "lucide-react";
import type { SelectDetention } from "@db/schema";

interface DetentionPattern {
  stationId: string;
  wagonType: string;
  avgDetentionTime: number;
  confidence: number;
  metrics: {
    loading: number;
    unloading: number;
    total: number;
    avgDuration: number;
  };
  recommendations: string[];
}

interface DetentionInsightsProps {
  detentions: SelectDetention[];
}

export function DetentionInsights({ detentions }: DetentionInsightsProps) {
  const [patterns, setPatterns] = useState<DetentionPattern[]>([]);

  useEffect(() => {
    if (!detentions?.length) return;

    // Group detentions by station and wagon type
    interface GroupData {
      times: number[];
      total: number;
      count: number;
    }
    
    const groupedData: Record<string, GroupData> = {};
    
    detentions.forEach(detention => {
      const key = `${detention.stationId}-${detention.wagonType}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          times: [],
          total: 0,
          count: 0
        };
      }
      
      const detentionTime = 
        (new Date(detention.departureTime).getTime() - 
         new Date(detention.arrivalTime).getTime()) / (1000 * 60); // Convert to minutes
      
      groupedData[key].times.push(detentionTime);
      groupedData[key].total += detentionTime;
      groupedData[key].count += 1;
    });

    // Calculate patterns and anomalies
    const newPatterns: DetentionPattern[] = [];
    
    Object.entries(groupedData).forEach(([key, data]) => {
      const [stationId, wagonType] = key.split('-');
      const avgTime = data.total / data.count;
      
      // Calculate standard deviation
      const variance = data.times.reduce((acc, time) => 
        acc + Math.pow(time - avgTime, 2), 0) / data.count;
      const stdDev = Math.sqrt(variance);
      
      // Calculate confidence based on sample size and consistency
      const confidence = Math.min(
        ((data.count / 10) * (1 / (stdDev / avgTime))) * 100, 
        100
      );
      
      if (data.count >= 3) { // Only include patterns with sufficient data
        // Calculate loading/unloading metrics
        const metrics = {
          loading: data.times.filter(time => wagonType === "BOXNHL").length,
          unloading: data.times.filter(time => wagonType !== "BOXNHL").length,
          total: data.count,
          avgDuration: avgTime
        };

        // Generate recommendations based on the analysis
        const recommendations = [];
        if (avgTime > 180) {
          recommendations.push(`Consider optimizing ${stationId} station procedures for ${wagonType} handling`);
        } else if (stdDev > avgTime * 0.5) {
          recommendations.push(`High variability in processing times for ${wagonType} at ${stationId}`);
        } else {
          recommendations.push(`Maintain current efficient handling of ${wagonType} at ${stationId}`);
        }

        newPatterns.push({
          stationId,
          wagonType,
          avgDetentionTime: Math.round(avgTime),
          confidence: Math.round(confidence),
          metrics,
          recommendations
        });
      }
    });

    // Sort by confidence
    newPatterns.sort((a, b) => b.confidence - a.confidence);
    setPatterns(newPatterns.slice(0, 3)); // Show top 3 patterns
  }, [detentions]);

  if (!patterns.length) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Brain className="h-5 w-5 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence>
          <div className="space-y-4">
            {patterns.map((pattern, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border-l-4 border-primary p-4 bg-muted rounded-r-lg"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    Pattern for {pattern.stationId} - {pattern.wagonType}
                  </h4>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {pattern.avgDetentionTime > 180 ? (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    ) : pattern.avgDetentionTime > 120 ? (
                      <Activity className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-primary" />
                    )}
                  </motion.div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Average detention time: {pattern.avgDetentionTime} minutes
                </p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Loading: </span>
                    {pattern.metrics.loading}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Unloading: </span>
                    {pattern.metrics.unloading}
                  </div>
                </div>
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
                {pattern.recommendations && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="mt-2"
                  >
                    <div className="text-sm text-muted-foreground">
                      {pattern.recommendations[0]}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from "react";

export interface Alert {
  id: string;
  type: "warning" | "critical" | "info";
  message: string;
  timestamp: Date;
}

interface AlertThresholds {
  avgDetentionTime: number;
  activeOperations: number;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  avgDetentionTime: 120, // 2 hours in minutes
  activeOperations: 10,
};

export function useAlerts(metrics: {
  avgDetentionTime: number;
  activeOperations: number;
}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    const newAlerts: Alert[] = [];

    if (metrics.avgDetentionTime > thresholds.avgDetentionTime) {
      newAlerts.push({
        id: `detention-${Date.now()}`,
        type: "critical",
        message: `Average detention time (${Math.round(
          metrics.avgDetentionTime
        )} min) exceeds threshold (${thresholds.avgDetentionTime} min)`,
        timestamp: new Date(),
      });
    }

    if (metrics.activeOperations > thresholds.activeOperations) {
      newAlerts.push({
        id: `operations-${Date.now()}`,
        type: "warning",
        message: `High number of active operations (${
          metrics.activeOperations
        }/${thresholds.activeOperations})`,
        timestamp: new Date(),
      });
    }

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 5)); // Keep only the 5 most recent alerts
    }
  }, [metrics, thresholds]);

  return alerts;
}

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Alert } from "@/hooks/use-alerts";
import { format } from "date-fns";

interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center gap-2 p-4 rounded-lg ${
            alert.type === "critical"
              ? "bg-destructive/15 text-destructive"
              : alert.type === "warning"
              ? "bg-yellow-500/15 text-yellow-700"
              : "bg-blue-500/15 text-blue-700"
          }`}
        >
          {alert.type === "critical" ? (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          ) : alert.type === "warning" ? (
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Info className="h-5 w-5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-medium">{alert.message}</p>
            <p className="text-sm opacity-80">
              {format(alert.timestamp, "h:mm a")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

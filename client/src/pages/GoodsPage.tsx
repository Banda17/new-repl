import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SelectDetention } from "@db/schema";
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
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Package2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

interface YearlyWagonDistribution {
  [year: string]: { name: string; value: number }[];
}

export default function GoodsPage() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [yearlyStats, setYearlyStats] = useState<YearlyWagonDistribution>({});
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  const { data: detentions, isLoading, error } = useQuery<SelectDetention[]>({
    queryKey: ["/api/detentions"],
    onError: (err) => {
      console.error("Error fetching detentions:", err);
      toast({
        title: "Error",
        description: "Failed to load detention data. Please try again.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (!detentions || !Array.isArray(detentions)) {
      console.log("No detention data available:", detentions);
      return;
    }

    console.log("Processing detention data:", detentions.length, "records");

    try {
      // Group detentions by year
      const yearlyData: YearlyWagonDistribution = {};
      const years = new Set<string>();

      detentions.forEach(detention => {
        if (!detention.arrivalTime) return;

        const year = new Date(detention.arrivalTime).getFullYear().toString();
        years.add(year);

        if (!yearlyData[year]) {
          yearlyData[year] = [];
        }

        // Count wagons by type for each year
        const wagonCounts: { [type: string]: number } = {};
        detentions
          .filter(d => new Date(d.arrivalTime).getFullYear().toString() === year)
          .forEach(d => {
            const type = d.wagonType || 'Unknown';
            wagonCounts[type] = (wagonCounts[type] || 0) + 1;
          });

        yearlyData[year] = Object.entries(wagonCounts).map(([name, value]) => ({
          name,
          value,
        }));
      });

      const yearsList = Array.from(years).sort((a, b) => b.localeCompare(a));
      setAvailableYears(yearsList);
      setYearlyStats(yearlyData);

      // Set the most recent year as default
      if (yearsList.length > 0 && !selectedYear) {
        setSelectedYear(yearsList[0]);
      }

      console.log("Calculated yearly stats:", {
        years: yearsList,
        sampleData: yearlyData[yearsList[0]]
      });
    } catch (err) {
      console.error("Error processing detention data:", err);
      toast({
        title: "Error",
        description: "Failed to process detention data",
        variant: "destructive",
      });
    }
  }, [detentions, toast, selectedYear]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-red-500">
              Failed to load data. Please try refreshing the page.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Package2 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Goods Overview</h1>
      </div>

      {/* Year Selection */}
      <div className="w-[200px]">
        <Select
          value={selectedYear}
          onValueChange={setSelectedYear}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Wagon Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>
            Wagon Distribution {selectedYear ? `- ${selectedYear}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={selectedYear ? yearlyStats[selectedYear] : []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(selectedYear ? yearlyStats[selectedYear] : []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
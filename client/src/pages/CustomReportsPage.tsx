import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Download, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface FilteredData {
  periods: {
    current: string;
    previous: string;
  };
  data: Array<{
    commodity: string;
    currentPeriod: {
      commodity: string;
      rks: number;
      avgPerDay: number;
      wagons: number;
      tonnage: number;
      freight: number;
    };
    previousPeriod: {
      commodity: string;
      rks: number;
      avgPerDay: number;
      wagons: number;
      tonnage: number;
      freight: number;
    };
    changeInMT: number;
    changeInPercentage: number;
  }>;
}

interface StationFilteredData {
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
    variationUnits: number;
    variationPercent: number;
  }>;
}

export default function CustomReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  const [reportType, setReportType] = useState<string>("commodities");
  const [exportFormat, setExportFormat] = useState<string>("pdf");
  const [reportGenerated, setReportGenerated] = useState(false);

  // Query for filtered commodity data
  const { data: commodityData, isLoading: isLoadingCommodity, refetch: refetchCommodity } = useQuery<FilteredData>({
    queryKey: ['/api/custom-report-commodities', dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) {
        throw new Error("Date range is required");
      }
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      const response = await fetch(`/api/custom-report-commodities?from=${fromDate}&to=${toDate}`);
      if (!response.ok) {
        throw new Error("Failed to fetch commodity data");
      }
      return response.json();
    },
    enabled: false // Only fetch when explicitly triggered
  });

  // Query for filtered station data
  const { data: stationData, isLoading: isLoadingStation, refetch: refetchStation } = useQuery<StationFilteredData>({
    queryKey: ['/api/custom-report-stations', dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) {
        throw new Error("Date range is required");
      }
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      const response = await fetch(`/api/custom-report-stations?from=${fromDate}&to=${toDate}`);
      if (!response.ok) {
        throw new Error("Failed to fetch station data");
      }
      return response.json();
    },
    enabled: false // Only fetch when explicitly triggered
  });

  const handleGenerateReport = () => {
    if (!dateRange.from || !dateRange.to) {
      alert("Please select both start and end dates");
      return;
    }

    if (reportType === "commodities") {
      refetchCommodity();
    } else {
      refetchStation();
    }
    setReportGenerated(true);
  };

  const handleDownload = async () => {
    if (!dateRange.from || !dateRange.to) {
      alert("Please generate a report first");
      return;
    }

    const fromDate = format(dateRange.from, "yyyy-MM-dd");
    const toDate = format(dateRange.to, "yyyy-MM-dd");

    if (exportFormat === "pdf") {
      const endpoint = reportType === "commodities" 
        ? `/api/exports/custom-report-pdf?type=commodities&from=${fromDate}&to=${toDate}`
        : `/api/exports/custom-report-pdf?type=stations&from=${fromDate}&to=${toDate}`;
      
      window.open(endpoint, '_blank');
    } else {
      const endpoint = reportType === "commodities"
        ? `/api/exports/custom-report-csv?type=commodities&from=${fromDate}&to=${toDate}`
        : `/api/exports/custom-report-csv?type=stations&from=${fromDate}&to=${toDate}`;
      
      window.open(endpoint, '_blank');
    }
  };

  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatDecimal = (num: number, decimals: number = 3) => {
    return num.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Custom Reports</h1>
          <p className="text-gray-600">Generate custom reports for specific date ranges with export options</p>
        </div>

        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>
              Select date range and report type to generate custom filtered reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <DatePicker
                  date={dateRange.from}
                  setDate={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <DatePicker
                  date={dateRange.to}
                  setDate={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                />
              </div>
            </div>

            {/* Report Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commodities">Commodity Analysis</SelectItem>
                    <SelectItem value="stations">Station Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select export format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                    <SelectItem value="csv">CSV Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleGenerateReport}
                className="flex items-center gap-2"
                disabled={!dateRange.from || !dateRange.to}
              >
                <Search className="h-4 w-4" />
                Generate Report
              </Button>
              <Button 
                onClick={handleDownload}
                variant="outline"
                className="flex items-center gap-2"
                disabled={!reportGenerated || (!commodityData && !stationData)}
              >
                <Download className="h-4 w-4" />
                Download {exportFormat.toUpperCase()}
              </Button>
            </div>

            {/* Date Range Summary */}
            {dateRange.from && dateRange.to && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  Report Period: <Badge variant="secondary">
                    {format(dateRange.from, "dd/MM/yyyy")} to {format(dateRange.to, "dd/MM/yyyy")}
                  </Badge>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportGenerated && (
          <Card>
            <CardHeader>
              <CardTitle>Report Results</CardTitle>
              <CardDescription>
                {reportType === "commodities" ? "Commodity Analysis" : "Station Analysis"} for selected date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportType === "commodities" && commodityData && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Period: {commodityData.periods.current} vs {commodityData.periods.previous}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">Commodity</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Current Rks</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Avg/Day</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Wagons</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Compare Rks</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Avg/Day</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Wagons</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Variation MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Variation %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commodityData.data.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{item.commodity}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.currentPeriod?.rks || 0}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.currentPeriod?.avgPerDay || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatNumber(item.currentPeriod?.wagons || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.currentPeriod?.tonnage || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.previousPeriod?.rks || 0}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.previousPeriod?.avgPerDay || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatNumber(item.previousPeriod?.wagons || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.previousPeriod?.tonnage || 0)}</td>
                            <td className={`border border-gray-300 px-3 py-2 text-sm text-center ${(item.changeInMT || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatDecimal(item.changeInMT || 0)}
                            </td>
                            <td className={`border border-gray-300 px-3 py-2 text-sm text-center ${(item.changeInPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatDecimal(item.changeInPercentage || 0, 2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportType === "stations" && stationData && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Period: {stationData.periods.current} vs {stationData.periods.previous}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">Station</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Current Rks</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Avg/Day</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Wagons</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Compare Rks</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Avg/Day</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Wagons</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Variation MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">Variation %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stationData.data.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{item.station || 'N/A'}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.currentRks || 0}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.currentAvgPerDay || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatNumber(item.currentWagon || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.currentMT || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.compareRks || 0}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.compareAvgPerDay || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatNumber(item.compareWagon || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.compareMT || 0)}</td>
                            <td className={`border border-gray-300 px-3 py-2 text-sm text-center ${(item.variationUnits || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatDecimal(item.variationUnits || 0)}
                            </td>
                            <td className={`border border-gray-300 px-3 py-2 text-sm text-center ${(item.variationPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatDecimal(item.variationPercent || 0, 2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(isLoadingCommodity || isLoadingStation) && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Generating report...</p>
                </div>
              )}

              {!isLoadingCommodity && !isLoadingStation && reportGenerated && !commodityData && !stationData && (
                <div className="text-center py-8">
                  <div className="text-yellow-600 mb-2">⚠️</div>
                  <p className="text-gray-600">No data found for the selected date range.</p>
                  <p className="text-sm text-gray-500 mt-1">Try selecting a different date range or report type.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
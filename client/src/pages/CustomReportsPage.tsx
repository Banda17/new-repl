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
import { ExportWizard } from "@/components/ExportWizard";

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
    currentRks: number;
    currentAvgDay: number;
    currentWagon: number;
    currentMT: number;
    currentFreight: number;
    compareRks: number;
    compareAvgDay: number;
    compareWagon: number;
    compareMT: number;
    compareFreight: number;
    variationUnits: number;
    variationPercent: number;
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



  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  // Export wizard function
  const handleExport = async (format: string, selectedColumns: string[], data: any[]) => {
    if (!dateRange.from || !dateRange.to) {
      alert("Please generate a report first");
      return;
    }

    const fromDate = dateRange.from.toISOString().split('T')[0];
    const toDate = dateRange.to.toISOString().split('T')[0];

    if (format === 'pdf') {
      // Use the new custom export PDF endpoint with column selection
      const reportTitle = `${reportType === "commodities" ? "Commodity" : "Station"} Analysis Report (${fromDate} to ${toDate})`;
      
      try {
        const response = await fetch('/api/exports/custom-export-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: data,
            columns: selectedColumns,
            reportTitle: reportTitle,
            reportType: reportType
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `custom-${reportType}-export-${Date.now()}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          console.error('PDF export failed');
          alert('Failed to generate PDF export');
        }
      } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error occurred while exporting PDF');
      }
    } else if (format === 'csv') {
      const endpoint = reportType === "commodities"
        ? `/api/exports/custom-report-csv?type=commodities&from=${fromDate}&to=${toDate}`
        : `/api/exports/custom-report-csv?type=stations&from=${fromDate}&to=${toDate}`;
      
      window.open(endpoint, '_blank');
    } else if (format === 'json') {
      // Handle JSON export by downloading the data directly
      const jsonData = {
        exportInfo: {
          title: `${reportType === "commodities" ? "Commodity" : "Station"} Analysis Report`,
          dateRange: `${fromDate} to ${toDate}`,
          exportedAt: new Date().toISOString(),
          selectedColumns: selectedColumns
        },
        data: data.map(item => {
          const filtered: any = {};
          selectedColumns.forEach(col => {
            filtered[col] = item[col];
          });
          return filtered;
        })
      };
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `custom-${reportType}-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  // Define columns for export wizard
  const getCommodityColumns = () => [
    { key: 'commodity', label: 'Commodity' },
    { key: 'currentRks', label: 'Current RKs' },
    { key: 'currentAvgDay', label: 'Current Avg/Day' },
    { key: 'currentWagon', label: 'Current Wagons' },
    { key: 'currentMT', label: 'Current MT' },
    { key: 'compareRks', label: 'Previous RKs' },
    { key: 'compareAvgDay', label: 'Previous Avg/Day' },
    { key: 'compareWagon', label: 'Previous Wagons' },
    { key: 'compareMT', label: 'Previous MT' },
    { key: 'variationUnits', label: 'Variation Units' },
    { key: 'variationPercent', label: 'Variation %' }
  ];

  const getStationColumns = () => [
    { key: 'station', label: 'Station' },
    { key: 'currentRks', label: 'Current RKs' },
    { key: 'currentAvgPerDay', label: 'Current Avg/Day' },
    { key: 'currentWagon', label: 'Current Wagons' },
    { key: 'currentMT', label: 'Current MT' },
    { key: 'compareRks', label: 'Previous RKs' },
    { key: 'compareAvgPerDay', label: 'Previous Avg/Day' },
    { key: 'compareWagon', label: 'Previous Wagons' },
    { key: 'compareMT', label: 'Previous MT' },
    { key: 'variationUnits', label: 'Variation Units' },
    { key: 'variationPercent', label: 'Variation %' }
  ];

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
              
              {/* Export Wizard */}
              {reportGenerated && (commodityData || stationData) && (
                <ExportWizard
                  data={reportType === "commodities" ? (commodityData?.data || []) : (stationData?.data || [])}
                  columns={reportType === "commodities" ? getCommodityColumns() : getStationColumns()}
                  onExport={handleExport}
                  trigger={
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export Data
                    </Button>
                  }
                />
              )}
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
                          <th className="border border-gray-300 px-3 py-1 text-center text-xs font-medium text-gray-700 bg-gray-100" rowSpan={2}>Commodity</th>
                          <th className="border border-gray-300 px-3 py-1 text-center text-xs font-medium text-white bg-blue-600" colSpan={4}>Current Period: {commodityData.periods.current}</th>
                          <th className="border border-gray-300 px-3 py-1 text-center text-xs font-medium text-white bg-green-600" colSpan={4}>Previous Period: {commodityData.periods.previous}</th>
                          <th className="border border-gray-300 px-3 py-1 text-center text-xs font-medium text-white bg-orange-600" colSpan={2}>Variation</th>
                        </tr>
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-blue-600">Rks</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-blue-600">Avg/Day</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-blue-600">Wagons</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-blue-600">MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-green-600">Rks</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-green-600">Avg/Day</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-green-600">Wagons</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-green-600">MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-orange-600">MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-orange-600">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commodityData.data.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{item.commodity}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.currentRks || 0}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.currentAvgDay || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatNumber(item.currentWagon || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal((item.currentMT || 0) / 1000)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.compareRks || 0}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.compareAvgDay || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatNumber(item.compareWagon || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal((item.compareMT || 0) / 1000)}</td>
                            <td className={`border border-gray-300 px-3 py-2 text-sm text-center ${(item.variationUnits || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatDecimal((item.variationUnits || 0) / 1000)}
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

              {reportType === "stations" && stationData && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Period: {stationData.periods.current} vs {stationData.periods.previous}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-3 py-1 text-center text-xs font-medium text-gray-700 bg-gray-100" rowSpan={2}>Station</th>
                          <th className="border border-gray-300 px-3 py-1 text-center text-xs font-medium text-white bg-blue-600" colSpan={4}>Current Period: {stationData.periods.current}</th>
                          <th className="border border-gray-300 px-3 py-1 text-center text-xs font-medium text-white bg-green-600" colSpan={4}>Previous Period: {stationData.periods.previous}</th>
                          <th className="border border-gray-300 px-3 py-1 text-center text-xs font-medium text-white bg-orange-600" colSpan={2}>Variation</th>
                        </tr>
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-blue-600">Rks</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-blue-600">Avg/Day</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-blue-600">Wagons</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-blue-600">MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-green-600">Rks</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-green-600">Avg/Day</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-green-600">Wagons</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-green-600">MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-orange-600">MT</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-white bg-orange-600">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stationData.data.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{item.station || 'N/A'}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.currentRks || 0}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.currentAvgPerDay || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatNumber(item.currentWagon || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal((item.currentMT || 0) / 1000)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.compareRks || 0}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal(item.compareAvgPerDay || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatNumber(item.compareWagon || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm text-center">{formatDecimal((item.compareMT || 0) / 1000)}</td>
                            <td className={`border border-gray-300 px-3 py-2 text-sm text-center ${(item.variationUnits || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatDecimal((item.variationUnits || 0) / 1000)}
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
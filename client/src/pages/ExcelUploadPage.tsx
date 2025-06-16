import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2, XCircle, Download, Eye, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UploadedRecord {
  id?: number;
  pDate?: string;
  station?: string;
  siding?: string;
  imported?: string;
  commodity?: string;
  commType?: string;
  commCg?: string;
  demand?: string;
  state?: string;
  rly?: string;
  wagons?: number;
  type?: string;
  units?: number;
  loadingType?: string;
  rrNoFrom?: number;
  rrNoTo?: number;
  rrDate?: string;
  tonnage?: number;
  freight?: number;
  tIndents?: number;
  osIndents?: number;
}

interface ValidationResult {
  success: boolean;
  errors?: string[];
  validRows: number;
  totalRows: number;
  previewData?: UploadedRecord[];
  duplicates?: number;
  dateFilteredOut?: number;
}

export default function ExcelUploadPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importComplete, setImportComplete] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile && !selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Invalid File",
        description: "Please select an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }
    setFile(selectedFile);
    setValidationResult(null);
    setImportComplete(false);
  };

  const validateFile = async () => {
    if (!file) return;

    if (!fromDate || !toDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both from and to dates",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fromDate", fromDate.toISOString());
      formData.append("toDate", toDate.toISOString());

      const response = await fetch("/api/railway-operations/validate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Validation failed");
      }

      const result = await response.json();
      setValidationResult(result);

      if (result.success) {
        toast({
          title: "Validation Successful",
          description: `${result.validRows} of ${result.totalRows} rows are valid`,
        });
      } else {
        toast({
          title: "Validation Issues Found",
          description: `${result.errors?.length || 0} errors detected`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to validate the Excel file",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const directImport = async () => {
    if (!file) return;

    setImporting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/railway-operations/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Import failed");
      }

      const result = await response.json();
      setUploadProgress(100);
      setImportComplete(true);

      toast({
        title: "Import Successful",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Failed to import the Excel file",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "P DATE", "STATION", "SIDING", "IMPORTED", "COMMODITY", "COMM TYPE", 
      "COMM CG", "DEMAND", "STATE", "RLY", "WAGONS", "TYPE", "UNITS", 
      "LOADING TYPE", "RR NO FROM", "RR NO TO", "RR DATE", "TONNAGE", 
      "FREIGHT", "T_INDENTS", "O/S INDENTS"
    ];

    const sampleRow = [
      "2025-01-30", "COA/CFL", "MAIN", "LOCAL", "FERT.", "BULK", 
      "A", "HIGH", "AP", "SCR", "42", "COVERED", "105", 
      "MECHANICAL", "12345", "12387", "2025-01-30", "2699", 
      "4269311", "5", "2"
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'railway-operations-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Template Downloaded",
      description: "Use this template to format your data correctly",
    });
  };

  const reset = () => {
    setFile(null);
    setValidationResult(null);
    setImportComplete(false);
    setUploadProgress(0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Excel Data Upload</h1>
          <p className="text-muted-foreground">
            Upload railway loading operations data from Excel files
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Data Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Valid Data Format Guide
          </CardTitle>
          <CardDescription>
            Your Excel file should contain these columns with the specified data formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Date Fields</h4>
                <ul className="text-xs space-y-1">
                  <li><strong>P DATE:</strong> Excel date format or dd-mm-yyyy</li>
                  <li><strong>RR DATE:</strong> Excel date format or dd-mm-yyyy</li>
                  <li className="text-blue-600">Excel automatically converts dates to numbers</li>
                </ul>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Numeric Fields</h4>
                <ul className="text-xs space-y-1">
                  <li><strong>WAGONS:</strong> Whole numbers (e.g., 42)</li>
                  <li><strong>UNITS:</strong> Whole numbers (e.g., 105)</li>
                  <li><strong>TONNAGE:</strong> Decimal numbers (e.g., 2699.5)</li>
                  <li><strong>FREIGHT:</strong> Decimal numbers (e.g., 4269311.25)</li>
                </ul>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Text Fields</h4>
                <ul className="text-xs space-y-1">
                  <li><strong>STATION:</strong> Station code</li>
                  <li><strong>COMMODITY:</strong> Material type</li>
                  <li><strong>TYPE:</strong> Wagon type</li>
                  <li><strong>All other fields:</strong> Text values</li>
                </ul>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Notes</AlertTitle>
              <AlertDescription className="space-y-2">
                <div>• <strong>P DATE is required</strong> - all other columns can be blank</div>
                <div>• Date format must be dd-mm-yyyy (day-month-year)</div>
                <div>• File size limit: 50MB</div>
                <div>• Supported formats: .xlsx, .xls</div>
                <div>• Only data within your selected date range will be imported</div>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 text-blue-900">Example Valid Row:</h4>
              <div className="text-xs font-mono bg-white p-2 rounded border overflow-x-auto">
                <div>P DATE: 15-01-2025 | STATION: COA/CFL | COMMODITY: FERT. | WAGONS: 42 | TONNAGE: 2699.5</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Direct Import Option */}
      {file && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Quick Import</CardTitle>
            <CardDescription className="text-green-700">
              Import all data with P DATE directly without validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={directImport}
              disabled={importing}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {importing ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Importing All Data...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import All Data (Skip Validation)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date Range (Optional)</CardTitle>
          <CardDescription>
            For validation and filtered import only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                    disabled={(date) => fromDate ? date < fromDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {fromDate && toDate && (
            <div className="text-sm text-muted-foreground">
              Selected range: {format(fromDate, "dd/MM/yyyy")} - {format(toDate, "dd/MM/yyyy")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
          <CardDescription>
            Select an Excel file (.xlsx or .xls) containing railway operations data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            {file && (
              <Badge variant="secondary">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {file.name}
              </Badge>
            )}
          </div>

          {file && !validationResult && (
            <Button onClick={validateFile} disabled={validating} className="w-full">
              {validating ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Validate & Preview Data
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{validationResult.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{validationResult.validRows}</div>
                <div className="text-sm text-muted-foreground">Valid Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{validationResult.errors?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{validationResult.duplicates || 0}</div>
                <div className="text-sm text-muted-foreground">Duplicates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{validationResult.dateFilteredOut || 0}</div>
                <div className="text-sm text-muted-foreground">Date Filtered</div>
              </div>
            </div>

            {validationResult.errors && validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {validationResult.errors.length > 5 && (
                      <li>... and {validationResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.success && (
              <div className="space-y-4">
                <Button onClick={directImport} disabled={importing} className="w-full" size="lg">
                  {importing ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-pulse" />
                      Importing Data...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {validationResult.validRows} Records
                    </>
                  )}
                </Button>

                {importing && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Importing data... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {validationResult?.previewData && validationResult.previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>
              Preview of the first 10 records from your Excel file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Wagons</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Tonnage</TableHead>
                    <TableHead>Freight</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResult.previewData.slice(0, 10).map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {record.pDate ? format(new Date(record.pDate), 'dd-MM-yyyy') : '-'}
                      </TableCell>
                      <TableCell>{record.station || '-'}</TableCell>
                      <TableCell>{record.commodity || '-'}</TableCell>
                      <TableCell>{record.wagons || 0}</TableCell>
                      <TableCell>{record.units || 0}</TableCell>
                      <TableCell>{record.tonnage || 0}</TableCell>
                      <TableCell>₹{record.freight?.toLocaleString() || 0}</TableCell>
                      <TableCell>{record.type || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {validationResult.previewData.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                ... and {validationResult.previewData.length - 10} more records
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {importComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Import Completed Successfully</h3>
                <p className="text-green-700">
                  Your railway operations data has been successfully imported into the database.
                </p>
              </div>
              <Button onClick={reset} variant="outline">
                Upload Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Excel File Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Required Columns</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• P DATE (Date format: YYYY-MM-DD)</li>
                <li>• STATION (Station code/name)</li>
                <li>• COMMODITY (Commodity type)</li>
                <li>• WAGONS (Number of wagons)</li>
                <li>• UNITS (Units loaded)</li>
                <li>• TONNAGE (Weight in tons)</li>
                <li>• FREIGHT (Freight amount)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Optional Columns</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• SIDING (Siding information)</li>
                <li>• COMM TYPE (Commodity type)</li>
                <li>• STATE (State code)</li>
                <li>• RLY (Railway code)</li>
                <li>• TYPE (Wagon type)</li>
                <li>• RR NO FROM/TO (RR numbers)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, AlertCircle, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

// Sample data structure
const sampleData = [
  {
    stationId: "RNGK",
    rakeId: "12345",
    rakeName: "Sample Rake",
    wagonType: "BOXNHL",
    operationType: "loading",
    requiresTXR: "FALSE",
    arrivalDateTime: "22-01-2025 10:00",
    placementDateTime: "22-01-2025 11:00",
    releaseDateTime: "22-01-2025 14:00",
    departureDateTime: "22-01-2025 15:00",
    arPlReason: "", // Can be blank
    plRlReason: "", // Can be blank
    rlDpReason: "", // Can be blank
    remarks: "" // Can be blank
  }
];

type ValidationResult = {
  success: boolean;
  errors?: string[];
  validRows: number;
  totalRows: number;
  previewData?: any[];
};

export default function DataUploadPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && !selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Invalid File",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }
    setFile(selectedFile || null);
    setValidationResult(null);
    setUploadProgress(0);
  };

  const handleValidate = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to validate",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/validate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      setValidationResult(result);

      toast({
        title: result.success ? "Validation Successful" : "Validation Failed",
        description: result.success
          ? `${result.validRows} of ${result.totalRows} rows are valid`
          : `Found ${result.errors?.length} errors in the data`,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file || !validationResult?.success) {
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();

      toast({
        title: "Import Successful",
        description: `Imported ${result.importedCount} of ${result.totalRows} records`,
      });

      // Reset the form
      setFile(null);
      setValidationResult(null);
      setUploadProgress(0);

      if (result.importedCount < result.totalRows) {
        toast({
          title: "Warning",
          description: `${result.totalRows - result.importedCount} records failed to import`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Data Upload Instructions
          </CardTitle>
          <CardDescription>
            Follow these instructions to upload your detention data from Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Steps to Upload Data:</h3>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Prepare your Excel file according to the structure shown below</li>
              <li>Ensure all required fields are filled with valid data</li>
              <li>Save your Excel file in .xlsx or .xls format</li>
              <li>Upload the file using the form below</li>
              <li>Review validation results before confirming import</li>
            </ol>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Notes</AlertTitle>
            <AlertDescription className="mt-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Dates should be in DD-MM-YYYY HH:mm format</li>
                <li>Station IDs must match the system's station list</li>
                <li>Wagon types must be one of the predefined types</li>
                <li>Reason fields and remarks can be left blank</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div>
            <h3 className="text-lg font-semibold mb-4">Expected Data Structure:</h3>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Example</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(sampleData[0]).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell>{value.toString()}</TableCell>
                      <TableCell>
                        {key.includes("DateTime") ? "DD-MM-YYYY HH:mm format" : 
                         key === "stationId" ? "Must match system station list" :
                         key === "wagonType" ? "Must be valid wagon type" :
                         key.includes("Reason") || key === "remarks" ? "Optional field - can be left blank" : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold">Upload Your Data:</h3>
            <div className="flex flex-col gap-4">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />

              <div className="flex gap-4">
                <Button 
                  onClick={handleValidate}
                  disabled={!file || validating}
                  className="flex-1"
                >
                  {validating ? "Validating..." : "Validate File"}
                  {!validating && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                {validationResult?.success && (
                  <Button 
                    onClick={handleImport}
                    disabled={importing}
                    className="flex-1"
                  >
                    {importing ? "Importing..." : "Import Data"}
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>

              {validationResult && (
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    {validationResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <h4 className="font-semibold">
                      {validationResult.success ? "Validation Successful" : "Validation Failed"}
                    </h4>
                  </div>

                  <Progress 
                    value={(validationResult.validRows / validationResult.totalRows) * 100} 
                    className="h-2"
                  />

                  <p className="text-sm text-muted-foreground">
                    {validationResult.validRows} of {validationResult.totalRows} rows are valid
                  </p>

                  {validationResult.errors && validationResult.errors.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h5 className="font-semibold">Validation Errors:</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                        {validationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validationResult.previewData && (
                    <div className="mt-4">
                      <h5 className="font-semibold mb-2">Preview of Valid Data:</h5>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(validationResult.previewData[0]).map((key) => (
                                <TableHead key={key}>{key}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {validationResult.previewData.map((row, i) => (
                              <TableRow key={i}>
                                {Object.values(row).map((value: any, j) => (
                                  <TableCell key={j}>{value}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
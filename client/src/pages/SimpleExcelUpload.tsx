import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SimpleExcelUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportComplete(false);
      setImportResult(null);
    }
  };

  const directImport = async () => {
    if (!file) return;

    setImporting(true);

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
      setImportComplete(true);
      setImportResult(result);

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Excel Data Import</h1>
        <p className="text-muted-foreground">
          Upload your Excel file to import railway loading operations data
        </p>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Select Excel File</CardTitle>
          <CardDescription>
            Choose an Excel file (.xlsx) containing railway loading operations data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Excel File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
            />
          </div>

          {file && (
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle>File Selected</AlertTitle>
              <AlertDescription>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Import Button */}
      {file && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Import Data</CardTitle>
            <CardDescription className="text-green-700">
              Import all rows with P DATE field from your Excel file
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
                  Importing Data...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importComplete && importResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-green-700">{importResult.message}</p>
              {importResult.importedCount && (
                <p className="text-sm text-green-600">
                  Successfully imported {importResult.importedCount} records
                </p>
              )}
              {importResult.errorCount && importResult.errorCount > 0 && (
                <p className="text-sm text-orange-600">
                  {importResult.errorCount} records had errors and were skipped
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Data Format Requirements</CardTitle>
          <CardDescription>
            Your Excel file should contain the following columns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Required Field</h4>
              <ul className="text-xs space-y-1">
                <li><strong>P DATE:</strong> Excel date format (required)</li>
              </ul>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Station Fields</h4>
              <ul className="text-xs space-y-1">
                <li><strong>STATION:</strong> Station code</li>
                <li><strong>SIDING:</strong> Siding information</li>
              </ul>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Cargo Fields</h4>
              <ul className="text-xs space-y-1">
                <li><strong>COMMODITY:</strong> Cargo type</li>
                <li><strong>WAGONS:</strong> Number of wagons</li>
                <li><strong>TONNAGE:</strong> Weight in tons</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
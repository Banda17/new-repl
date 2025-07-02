import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import * as z from "zod";
import { Download, FileDown } from "lucide-react";

// Define the form schema
const exportFormSchema = z.object({
  format: z.enum(["csv", "json", "excel", "pdf"]),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }),
  columns: z.array(z.string()),
  includeMetadata: z.boolean().default(true),
});

type ExportFormValues = z.infer<typeof exportFormSchema>;

interface Column {
  key: string;
  label: string;
}

interface ExportWizardProps {
  data: any[];
  columns: Column[];
  onExport: (format: string, selectedColumns: string[], data: any[]) => void;
  trigger?: React.ReactNode;
}

export function ExportWizard({ data, columns, onExport, trigger }: ExportWizardProps) {
  const [open, setOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      format: "csv",
      columns: columns.map(col => col.key),
      includeMetadata: true,
    },
  });

  const handleExport = (values: ExportFormValues) => {
    const selectedColumns = values.columns;
    const exportFormat = values.format;
    
    // Filter data based on selected columns
    const filteredData = data.map(item => {
      const filtered: any = {};
      selectedColumns.forEach(col => {
        filtered[col] = item[col];
      });
      return filtered;
    });

    // Add metadata if requested
    if (values.includeMetadata) {
      filteredData.forEach(item => {
        item._exported_at = format(new Date(), "yyyy-MM-dd HH:mm:ss");
      });
    }

    onExport(exportFormat, selectedColumns, filteredData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Export Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Customize your data export by selecting the format and columns you want to include.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleExport)} className="space-y-6">
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Export Format</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the format for your exported data.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="columns"
              render={() => (
                <FormItem>
                  <FormLabel>Columns to Export</FormLabel>
                  <FormDescription>
                    Select the columns you want to include in the export.
                  </FormDescription>
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-4">
                      {columns.map((column) => (
                        <FormField
                          key={column.key}
                          control={form.control}
                          name="columns"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={column.key}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(column.key)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, column.key])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== column.key
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {column.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeMetadata"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Include Metadata
                    </FormLabel>
                    <FormDescription>
                      Add export timestamp and other metadata to the exported file.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

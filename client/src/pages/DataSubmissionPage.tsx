import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const detentionSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  rakeId: z.string().min(1, "Rake ID is required"),
  rakeName: z.string().min(1, "Rake Name is required"),
  wagonType: z.string().min(1, "Wagon Type is required"),
  arrivalTime: z.string().min(1, "Arrival Time is required"),
  placementTime: z.string().min(1, "Placement Time is required"),
  releaseTime: z.string().min(1, "Release Time is required"),
  departureTime: z.string().min(1, "Departure Time is required"),
  arPlReason: z.string().optional(),
  plRlReason: z.string().optional(),
  rlDpReason: z.string().optional(),
  remarks: z.string().optional(),
});

type DetentionFormData = z.infer<typeof detentionSchema>;

export default function DataSubmissionPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DetentionFormData>({
    resolver: zodResolver(detentionSchema),
    defaultValues: {
      stationId: "",
      rakeId: "",
      rakeName: "",
      wagonType: "",
      arrivalTime: "",
      placementTime: "",
      releaseTime: "",
      departureTime: "",
      arPlReason: "",
      plRlReason: "",
      rlDpReason: "",
      remarks: "",
    },
  });

  const onSubmit = async (data: DetentionFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/external/detentions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([data]), // Wrap in array as API expects array
      });

      if (!response.ok) {
        throw new Error("Failed to submit data");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Data submitted successfully",
      });

      // Reset form after successful submission
      form.reset();
    } catch (error) {
      console.error("Error submitting data:", error);
      toast({
        title: "Error",
        description: "Failed to submit data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Submit Detention Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="stationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Station ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rakeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rake ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rakeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rake Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wagonType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wagon Type</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="arrivalTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="placementTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placement Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="releaseTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="arPlReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival to Placement Reason</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plRlReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placement to Release Reason</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rlDpReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release to Departure Reason</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Data"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

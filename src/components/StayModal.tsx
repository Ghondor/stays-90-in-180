import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CountryCombobox } from "@/components/CountryCombobox";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useStays } from "@/hooks/useStays";
import type { Stay } from "@/lib/rule90-180";

const staySchema = z.object({
  country: z.string().min(1, "Please select a country."),
  dateRange: z
    .object({
      from: z.date({ error: "Please pick an entry date." }),
      to: z.date({ error: "Please pick an exit date." }),
    })
    .refine((r) => r.to >= r.from, {
      message: "Exit date must be on or after entry date.",
      path: ["to"],
    }),
});

type StayFormValues = z.infer<typeof staySchema>;

interface StayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, modal is in edit mode for this stay. */
  editingStay?: Stay | null;
}

export function StayModal({ open, onOpenChange, editingStay }: StayModalProps) {
  const { addStay, editStay } = useStays();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!editingStay;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StayFormValues>({
    resolver: zodResolver(staySchema),
    defaultValues: {
      country: "",
      dateRange: { from: undefined as unknown as Date, to: undefined as unknown as Date },
    },
  });

  // When the modal opens with an editing stay, populate the form
  useEffect(() => {
    if (open && editingStay) {
      reset({
        country: editingStay.country,
        dateRange: {
          from: parseISO(editingStay.entryDate),
          to: parseISO(editingStay.exitDate),
        },
      });
    } else if (open && !editingStay) {
      reset({
        country: "",
        dateRange: { from: undefined as unknown as Date, to: undefined as unknown as Date },
      });
    }
  }, [open, editingStay, reset]);

  const onSubmit = async (data: StayFormValues) => {
    setSubmitting(true);
    try {
      const fields = {
        country: data.country,
        entryDate: format(data.dateRange.from, "yyyy-MM-dd"),
        exitDate: format(data.dateRange.to, "yyyy-MM-dd"),
      };

      if (isEdit) {
        await editStay(editingStay.id, fields);
      } else {
        await addStay(fields);
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save stay:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Extract nested error for dateRange
  const dateRangeError =
    errors.dateRange?.message ||
    errors.dateRange?.from?.message ||
    errors.dateRange?.to?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit stay" : "Add stay"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this stay."
              : "Record a new entry/exit for a country."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Country</Label>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <CountryCombobox value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Stay dates</Label>
            <Controller
              name="dateRange"
              control={control}
              render={({ field }) => (
                <DateRangePicker
                  value={field.value as DateRange | undefined}
                  onChange={(range) => {
                    field.onChange({
                      from: range?.from,
                      to: range?.to,
                    });
                  }}
                  placeholder="Select entry & exit dates"
                />
              )}
            />
            {dateRangeError && (
              <p className="text-sm text-destructive">{dateRangeError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEdit
                ? "Save changes"
                : "Add stay"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

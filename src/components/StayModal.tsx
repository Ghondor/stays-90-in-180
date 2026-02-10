import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
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
import { DatePicker } from "@/components/DatePicker";
import { useStays } from "@/context/StaysContext";
import type { Stay } from "@/lib/rule90-180";

const staySchema = z
  .object({
    country: z.string().min(1, "Please select a country."),
    entryDate: z.date({ required_error: "Please pick an entry date." }),
    exitDate: z.date({ required_error: "Please pick an exit date." }),
  })
  .refine((data) => data.exitDate >= data.entryDate, {
    message: "Exit date must be on or after entry date.",
    path: ["exitDate"],
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
    defaultValues: { country: "", entryDate: undefined, exitDate: undefined },
  });

  // When the modal opens with an editing stay, populate the form
  useEffect(() => {
    if (open && editingStay) {
      reset({
        country: editingStay.country,
        entryDate: parseISO(editingStay.entryDate),
        exitDate: parseISO(editingStay.exitDate),
      });
    } else if (open && !editingStay) {
      reset({ country: "", entryDate: undefined, exitDate: undefined });
    }
  }, [open, editingStay, reset]);

  const onSubmit = async (data: StayFormValues) => {
    setSubmitting(true);
    try {
      const fields = {
        country: data.country,
        entryDate: format(data.entryDate, "yyyy-MM-dd"),
        exitDate: format(data.exitDate, "yyyy-MM-dd"),
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
            <Label>Entry date</Label>
            <Controller
              name="entryDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Entry date"
                />
              )}
            />
            {errors.entryDate && (
              <p className="text-sm text-destructive">{errors.entryDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Exit date</Label>
            <Controller
              name="exitDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Exit date"
                />
              )}
            />
            {errors.exitDate && (
              <p className="text-sm text-destructive">{errors.exitDate.message}</p>
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

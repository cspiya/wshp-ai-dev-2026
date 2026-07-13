"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { workshopInputSchema, type Workshop, type WorkshopInput } from "../domain/workshop";

/**
 * The form validates with the SAME Zod schema the server validates with —
 * only the `date` field differs: <input type="datetime-local"> yields a
 * timezone-less "YYYY-MM-DDTHH:mm" string, converted to full ISO on submit.
 */
const formSchema = workshopInputSchema.extend({
  date: z.string().min(1, "Date is required"),
});

type FormValues = z.infer<typeof formSchema>;

/** UTC ISO (the read-side shape all adapters return) → local "YYYY-MM-DDTHH:mm". */
function toDatetimeLocal(value: string): string {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function WorkshopForm({
  initial,
  submitLabel,
  submitting,
  submitError,
  onSubmit,
  onCancel,
}: {
  initial?: Workshop;
  submitLabel: string;
  submitting: boolean;
  submitError?: string;
  onSubmit: (input: WorkshopInput) => void;
  onCancel: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? { ...initial, date: toDatetimeLocal(initial.date) }
      : { title: "", description: "", date: "", location: "", listPriceHuf: 0, capacity: 1 },
  });

  const { errors } = form.formState;

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({ ...values, date: new Date(values.date).toISOString() }),
      )}
    >
      <div className="space-y-2">
        <Label htmlFor="title" className="micro-label">Title</Label>
        <Input id="title" className="bg-white" {...form.register("title")} />
        {errors.title && <p role="alert" className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="micro-label">Description</Label>
        <Textarea id="description" className="bg-white" {...form.register("description")} />
        {errors.description && (
          <p role="alert" className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date" className="micro-label">Date</Label>
          <Input id="date" type="datetime-local" className="bg-white" {...form.register("date")} />
          {errors.date && <p role="alert" className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location" className="micro-label">Location</Label>
          <Input id="location" className="bg-white" {...form.register("location")} />
          {errors.location && (
            <p role="alert" className="text-sm text-destructive">{errors.location.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="listPriceHuf" className="micro-label">List price (HUF)</Label>
          <Input
            id="listPriceHuf"
            className="bg-white"
            type="number"
            min={0}
            {...form.register("listPriceHuf", { valueAsNumber: true })}
          />
          {errors.listPriceHuf && (
            <p role="alert" className="text-sm text-destructive">{errors.listPriceHuf.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity" className="micro-label">Capacity</Label>
          <Input
            id="capacity"
            className="bg-white"
            type="number"
            min={1}
            {...form.register("capacity", { valueAsNumber: true })}
          />
          {errors.capacity && (
            <p role="alert" className="text-sm text-destructive">{errors.capacity.message}</p>
          )}
        </div>
      </div>

      {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}

      <div className="flex flex-wrap gap-3 border-t pt-4">
        <button type="submit" className="keycap min-h-11" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          className="btn-plate min-h-11"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register("description")} />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="datetime-local" {...form.register("date")} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...form.register("location")} />
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="listPriceHuf">List price (HUF)</Label>
          <Input
            id="listPriceHuf"
            type="number"
            min={0}
            {...form.register("listPriceHuf", { valueAsNumber: true })}
          />
          {errors.listPriceHuf && (
            <p className="text-sm text-destructive">{errors.listPriceHuf.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            {...form.register("capacity", { valueAsNumber: true })}
          />
          {errors.capacity && (
            <p className="text-sm text-destructive">{errors.capacity.message}</p>
          )}
        </div>
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

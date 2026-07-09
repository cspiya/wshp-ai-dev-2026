"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatHuf } from "@/lib/format";
import { trpc } from "@/platform/api/client";

import type { Workshop } from "../domain/workshop";
import { WorkshopForm } from "./workshop-form";

/** Which form is open: none, the create form, or an edit form for one row. */
type FormState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; workshop: Workshop };

export function WorkshopsView() {
  const [formState, setFormState] = useState<FormState>({ mode: "closed" });

  const utils = trpc.useUtils();
  const list = trpc.workshops.list.useQuery();

  const closeAndRefresh = () => {
    setFormState({ mode: "closed" });
    utils.workshops.list.invalidate();
  };
  const create = trpc.workshops.create.useMutation({ onSuccess: closeAndRefresh });
  const update = trpc.workshops.update.useMutation({ onSuccess: closeAndRefresh });
  const remove = trpc.workshops.delete.useMutation({
    onSuccess: () => utils.workshops.list.invalidate(),
  });

  // Mutation state (a stale error especially) must not leak from one form
  // session into the next, so every open/close transition resets it.
  const openCreate = () => {
    create.reset();
    setFormState({ mode: "create" });
  };
  const openEdit = (workshop: Workshop) => {
    update.reset();
    setFormState({ mode: "edit", workshop });
  };
  const closeForm = () => {
    create.reset();
    update.reset();
    setFormState({ mode: "closed" });
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Workshops</CardTitle>
              <CardDescription>
                The training catalog — the golden-path CRUD slice of this app.
              </CardDescription>
            </div>
            {formState.mode === "closed" && (
              <Button onClick={openCreate}>New workshop</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {formState.mode === "create" && (
            <WorkshopForm
              submitLabel="Create workshop"
              submitting={create.isPending}
              submitError={create.error?.message}
              onSubmit={(input) => create.mutate(input)}
              onCancel={closeForm}
            />
          )}
          {formState.mode === "edit" && (
            <WorkshopForm
              initial={formState.workshop}
              submitLabel="Save changes"
              submitting={update.isPending}
              submitError={update.error?.message}
              onSubmit={(input) => update.mutate({ id: formState.workshop.id, data: input })}
              onCancel={closeForm}
            />
          )}

          {list.isPending && (
            <p className="text-sm text-muted-foreground">Loading workshops…</p>
          )}
          {list.isError && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Could not load workshops.
              </p>
              <p className="text-sm text-muted-foreground">{list.error.message}</p>
            </div>
          )}
          {/* Failed deletes surface here: the row is still in the table
              (invalidate never ran), so the message sits right above it. */}
          {remove.isError && (
            <p className="text-sm text-destructive">
              Could not delete workshop: {remove.error.message}
            </p>
          )}
          {list.isSuccess && list.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No workshops yet — create the first one.
            </p>
          )}
          {list.isSuccess && list.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Price (HUF)</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.map((workshop) => (
                  <TableRow key={workshop.id}>
                    <TableCell className="font-medium">{workshop.title}</TableCell>
                    <TableCell>{formatDate(workshop.date)}</TableCell>
                    <TableCell>{workshop.location}</TableCell>
                    <TableCell className="text-right">
                      {formatHuf(workshop.listPriceHuf)}
                    </TableCell>
                    <TableCell className="text-right">{workshop.capacity}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(workshop)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: workshop.id })}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

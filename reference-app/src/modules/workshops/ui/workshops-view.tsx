"use client";

import { useState } from "react";

import { WarnGlyph } from "@/components/ui/glyphs";
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

  const isEmpty = list.isSuccess && list.data.length === 0;
  // Exactly ONE "New workshop" action exists at a time: it moves into the
  // empty-state panel when the catalog is empty (keeps the accessible name
  // unique for keyboard users and tests alike).
  const showHeaderAction = formState.mode === "closed" && !isEmpty;

  const catalogStat = list.isPending
    ? { lamp: "dotlamp dotlamp-amber", text: "Loading" }
    : list.isError
      ? { lamp: "dotlamp dotlamp-bad", text: "Error" }
      : {
          lamp: "dotlamp dotlamp-ok",
          text: `${list.data.length} record${list.data.length === 1 ? "" : "s"}`,
        };

  const rowActions = (workshop: Workshop) => (
    <>
      <button type="button" className="btn-plate btn-sm" onClick={() => openEdit(workshop)}>
        Edit
      </button>
      <button
        type="button"
        className="btn-danger btn-sm"
        disabled={remove.isPending}
        onClick={() => remove.mutate({ id: workshop.id })}
      >
        Delete
      </button>
    </>
  );

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-64 flex-1">
          <p className="crumb">
            <b>REF-LAB/01</b> · Golden path · CRUD slice
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Workshops</h1>
          <p className="lede mt-2">
            The training catalog — the golden-path slice every other module copies.
          </p>
        </div>
        {showHeaderAction && (
          <button type="button" className="keycap min-h-11" onClick={openCreate}>
            New workshop
          </button>
        )}
      </header>

      {formState.mode === "create" && (
        <section aria-labelledby="workshop-form-heading" className="mod mt-7">
          <div className="mod-head">
            <span className="mod-tag" id="workshop-form-heading">
              Catalog entry · Create workshop
            </span>
            <span className="mod-stat">
              <span className="dotlamp dotlamp-amber" aria-hidden="true" />
              Editing
            </span>
          </div>
          <div className="mod-body">
            <WorkshopForm
              submitLabel="Create workshop"
              submitting={create.isPending}
              submitError={create.error?.message}
              onSubmit={(input) => create.mutate(input)}
              onCancel={closeForm}
            />
          </div>
        </section>
      )}
      {formState.mode === "edit" && (
        <section aria-labelledby="workshop-form-heading" className="mod mt-7">
          <div className="mod-head">
            <span className="mod-tag" id="workshop-form-heading">
              Catalog entry · Edit workshop
            </span>
            <span className="mod-stat">
              <span className="dotlamp dotlamp-amber" aria-hidden="true" />
              Editing
            </span>
          </div>
          <div className="mod-body">
            <WorkshopForm
              initial={formState.workshop}
              submitLabel="Save changes"
              submitting={update.isPending}
              submitError={update.error?.message}
              onSubmit={(input) => update.mutate({ id: formState.workshop.id, data: input })}
              onCancel={closeForm}
            />
          </div>
        </section>
      )}

      {/* Failed deletes surface here: the row is still in the table
          (invalidate never ran), so the message sits right above it. */}
      {remove.isError && (
        <p role="alert" className="mt-5 inline-flex items-center gap-1.5 text-sm text-destructive">
          <WarnGlyph />
          Could not delete workshop: {remove.error.message}
        </p>
      )}

      <section aria-label="Workshop catalog" className="mod mt-7">
        <div className="mod-head">
          <span className="mod-tag">Catalog</span>
          <span className="mod-stat">
            <span className={catalogStat.lamp} aria-hidden="true" />
            {catalogStat.text}
          </span>
        </div>

        {list.isPending && (
          <div className="mod-body space-y-3" aria-label="Loading workshops">
            <p className="text-sm text-muted-foreground">Loading workshops…</p>
            <div className="h-9 rounded-md bg-muted motion-safe:animate-pulse" />
            <div className="h-9 rounded-md bg-muted motion-safe:animate-pulse" />
            <div className="h-9 rounded-md bg-muted motion-safe:animate-pulse" />
          </div>
        )}

        {list.isError && (
          <div role="alert" className="mod-body">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
              <WarnGlyph />
              Could not load workshops.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{list.error.message}</p>
          </div>
        )}

        {isEmpty && formState.mode === "closed" && (
          <div className="mod-body py-10 text-center">
            <p className="micro-label">Catalog empty</p>
            <h2 className="mt-2 text-lg font-bold">No workshops yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              The training catalog has no entries — create the first one to see the
              golden-path slice at work.
            </p>
            <button type="button" className="keycap mt-5 min-h-11" onClick={openCreate}>
              New workshop
            </button>
          </div>
        )}
        {isEmpty && formState.mode !== "closed" && (
          <div className="mod-body">
            <p className="text-sm text-muted-foreground">
              The catalog is empty — the entry being edited above will be its first record.
            </p>
          </div>
        )}

        {list.isSuccess && list.data.length > 0 && (
          <>
            {/* Desktop: the real table keeps its semantics, restyled to the
                console's engraved column heads. */}
            <div className="hidden px-2.5 pt-1 pb-2 md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-foreground hover:bg-transparent">
                    <TableHead className="micro-label px-3">Title</TableHead>
                    <TableHead className="micro-label px-3">Date</TableHead>
                    <TableHead className="micro-label px-3">Location</TableHead>
                    <TableHead className="micro-label px-3 text-right">Price (HUF)</TableHead>
                    <TableHead className="micro-label px-3 text-right">Capacity</TableHead>
                    <TableHead className="micro-label px-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.data.map((workshop) => (
                    <TableRow
                      key={workshop.id}
                      className="border-border focus-within:bg-primary/5 hover:bg-primary/5"
                    >
                      <TableCell className="px-3 py-3 font-medium">{workshop.title}</TableCell>
                      <TableCell className="px-3 py-3">{formatDate(workshop.date)}</TableCell>
                      <TableCell className="px-3 py-3">{workshop.location}</TableCell>
                      <TableCell className="px-3 py-3 text-right font-mono text-[13px] tabular-nums">
                        {formatHuf(workshop.listPriceHuf)}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right font-mono text-[13px] tabular-nums">
                        {workshop.capacity}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">{rowActions(workshop)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: labeled stacked cards instead of a shrunken table. */}
            <ul className="space-y-3 p-4 md:hidden" aria-label="Workshops">
              {list.data.map((workshop) => (
                <li key={workshop.id} className="rounded-lg border border-border bg-white p-4">
                  <p className="font-heading font-bold">{workshop.title}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="micro-label">Date</dt>
                      <dd className="mt-0.5">{formatDate(workshop.date)}</dd>
                    </div>
                    <div>
                      <dt className="micro-label">Location</dt>
                      <dd className="mt-0.5">{workshop.location}</dd>
                    </div>
                    <div>
                      <dt className="micro-label">Price (HUF)</dt>
                      <dd className="mt-0.5 font-mono text-[13px] tabular-nums">
                        {formatHuf(workshop.listPriceHuf)}
                      </dd>
                    </div>
                    <div>
                      <dt className="micro-label">Capacity</dt>
                      <dd className="mt-0.5 font-mono text-[13px] tabular-nums">
                        {workshop.capacity}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex gap-2 *:min-h-11 *:flex-1">{rowActions(workshop)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}

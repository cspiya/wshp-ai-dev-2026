"use client";

import { useState } from "react";

import { CheckGlyph, WarnGlyph } from "@/components/ui/glyphs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatHuf } from "@/lib/format";
import { trpc } from "@/platform/api/client";

import { AuthPanel } from "./auth-panel";
import { JourneyRail, type JourneyStep } from "./journey-rail";

/**
 * Selection-to-checkout wizard (accepted mock, journey re-composition):
 *
 *   01 Workshop      — catalog cards from the EXISTING workshops.list query
 *   02 Account       — the existing AuthPanel as a wizard step
 *   03 Price+payment — existing pricing query prefilled from the selection,
 *                      then the existing fake-payment mutation
 *   04 Confirmation  — existing registration mutations + proof certificate
 *
 * Every step is driven by EXISTING queries/mutations. The only local UI
 * state is navigation: which workshop was picked and whether the account
 * step was acknowledged (the local demo legitimately runs signed out).
 */
export function ShopDemo() {
  const [listPrice, setListPrice] = useState("10000");
  const [coupon, setCoupon] = useState("1000");
  const [groupDiscountPercent, setGroupDiscountPercent] = useState("10");
  const [vatPercent, setVatPercent] = useState("27");
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  // Wizard navigation state (presentation only — no fabricated backend state).
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");
  const [accountAcked, setAccountAcked] = useState(false);
  // Presentation-only mirror of the AuthPanel session status (drives the rail).
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);

  const pricingInput = {
    currency: "HUF",
    listPriceMinor: Number(listPrice),
    couponMinor: Number(coupon),
    groupDiscountBps: Number(groupDiscountPercent) * 100,
    vatBps: Number(vatPercent) * 100,
  };
  const quote = trpc.pricing.quote.useQuery(pricingInput, { enabled: false, retry: false });
  const workshops = trpc.workshops.list.useQuery();
  const checkout = trpc.checkout.authorize.useMutation();
  const registration = trpc.registrations.create.useMutation({
    onSuccess: (created) => setRegistrationId(created.id),
  });
  const confirm = trpc.registrations.confirm.useMutation();
  const cancel = trpc.registrations.cancel.useMutation();
  const confirmedRegistration = confirm.data?.status === "confirmed" ? confirm.data : null;

  const resetDownstream = () => {
    checkout.reset();
    registration.reset();
    confirm.reset();
    cancel.reset();
    setRegistrationId(null);
  };

  const selectedWorkshop = workshops.data?.find(
    (workshop) => workshop.id === selectedWorkshopId,
  );

  const selectWorkshop = (id: string, listPriceHuf: number) => {
    resetDownstream();
    // Prefill the quote with the selected workshop's price as list price.
    setListPrice(String(listPriceHuf));
    setSelectedWorkshopId(id);
  };
  const changeWorkshop = () => {
    resetDownstream();
    setSelectedWorkshopId("");
  };
  const restartJourney = () => {
    resetDownstream();
    setSelectedWorkshopId("");
    setAccountAcked(false);
  };

  // Wizard position derived from real state — nothing is fabricated.
  const workshopDone = Boolean(selectedWorkshop);
  const paymentAuthorized = checkout.data?.status === "authorized";
  const registrationConfirmed = Boolean(confirmedRegistration);
  const step = !workshopDone ? 1 : !accountAcked ? 2 : !paymentAuthorized ? 3 : 4;

  const steps: JourneyStep[] = [
    {
      index: "01",
      label: "Workshop",
      state: workshopDone ? "completed" : "current",
      note: workshopDone ? "Done" : "Choose",
    },
    {
      index: "02",
      label: "Account",
      state: accountAcked ? "completed" : step === 2 ? "current" : "locked",
      note: accountAcked
        ? authedEmail
          ? "Signed in"
          : "Signed out"
        : step === 2
          ? "Now"
          : "Locked",
      lockedReason: "select a workshop",
    },
    {
      index: "03",
      label: "Price & payment",
      state: paymentAuthorized ? "completed" : step === 3 ? "current" : "locked",
      note: paymentAuthorized ? "Authorized" : step === 3 ? (quote.data ? "Quoted" : "Now") : "Locked",
      lockedReason: workshopDone ? "finish the account step" : "select a workshop",
    },
    {
      index: "04",
      label: "Confirmation",
      state: registrationConfirmed ? "completed" : step === 4 ? "current" : "locked",
      note: registrationConfirmed
        ? cancel.data
          ? "Cancelled"
          : "Confirmed"
        : step === 4
          ? "Now"
          : "Locked",
      lockedReason: "authorize the payment",
    },
  ];

  const paymentAuthId = checkout.data?.status === "authorized" ? checkout.data.paymentId : null;

  const heading =
    step === 1
      ? {
          h1: "Choose your workshop",
          lede: "Pick a training to register for — title, date, capacity and price come from the live catalog. Checkout takes three short steps after this.",
        }
      : step === 2
        ? {
            h1: "Your account",
            lede: "Email + password against the auth proxy — the local demo also runs signed out.",
          }
        : step === 3
          ? {
              h1: "Price & payment",
              lede: "Your quote starts from the selected workshop's price; the fake payment boundary authorizes the exact quoted amount — nothing real is charged.",
            }
          : registrationConfirmed
            ? cancel.data
              ? {
                  h1: "Registration cancelled",
                  lede: "The cancellation ran through the live flow — the certificate below reflects the final state.",
                }
              : {
                  h1: "You're registered.",
                  lede: "Every claim below came from the live flow you just ran — this is the evidence the method produces.",
                }
            : {
                h1: "Confirmation",
                lede: "Create the registration for your selected workshop, then confirm it to close the journey.",
              };

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
    >
      <p className="crumb">
        <b>REF-LAB/03</b> · Cross-slice journey · Step 0{step} of 04
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {heading.h1}
      </h1>
      <p className="lede mt-2">{heading.lede}</p>

      <JourneyRail steps={steps} />

      {/* completed steps collapse into summary chips with a way back */}
      {(step >= 3 || (step === 2 && workshopDone)) && (
        <div className="mt-6 grid gap-2.5">
          {workshopDone && step >= 2 && (
            <div className="chip">
              <span className="chip-ck" aria-hidden="true">
                ✓
              </span>
              <span className="chip-lbl">Workshop</span>
              <span className="chip-val">
                {selectedWorkshop
                  ? `${selectedWorkshop.title} · ${formatDate(selectedWorkshop.date)}`
                  : "—"}
              </span>
              <button
                type="button"
                className="chip-chg"
                onClick={changeWorkshop}
                disabled={paymentAuthorized}
                title={paymentAuthorized ? "Payment already authorized — restart from the certificate" : undefined}
              >
                Change
              </button>
            </div>
          )}
          {accountAcked && step >= 3 && (
            <div className="chip">
              <span className="chip-ck" aria-hidden="true">
                ✓
              </span>
              <span className="chip-lbl">Account</span>
              <span className="chip-val">
                {authedEmail ? `${authedEmail} · signed in` : "Signed out · local demo"}
              </span>
              <button
                type="button"
                className="chip-chg"
                onClick={() => setAccountAcked(false)}
                disabled={paymentAuthorized}
                title={paymentAuthorized ? "Payment already authorized — restart from the certificate" : undefined}
              >
                Change
              </button>
            </div>
          )}
          {paymentAuthorized && step >= 4 && (
            <div className="chip">
              <span className="chip-ck" aria-hidden="true">
                ✓
              </span>
              <span className="chip-lbl">Payment</span>
              <span className="chip-val" data-testid="payment-result">
                Payment: authorized
              </span>
              <span className="font-mono text-xs text-muted-foreground">{paymentAuthId}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Step 01 · workshop catalog ─────────────────────────────── */}
      {step === 1 && (
        <section aria-label="Workshop catalog" className="mt-7">
          {workshops.isPending && (
            <div className="grid gap-4 md:grid-cols-3" aria-label="Loading workshops">
              {[0, 1, 2].map((i) => (
                <div key={i} className="wcard p-0">
                  <div className="wcard-strip opacity-30" />
                  <div className="wcard-in">
                    <p className="text-sm text-muted-foreground">Loading workshops…</p>
                    <div className="h-6 rounded bg-muted motion-safe:animate-pulse" />
                    <div className="h-6 w-2/3 rounded bg-muted motion-safe:animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {workshops.isError && (
            <div role="alert" className="mod border-destructive/40">
              <div className="mod-head">
                <span className="mod-tag">Catalog</span>
                <span className="mod-stat">
                  <span className="dotlamp dotlamp-bad" aria-hidden="true" />
                  Error
                </span>
              </div>
              <div className="mod-body">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <WarnGlyph />
                  Could not load the workshop catalog.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{workshops.error.message}</p>
              </div>
            </div>
          )}
          {workshops.data?.length === 0 && (
            <div className="mod">
              <div className="mod-head">
                <span className="mod-tag">Catalog</span>
                <span className="mod-stat">
                  <span className="dotlamp" aria-hidden="true" />0 records
                </span>
              </div>
              <div className="mod-body">
                <p role="alert" className="inline-flex items-center gap-1.5 text-sm">
                  <WarnGlyph className="text-destructive" />
                  No workshop is available. Seed the database first.
                </p>
              </div>
            </div>
          )}
          {workshops.data && workshops.data.length > 0 && (
            <ul className="grid list-none gap-4 md:grid-cols-3">
              {workshops.data.map((workshop) => (
                <li key={workshop.id} className="wcard">
                  <div className="wcard-strip" aria-hidden="true" />
                  <div className="wcard-in">
                    <span className="wcard-kind">{workshop.location}</span>
                    <h2 className="wcard-title">{workshop.title}</h2>
                    <div className="wcard-meta">
                      <span>
                        Date <b>{formatDate(workshop.date)}</b>
                      </span>
                      <span>
                        Capacity <b>{workshop.capacity} seats</b>
                      </span>
                    </div>
                    <div className="wcard-price">
                      <span className="wcard-price-n">{formatHuf(workshop.listPriceHuf)}</span>
                      <span className="wcard-price-cur">HUF</span>
                    </div>
                    <button
                      type="button"
                      className="keycap mt-2 min-h-11"
                      onClick={() => selectWorkshop(workshop.id, workshop.listPriceHuf)}
                    >
                      Select &amp; continue
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── Step 02 · account ──────────────────────────────────────── */}
      {step === 2 && (
        <>
          <div className="mt-6">
            <AuthPanel onStatusChange={setAuthedEmail} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="back-link min-h-11" onClick={changeWorkshop}>
              ← Back to workshops
            </button>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="keycap min-h-11"
                onClick={() => setAccountAcked(true)}
              >
                Continue to price &amp; payment
              </button>
              <span className="mini">Step 02 / 04</span>
            </div>
          </div>
        </>
      )}

      {/* ── Step 03 · price & payment ──────────────────────────────── */}
      {step === 3 && (
        <>
          <section aria-labelledby="pricing-heading" className="mod mt-6">
            <div className="mod-head">
              <span className="mod-tag" id="pricing-heading">
                Step 03 · Quote
              </span>
              <span className="mod-stat">
                <span
                  className={quote.data ? "dotlamp dotlamp-ok" : "dotlamp dotlamp-amber"}
                  aria-hidden="true"
                />
                {quote.data ? "Quoted" : "Now"}
              </span>
            </div>
            <div className="mod-body">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="List price (minor units)"
                  value={listPrice}
                  onChange={setListPrice}
                  hint={`prefilled from ${selectedWorkshop?.title ?? "the selected workshop"}`}
                />
                <Field label="Coupon (minor units)" value={coupon} onChange={setCoupon} />
                <Field
                  label="Group discount (%)"
                  value={groupDiscountPercent}
                  onChange={setGroupDiscountPercent}
                />
                <Field label="VAT (%)" value={vatPercent} onChange={setVatPercent} />
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  className="keycap min-h-11"
                  onClick={() => {
                    resetDownstream();
                    void quote.refetch();
                  }}
                >
                  Calculate price
                </button>
              </div>
              {quote.isError && (
                <p
                  role="alert"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-destructive"
                >
                  <WarnGlyph />
                  {quote.error.message}
                </p>
              )}
              {quote.data && (
                <div className="total">
                  <span className="total-k">Total to authorize</span>
                  <span data-testid="quote-total">
                    <span className="total-n">{quote.data.totalMinor}</span>{" "}
                    <span className="total-cur">{quote.data.currency}</span>
                  </span>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="payment-heading" className="mod mt-4">
            <div className="mod-head">
              <span className="mod-tag" id="payment-heading">
                Step 03 · Fake payment
              </span>
              <span className="mod-stat text-primary-text">
                <span className="dotlamp dotlamp-amber" aria-hidden="true" />
                Protected
              </span>
            </div>
            <div className="mod-body">
              <p className="max-w-[52ch] text-[0.92rem] text-muted-foreground">
                Training boundary: the PaymentPort authorizes the quote and returns an
                authorization id. No card, no charge — nothing real happens here.
              </p>
              {!quote.data && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Calculate a price above to enable the authorization.
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="keycap min-h-11"
                  onClick={() =>
                    quote.data &&
                    checkout.mutate({
                      reference: "sample-order",
                      amountMinor: quote.data.totalMinor,
                      currency: quote.data.currency,
                    })
                  }
                  disabled={!quote.data || checkout.isPending}
                >
                  {checkout.isPending
                    ? "Authorizing…"
                    : quote.data
                      ? `Authorize fake payment · ${quote.data.totalMinor} ${quote.data.currency}`
                      : "Authorize fake payment"}
                </button>
                <span className="mini">port: fake-payment-adapter</span>
              </div>
              {checkout.data && checkout.data.status !== "authorized" && (
                <p className="mt-3 inline-flex items-center gap-1.5 border-t pt-3 text-sm">
                  <WarnGlyph className="text-destructive" />
                  <span data-testid="payment-result">Payment: {checkout.data.status}</span>
                </p>
              )}
              {checkout.isError && <ErrorMessage message={checkout.error.message} />}
            </div>
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="back-link min-h-11"
              onClick={() => setAccountAcked(false)}
            >
              ← Back to account
            </button>
            <span className="mini">Step 03 / 04</span>
          </div>
        </>
      )}

      {/* ── Step 04 · confirmation & certificate ───────────────────── */}
      {step === 4 && !registrationConfirmed && (
        <section aria-labelledby="registration-heading" className="mod mt-6">
          <div className="mod-head">
            <span className="mod-tag" id="registration-heading">
              Step 04 · Confirmation
            </span>
            <span className="mod-stat">
              <span className="dotlamp dotlamp-amber" aria-hidden="true" />
              Now
            </span>
          </div>
          <div className="mod-body">
            <p className="max-w-[52ch] text-sm text-muted-foreground">
              Registers <strong className="text-foreground">Sample Participant</strong>{" "}
              (sample@example.test — the demo&apos;s fixed attendee) for{" "}
              <strong className="text-foreground">{selectedWorkshop?.title}</strong>, then
              confirms the pending registration.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="keycap min-h-11"
                onClick={() =>
                  registration.mutate({
                    workshopId: selectedWorkshopId,
                    participantName: "Sample Participant",
                    participantEmail: "sample@example.test",
                  })
                }
                disabled={registration.isPending || Boolean(registrationId)}
              >
                {registration.isPending ? "Creating…" : "Create registration"}
              </button>
              {registrationId && registration.data?.status === "pending" && !confirm.data && (
                <button
                  type="button"
                  className="keycap min-h-11"
                  onClick={() => confirm.mutate({ id: registrationId })}
                  disabled={confirm.isPending}
                >
                  {confirm.isPending ? "Confirming…" : "Confirm registration"}
                </button>
              )}
            </div>
            <div className="mt-3 space-y-1 text-sm empty:hidden">
              {registration.data && (
                <p data-testid="registration-status" className="font-mono text-[13px]">
                  Registration: {registration.data.status}
                </p>
              )}
              {registration.isError && <ErrorMessage message={registration.error.message} />}
              {confirm.isError && <ErrorMessage message={confirm.error.message} />}
            </div>
          </div>
        </section>
      )}

      {step === 4 && confirmedRegistration && (
        <section aria-labelledby="proof-heading" className="cert mt-7">
          <span className="cert-stamp" aria-hidden="true">
            {cancel.data ? "CANCELLED" : "VERIFIED"}
          </span>
          <h2
            id="proof-heading"
            className="flex items-center gap-2.5 pr-24 text-[1.35rem] font-bold tracking-tight"
          >
            <span
              className={
                cancel.data ? "dotlamp size-3" : "dotlamp dotlamp-ok size-3"
              }
              aria-hidden="true"
            />
            {cancel.data ? "Registration cancelled — proof" : "Registration confirmed — proof"}
          </h2>
          <div className="ledger">
            <div>
              <span className="ledger-k">Workshop</span>
              <span className="ledger-v">
                {selectedWorkshop
                  ? `${selectedWorkshop.title} · ${formatDate(selectedWorkshop.date)}`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="ledger-k">Attendee</span>
              <span className="ledger-v">
                {registration.data
                  ? `${registration.data.participantName} · ${registration.data.participantEmail}`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="ledger-k">Price</span>
              <span className="ledger-v">
                {quote.data ? `${quote.data.totalMinor} ${quote.data.currency}` : "—"}
              </span>
            </div>
            <div>
              <span className="ledger-k">Payment auth</span>
              <span className="ledger-v">{paymentAuthId ?? "—"}</span>
            </div>
            <div>
              <span className="ledger-k">Registration</span>
              <span className={cancel.data ? "ledger-v font-semibold" : "ledger-v font-semibold text-success"}>
                {cancel.data ? (
                  <span data-testid="cancelled-status">Registration: cancelled</span>
                ) : (
                  <span data-testid="confirmed-status">Registration: confirmed</span>
                )}
              </span>
            </div>
          </div>
          {cancel.isError && <ErrorMessage message={cancel.error.message} />}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-dashed border-[#cfe0cf] pt-4">
            <button type="button" className="keycap min-h-11" onClick={restartJourney}>
              Browse more workshops
            </button>
            {!cancel.data && (
              <button
                type="button"
                className="btn-danger min-h-11"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate({ id: confirmedRegistration.id })}
              >
                {cancel.isPending ? "Cancelling…" : "Cancel registration"}
              </button>
            )}
            <span className="mini">cancel window: closes 48h before start</span>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckGlyph className="text-success" />
            &ldquo;Browse more workshops&rdquo; clears the payment and registration state
            and returns to the catalog; the price quote stays cached for a replay.
          </p>
        </section>
      )}
    </main>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-3 inline-flex items-center gap-1.5 text-sm text-destructive">
      <WarnGlyph />
      {message}
    </p>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="micro-label">
        {label}
      </Label>
      <Input
        id={label}
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-white"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

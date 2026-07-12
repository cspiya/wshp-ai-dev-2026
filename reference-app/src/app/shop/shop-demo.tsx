"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/platform/api/client";

import { AuthPanel } from "./auth-panel";

export function ShopDemo() {
  const [listPrice, setListPrice] = useState("10000");
  const [coupon, setCoupon] = useState("1000");
  const [groupDiscountPercent, setGroupDiscountPercent] = useState("10");
  const [vatPercent, setVatPercent] = useState("27");
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");

  const pricingInput = {
    currency: "HUF",
    listPriceMinor: Number(listPrice),
    couponMinor: Number(coupon),
    groupDiscountBps: Number(groupDiscountPercent) * 100,
    vatBps: Number(vatPercent) * 100,
  };
  const quote = trpc.pricing.quote.useQuery(pricingInput, { enabled: false, retry: false });
  const workshops = trpc.workshops.list.useQuery();
  const workshopId = selectedWorkshopId || workshops.data?.[0]?.id || "";
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

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Training shop happy path</CardTitle>
          <CardDescription>
            Integer pricing, a fake payment boundary, and a registration status flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AuthPanel />

          <section className="grid gap-4 sm:grid-cols-2" aria-labelledby="pricing-heading">
            <h2 id="pricing-heading" className="col-span-full text-lg font-semibold">1. Price</h2>
            <Field label="List price (minor units)" value={listPrice} onChange={setListPrice} />
            <Field label="Coupon (minor units)" value={coupon} onChange={setCoupon} />
            <Field label="Group discount (%)" value={groupDiscountPercent} onChange={setGroupDiscountPercent} />
            <Field label="VAT (%)" value={vatPercent} onChange={setVatPercent} />
            <div className="col-span-full">
              <Button onClick={() => { resetDownstream(); void quote.refetch(); }}>Calculate price</Button>
            </div>
            {quote.isError && <p className="col-span-full text-sm text-destructive">{quote.error.message}</p>}
            {quote.data && (
              <p className="col-span-full" data-testid="quote-total">
                Total: <strong>{quote.data.totalMinor} {quote.data.currency}</strong>
              </p>
            )}
          </section>

          {quote.data && (
            <section className="space-y-3" aria-labelledby="payment-heading">
              <h2 id="payment-heading" className="text-lg font-semibold">2. Payment</h2>
              <Button
                onClick={() => checkout.mutate({
                  reference: "sample-order",
                  amountMinor: quote.data.totalMinor,
                  currency: quote.data.currency,
                })}
                disabled={checkout.isPending}
              >
                Authorize fake payment
              </Button>
              {checkout.data && <p data-testid="payment-result">Payment: {checkout.data.status}</p>}
              {checkout.isError && <ErrorMessage message={checkout.error.message} />}
            </section>
          )}

          {checkout.data?.status === "authorized" && (
            <section className="space-y-3" aria-labelledby="registration-heading">
              <h2 id="registration-heading" className="text-lg font-semibold">3. Registration</h2>
              <div className="space-y-2">
                <Label htmlFor="workshop">Workshop</Label>
                <select
                  id="workshop"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={workshopId}
                  onChange={(event) => setSelectedWorkshopId(event.target.value)}
                  disabled={workshops.isPending || Boolean(registrationId)}
                >
                  {workshops.data?.map((workshop) => (
                    <option key={workshop.id} value={workshop.id}>{workshop.title}</option>
                  ))}
                </select>
              </div>
              {workshops.isError && <ErrorMessage message={workshops.error.message} />}
              {workshops.data?.length === 0 && (
                <ErrorMessage message="No workshop is available. Seed the database first." />
              )}
              <Button
                onClick={() => registration.mutate({
                  workshopId,
                  participantName: "Sample Participant",
                  participantEmail: "sample@example.test",
                })}
                disabled={registration.isPending || Boolean(registrationId) || !workshopId}
              >
                Create registration
              </Button>
              {registration.data && <p data-testid="registration-status">Registration: {registration.data.status}</p>}
              {registration.isError && <ErrorMessage message={registration.error.message} />}
              {registrationId && registration.data?.status === "pending" && !confirm.data && (
                <Button onClick={() => confirm.mutate({ id: registrationId })}>Confirm registration</Button>
              )}
              {confirm.data && <p data-testid="confirmed-status">Registration: {confirm.data.status}</p>}
              {confirm.isError && <ErrorMessage message={confirm.error.message} />}
              {confirmedRegistration && !cancel.data && (
                <Button
                  variant="destructive"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate({ id: confirmedRegistration.id })}
                >
                  Cancel registration
                </Button>
              )}
              {cancel.data && <p data-testid="cancelled-status">Registration: {cancel.data.status}</p>}
              {cancel.isError && <ErrorMessage message={cancel.error.message} />}
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <p role="alert" className="text-sm text-destructive">{message}</p>;
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Input id={label} type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

import { grossFromNet } from "../domain/order";
import { formatHufAmount } from "@/lib/format";

/**
 * The one way a price appears anywhere in the shop (accepted mock `.price`):
 * net amount with the "NET + 27% VAT" micro-label, gross underneath. The
 * gross comes from the orders domain (same half-up rounding as the totals),
 * never recomputed ad hoc.
 */
export function PriceBlock({
  netHuf,
  perSeat = false,
  className,
}: {
  netHuf: number;
  /** Per-seat prices say so on both lines (catalog card, product page). */
  perSeat?: boolean;
  className?: string;
}) {
  return (
    <p className={className ? `price ${className}` : "price"}>
      <span className="price-net">
        {formatHufAmount(netHuf)} <small>NET{perSeat ? " / SEAT" : ""} + 27% VAT</small>
      </span>
      <span className="price-gross">
        Gross <b>{formatHufAmount(grossFromNet(netHuf))}</b>
        {perSeat ? " / seat" : ""}
      </span>
    </p>
  );
}

using System;
using System.Collections;
using System.Globalization;
using System.Text;

namespace LegacyShop
{
    // INVENTED teaching sample. A deliberately gnarly legacy service:
    // data access, business rules, culture-sensitive formatting, hidden
    // state and clock access all live in one method. This is the class the
    // legacy lab characterizes BEFORE changing anything.
    public class OrderTotalsService
    {
        // Hidden shared state: survives between calls, invisible to callers.
        private static readonly Hashtable Cache = new Hashtable();

        public string BuildMonthlyStatement(int customerId, int year, int month)
        {
            string cacheKey = customerId + "|" + year + "|" + month;
            if (Cache.ContainsKey(cacheKey))
            {
                return (string)Cache[cacheKey];
            }

            DataRowLike[] rows = LoadOrderRows(customerId, year, month);

            decimal net = 0m;
            int itemCount = 0;
            foreach (DataRowLike row in rows)
            {
                // Magic business rules nobody remembers the origin of:
                decimal line = row.UnitPriceHuf * row.Quantity;
                if (row.Quantity >= 5) line = line * 0.9m;              // group discount
                if (row.CouponCode == "TAVASZ10") line = line - 1000m;  // fixed coupon
                if (line < 0) line = 0;
                net += line;
                itemCount += row.Quantity;
            }

            // Loyalty tier: depends on TODAY, not on the statement month.
            int loyaltyYears = DateTime.Today.Year - GetFirstOrderYear(customerId);
            if (loyaltyYears > 3) net = Math.Round(net * 0.98m, 0);

            decimal gross = Math.Round(net * 1.27m, 0); // VAT inlined

            // Culture-sensitive formatting: output differs by machine locale.
            var sb = new StringBuilder();
            sb.AppendLine("HAVI KIMUTATAS / MONTHLY STATEMENT");
            sb.AppendLine("Ugyfel: #" + customerId);
            sb.AppendLine("Idoszak: " + new DateTime(year, month, 1).ToString("yyyy. MMMM"));
            sb.AppendLine("Tetelek: " + itemCount);
            sb.AppendLine("Netto: " + net.ToString("N0") + " Ft");
            sb.AppendLine("Brutto: " + gross.ToString("N0") + " Ft");

            string result = sb.ToString();
            Cache[cacheKey] = result;
            return result;
        }

        // In the real legacy system these two hit SQL Server directly.
        // They are virtual ONLY because that is the cheapest first seam
        // (subclass-to-test); the lab starts here.
        protected virtual DataRowLike[] LoadOrderRows(int customerId, int year, int month)
        {
            throw new InvalidOperationException(
                "Database access not available in the lab - override this seam in a test double.");
        }

        protected virtual int GetFirstOrderYear(int customerId)
        {
            throw new InvalidOperationException(
                "Database access not available in the lab - override this seam in a test double.");
        }

        public class DataRowLike
        {
            public decimal UnitPriceHuf;
            public int Quantity;
            public string CouponCode;
        }
    }
}

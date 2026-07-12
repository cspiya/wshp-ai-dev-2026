using System.Globalization;
using DataRowLike = LegacyShop.OrderTotalsService.DataRowLike;

namespace LegacyShop.Tests;

// CHARACTERIZATION tests: they pin what the legacy code DOES today —
// bugs included. They are the safety net; they are NOT a statement that
// the behavior is correct. Only after they are green may refactoring start.
public class OrderTotalsCharacterizationTests
{
    // Subclass-to-test: the cheapest first seam. We override the two
    // database calls; everything else runs the original gnarly code path.
    private sealed class ServiceUnderTest : OrderTotalsService
    {
        private readonly DataRowLike[] rows;
        private readonly int firstOrderYearsAgo;

        public ServiceUnderTest(DataRowLike[] rows, int firstOrderYearsAgo)
        {
            this.rows = rows;
            this.firstOrderYearsAgo = firstOrderYearsAgo;
        }

        protected override DataRowLike[] LoadOrderRows(int customerId, int year, int month) => rows;

        // The service computes loyalty from TODAY (a hidden clock
        // dependency). Anchoring the first-order year relative to today
        // keeps the snapshot deterministic AND preserves the smell.
        protected override int GetFirstOrderYear(int customerId) =>
            DateTime.Today.Year - firstOrderYearsAgo;
    }

    private static string Run(int customerId, DataRowLike[] rows, int firstOrderYearsAgo)
    {
        // The output is culture-sensitive (another pinned legacy smell);
        // fix the culture so the snapshot is machine-independent.
        CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("hu-HU");
        return new ServiceUnderTest(rows, firstOrderYearsAgo)
            .BuildMonthlyStatement(customerId, 2027, 3);
    }

    [Fact]
    public Task PlainOrder_NewCustomer()
    {
        var rows = new[]
        {
            new DataRowLike { UnitPriceHuf = 12000m, Quantity = 1, CouponCode = "" },
            new DataRowLike { UnitPriceHuf = 3500m, Quantity = 2, CouponCode = "" },
        };
        return Verify(Run(customerId: 101, rows, firstOrderYearsAgo: 1));
    }

    [Fact]
    public Task GroupDiscountAndCoupon_LoyalCustomer()
    {
        var rows = new[]
        {
            new DataRowLike { UnitPriceHuf = 8000m, Quantity = 5, CouponCode = "TAVASZ10" },
        };
        return Verify(Run(customerId: 102, rows, firstOrderYearsAgo: 6));
    }

    [Fact]
    public Task CouponBelowZero_ClampsToZero()
    {
        var rows = new[]
        {
            new DataRowLike { UnitPriceHuf = 400m, Quantity = 1, CouponCode = "TAVASZ10" },
        };
        return Verify(Run(customerId: 103, rows, firstOrderYearsAgo: 1));
    }
}

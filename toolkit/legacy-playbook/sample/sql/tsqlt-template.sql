-- tSQLt characterization template for dbo.usp_CalculateOrderTotals.
-- Prereq: tSQLt installed in a DEV database (never production):
--   https://tsqlt.org/downloads/  ->  EXEC tSQLt.NewTestClass 'LegacyTotals';
-- Run all tests:  EXEC tSQLt.Run 'LegacyTotals';

CREATE OR ALTER PROCEDURE LegacyTotals.[test group discount and coupon path]
AS
BEGIN
    -- 1. Isolate: FakeTable detaches the real data (and constraints).
    EXEC tSQLt.FakeTable 'dbo.OrderLines';

    INSERT INTO dbo.OrderLines (CustomerId, OrderedAt, UnitPriceHuf, Quantity, CouponCode)
    VALUES (102, '2027-03-05', 8000, 5, N'TAVASZ10'),
           (102, '2020-01-10', 1000, 1, NULL); -- first order long ago -> loyalty branch

    -- 2. Capture the CURRENT behavior (bugs included) into a result table.
    CREATE TABLE #Actual (CustomerId INT, ItemCount INT, NetHuf DECIMAL(18,2), GrossHuf DECIMAL(18,2));
    INSERT INTO #Actual
        EXEC dbo.usp_CalculateOrderTotals @CustomerId = 102, @Year = 2027, @Month = 3;

    -- 3. Pin it. These numbers document today's behavior — they are the
    --    safety net, not a correctness claim. (35000 * 0.98 = 34300.)
    DECLARE @Net DECIMAL(18,2) = (SELECT NetHuf FROM #Actual);
    DECLARE @Gross DECIMAL(18,2) = (SELECT GrossHuf FROM #Actual);
    EXEC tSQLt.AssertEquals 34300, @Net;
    EXEC tSQLt.AssertEquals 43561, @Gross;
END;
GO

-- Add one test per behavior branch you must not break:
--   plain order (no discounts), coupon clamping to zero, empty month,
--   loyalty boundary (exactly 3 years). THEN refactor the proc.

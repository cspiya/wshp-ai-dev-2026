-- INVENTED teaching sample: the stored-proc twin of OrderTotalsService.
-- Deliberately gnarly: cursor, temp table, inlined business rules, silent
-- clamping. Characterize with tSQLt BEFORE touching it (see
-- tsqlt-template.sql).
CREATE OR ALTER PROCEDURE dbo.usp_CalculateOrderTotals
    @CustomerId INT,
    @Year INT,
    @Month INT
AS
BEGIN
    SET NOCOUNT ON;

    CREATE TABLE #Lines (LineTotal DECIMAL(18, 2), Quantity INT);

    DECLARE @UnitPrice DECIMAL(18, 2), @Quantity INT, @Coupon NVARCHAR(20);
    DECLARE line_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT UnitPriceHuf, Quantity, CouponCode
        FROM dbo.OrderLines
        WHERE CustomerId = @CustomerId
          AND YEAR(OrderedAt) = @Year
          AND MONTH(OrderedAt) = @Month;

    OPEN line_cursor;
    FETCH NEXT FROM line_cursor INTO @UnitPrice, @Quantity, @Coupon;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE @Line DECIMAL(18, 2) = @UnitPrice * @Quantity;
        IF @Quantity >= 5 SET @Line = @Line * 0.9;          -- group discount
        IF @Coupon = N'TAVASZ10' SET @Line = @Line - 1000;  -- fixed coupon
        IF @Line < 0 SET @Line = 0;                         -- silent clamp
        INSERT INTO #Lines VALUES (@Line, @Quantity);
        FETCH NEXT FROM line_cursor INTO @UnitPrice, @Quantity, @Coupon;
    END
    CLOSE line_cursor;
    DEALLOCATE line_cursor;

    DECLARE @Net DECIMAL(18, 2) = (SELECT ISNULL(SUM(LineTotal), 0) FROM #Lines);

    -- Loyalty depends on TODAY (GETDATE), not on the statement period —
    -- the same hidden-clock smell as the C# twin.
    IF DATEDIFF(YEAR,
        (SELECT MIN(OrderedAt) FROM dbo.OrderLines WHERE CustomerId = @CustomerId),
        GETDATE()) > 3
        SET @Net = ROUND(@Net * 0.98, 0);

    SELECT
        @CustomerId AS CustomerId,
        (SELECT ISNULL(SUM(Quantity), 0) FROM #Lines) AS ItemCount,
        @Net AS NetHuf,
        ROUND(@Net * 1.27, 0) AS GrossHuf; -- VAT inlined
END

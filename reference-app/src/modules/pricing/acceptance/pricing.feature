Feature: Deterministic pricing

  Scenario: Apply coupon, group discount, then VAT
    Given a list price of 10000 minor units
    And a coupon of 1000 minor units
    And a 10 percent group discount
    And 27 percent VAT
    When the quote is calculated
    Then the payable total is 10287 minor units

  Scenario: Reject a coupon larger than the list price
    Given a list price of 1000 minor units
    And a coupon of 1001 minor units
    When the quote is requested
    Then validation rejects it

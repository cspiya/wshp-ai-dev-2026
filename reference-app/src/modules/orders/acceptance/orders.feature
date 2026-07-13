Feature: Webshop purchase journey (guest checkout)

  Scenario: Guest places an order with a coupon
    Given a cart with 2 seats of a 10 000 HUF workshop and 1 seat of an 18 500 HUF workshop
    And the coupon WELCOME10 is applied
    When the guest places the order with a payment authorization id
    Then the order totals are net 34 650, VAT 9 356, gross 44 006 HUF
    And the order number is sequential in the form REF-2026-XXXX

  Scenario: Company buyer requires a tax number
    Given a buyer in company mode
    When the tax number is empty
    Then the order is rejected with "Tax number is required"

  Scenario: Seat cap per workshop
    Given a cart line with 6 seats
    When the order is previewed or placed
    Then it is rejected and the message names the custom group offer

  Scenario: Unknown coupon
    Given the coupon code NOPE99
    When the cart is previewed
    Then it is rejected as an unknown coupon

  # Totals are always recomputed server-side; client-sent totals are ignored.

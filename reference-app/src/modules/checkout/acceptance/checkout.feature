Feature: Checkout authorization

  Scenario: Authorize a positive amount
    Given a checkout reference and a positive integer amount
    When checkout is submitted to an approving payment adapter
    Then the result is authorized with a payment identifier

  Scenario: Surface a declined payment
    Given a payment adapter configured to decline
    When checkout is submitted
    Then the result is declined without a payment identifier

  Scenario: Guest authorizes the fake payment without an account
    Given a signed-out buyer with valid guest checkout data
    When checkout is submitted to the fake payment adapter
    Then authorization succeeds without a user session

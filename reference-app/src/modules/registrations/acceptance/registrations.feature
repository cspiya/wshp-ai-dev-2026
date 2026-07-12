Feature: Registration status flow

  Scenario: Confirm a pending registration
    Given a pending registration
    When it is confirmed
    Then its status is confirmed

  Scenario: Cancel before the deadline
    Given a confirmed registration whose workshop starts more than 48 hours from now
    When it is cancelled
    Then its status is cancelled

  Scenario: Reject late cancellation
    Given a registration whose workshop starts less than 48 hours from now
    When cancellation is requested
    Then the request is rejected and the status is unchanged

  Scenario: Reject cancellation exactly at the cutoff instant
    Given a registration whose workshop starts exactly 48 hours from now
    When cancellation is requested
    Then the request is rejected and the status is unchanged

  # The 48-hour window is the default; deployments may configure it via
  # CANCELLATION_WINDOW_HOURS (wired at the composition root).

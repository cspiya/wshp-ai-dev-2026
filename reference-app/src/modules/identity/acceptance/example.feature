# Acceptance criteria live WITH the slice, in English Given-When-Then.
# Each scenario maps to at least one automated test (Vitest, next to the
# use-case in application/). The scenarios below are a TEMPLATE for the
# module's first real use-case; their tests land together with that
# use-case on Day 2 prep. Replace or extend when it is actually built.

Feature: Current user profile
  As a signed-in visitor
  I want the app to resolve my user profile
  So that module UIs can personalize their content

  Scenario: A known user asks for their profile
    Given a user exists with id "3f8a2c1e-0000-4000-8000-000000000001"
    When the current-user query is executed for that id
    Then the response contains that user id
    And the response contains the user's display name

  Scenario: An unknown user id is rejected
    Given no user exists with id "3f8a2c1e-0000-4000-8000-00000000dead"
    When the current-user query is executed for that id
    Then the query fails with a NOT_FOUND error

# Acceptance criteria live WITH the slice, in English Given-When-Then.
# Mapping to automated tests:
# - Router-level scenarios → application/workshops.router.test.ts (Vitest,
#   contract tests against the WorkshopRepo test double).
# - Adapter behavior (ordering, timestamp shape) → the shared repo contract
#   suite, infra/workshop-repo.contract.test.ts.
# - "Creating a workshop" and "Deleting a workshop" additionally have a
#   browser-level happy path → e2e/workshops.spec.ts (Playwright,
#   tagged @happy-path).
# Example values are deliberately generic — this is a public repo.

Feature: Workshop catalog management
  As a training organizer
  I want to manage the workshop catalog
  So that visitors always see the current offering

  Scenario: Listing workshops ordered by date
    Given workshops exist with dates "2027-03-01" and "2027-01-15"
    When the workshop list is requested
    Then both workshops are returned
    And they are ordered by date ascending

  Scenario: Creating a workshop
    Given a valid workshop input titled "Sample Workshop: Intro to Agentic Development"
    When the create use-case is executed
    Then the response contains a workshop id
    And the workshop appears in the list

  Scenario: Rejecting an invalid workshop
    Given a workshop input with an empty title and a negative list price
    When the create use-case is executed
    Then the request is rejected at the schema boundary
    And no workshop is created

  Scenario: Editing a workshop
    Given an existing workshop titled "Draft title"
    When the update use-case renames it to "Final title"
    Then the list shows the title "Final title"

  Scenario: Editing a workshop that does not exist
    Given no workshop exists with a given id
    When the update use-case is executed for that id
    Then the request fails with a NOT_FOUND error

  Scenario: Deleting a workshop
    Given an existing workshop
    When the delete use-case is executed for its id
    Then the workshop no longer appears in the list
    And deleting the same id again fails with a NOT_FOUND error

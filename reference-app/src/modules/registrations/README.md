# `registrations` module

Registration status flow: `pending → confirmed` and `pending|confirmed →
cancelled`. Cancellation is allowed until 48 hours before the workshop start.
The application layer receives a clock, so tests and time-zone behavior are
deterministic.

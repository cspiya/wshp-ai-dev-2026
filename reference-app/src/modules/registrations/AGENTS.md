# registrations module — agent instructions

- Only `registrations.contract.ts` is public.
- Persistence is injected through `RegistrationRepo`; clocks are injected for deterministic rules.
- Store all instants as strict UTC ISO strings.
- Every adapter passes `infra/registration-repo.contract.test.ts`.

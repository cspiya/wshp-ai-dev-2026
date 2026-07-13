# `checkout` module

A deliberately small payment boundary. The included fake adapter makes the
workshop flow deterministic and never contacts a real payment provider.
Its authorization procedure is public because the webshop explicitly supports
guest checkout; protected user-owned mutations elsewhere remain session-gated.

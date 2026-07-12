# Strangler fig with YARP — the smallest working slice

Modernization rule: never rewrite the monolith — put a reverse proxy in
front of it and carve out ONE route at a time. YARP (Yet Another Reverse
Proxy, Microsoft's ASP.NET Core proxy) makes the seam a config file.

## The whole proxy

`Program.cs` — this is the complete application:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
var app = builder.Build();
app.MapReverseProxy();
app.Run();
```

## The seam is configuration

`appsettings.json` — one modernized slice, everything else stays legacy:

```json
{
  "ReverseProxy": {
    "Routes": {
      "statements-v2": {
        "ClusterId": "modern",
        "Match": { "Path": "/statements/{**rest}" }
      },
      "everything-else": {
        "ClusterId": "legacy",
        "Match": { "Path": "{**catch-all}" }
      }
    },
    "Clusters": {
      "modern": {
        "Destinations": { "d1": { "Address": "https://localhost:5201/" } }
      },
      "legacy": {
        "Destinations": { "d1": { "Address": "https://localhost:5100/" } }
      }
    }
  }
}
```

Route precedence: the more specific `/statements/*` wins; the catch-all
keeps the legacy app serving everything not yet migrated.

## Why this order

1. Characterization tests pin the legacy behavior (`sample/`).
2. The proxy goes in front — zero behavior change, pure pass-through.
3. ONE route moves to the modern service; the pinned tests run against
   BOTH implementations until the numbers match.
4. Repeat per route. Deleting legacy code is the LAST step, never the first.

The agent's role is the same as in greenfield: spec → change → evidence.
The safety net (steps 1 and 3) is what makes an agent safe on legacy code.

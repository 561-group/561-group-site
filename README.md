# @561-group/site

Deployable public identity site for `https://561.group/`.

It is the canonical public Web carrier of the 561 Group. The same carrier
publishes the apex at `https://561.group/` and the catalog projection at
`https://market.561.group/`, while every listed service remains owned and
settled by its operating enterprise. It does not take payment, select service
providers, or custody customer assets.

## Commands

```sh
pnpm test
pnpm check
pnpm serve
```

The owner-local unit is at `ops/systemd/561-group-site.service`. It runs
`pnpm serve` on a loopback port; separately contracted HTTPS ingress may
project the apex and market hostnames from this one carrier.

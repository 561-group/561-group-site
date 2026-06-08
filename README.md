# @561-group/561-group-site

Deployable apex site for `https://561.group/`.

## Commands

```sh
pnpm test
pnpm check
pnpm serve
```

The package declares its public service in `package.json` under `561:serve`; root deployment tooling renders the Caddy route and user systemd unit from that declaration.

# @561-group/561-group-site

Deployable apex site for `https://561.group/`.

## Commands

```sh
pnpm test
pnpm check
pnpm serve
```

Deployment on the box is hand-maintained: a systemd `--user` unit
(`561-group-site.service`) runs `pnpm serve` on a loopback port, and Caddy
(`~/.config/caddy/Caddyfile`) reverse-proxies `561.group` to it.

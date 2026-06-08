import { htmlRepr, jsonRepr, textRepr, type App } from "@561-group/web-server";

export type ServiceLink = Readonly<{
  name: string;
  href: string;
  rel: string;
  description: string;
}>;

export const SERVICE_LINKS: readonly ServiceLink[] = [
  {
    name: "Farstone",
    href: "https://farstone.561.group/",
    rel: "service",
    description: "Playable harbor MUD world.",
  },
  {
    name: "SWARM Playground",
    href: "https://swarm-playground.561.group/",
    rel: "service",
    description: "SWARM study and control-plane playground.",
  },
];

export function create561GroupSiteApp(): App {
  return {
    security: true,
    cacheControl: { visibility: "public", maxAge: 300 },
    resources: [
      {
        id: "home",
        match: "/",
        methods: ["GET"],
        produces: ["text/html"],
        handler: () => htmlRepr(renderHome(), { status: 200 }),
      },
      {
        id: "site-json",
        match: "/site.json",
        methods: ["GET"],
        produces: ["application/json"],
        handler: () => jsonRepr(siteJson(), { status: 200 }),
      },
      {
        id: "healthz",
        match: "/healthz",
        methods: ["GET"],
        produces: ["text/plain"],
        handler: () => textRepr("ok\n", { status: 200, cacheControl: { noStore: true } }),
      },
    ],
  };
}

function siteJson() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The 561 Group",
    url: "https://561.group/",
    service: SERVICE_LINKS.map((link) => ({
      "@type": "WebSite",
      name: link.name,
      url: link.href,
      description: link.description,
    })),
  };
}

function renderHome(): string {
  const links = SERVICE_LINKS.map((link) => [
    "        <li>",
    `          <a href="${escapeHtml(link.href)}" rel="${escapeHtml(link.rel)}">${escapeHtml(link.name)}</a>`,
    `          <p>${escapeHtml(link.description)}</p>`,
    "        </li>",
  ].join("\n")).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>The 561 Group</title>
    <meta name="description" content="The 561 Group is a confederacy endeavoring in pursuit of Black Liberation and Indigenous Sovereignty.">
    <link rel="canonical" href="https://561.group/">
    <link rel="alternate" type="application/json" href="/site.json">
    <style>
      :root {
        color-scheme: light dark;
        font-family: ui-sans-serif, system-ui, sans-serif;
        line-height: 1.5;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: Canvas;
        color: CanvasText;
      }
      main {
        width: min(44rem, calc(100vw - 2rem));
        padding: 4rem 0;
      }
      h1 {
        margin: 0 0 1rem;
        font-size: clamp(2rem, 8vw, 4.5rem);
        line-height: 1;
      }
      p {
        max-width: 38rem;
        margin: 0 0 1.5rem;
      }
      ul {
        display: grid;
        gap: 1rem;
        padding: 0;
        margin: 2rem 0 0;
        list-style: none;
      }
      li {
        border-top: 1px solid color-mix(in srgb, CanvasText 24%, transparent);
        padding-top: 1rem;
      }
      a {
        color: LinkText;
        font-weight: 700;
      }
      li p {
        margin: 0.25rem 0 0;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>The 561 Group</h1>
      <p>The 561 Group is a confederacy endeavoring in pursuit of Black Liberation and Indigenous Sovereignty.</p>
      <ul>
${links}
      </ul>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

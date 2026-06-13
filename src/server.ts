import process from "node:process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { start, installGracefulShutdown, type StartResult } from "@561-group/web-server";
import { buildApp, markdownDirectoryReader, watchContent } from "@561-group/web-semantic-site-server";
import type { FSWatcher } from "node:fs";
import { render, escapeHtml } from "@561-group/web-theming";
import { fiveSixOneTheme } from "@561-group/561-group-web-theme";

const CONTENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "content");
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 18_788;

const SITE_CONFIG = {
  root: CONTENT_ROOT,
  baseUrl: "https://561.group",
  title: "The 561 Group",
  tagline: "An autonomous confederacy endeavoring in pursuit of long-horizon prosperity.",
  language: "en",
  publishedOnly: true,
  theme: fiveSixOneTheme,
  themeContext: { siteName: "The 561 Group", year: 2026 },
  pingbackUrl: null,
} as const;

export type Serve561GroupSiteOptions = Readonly<{
  host?: string;
  port?: number;
  log?: (line: string) => void;
}>;

export type Serve561GroupSiteResult = StartResult & Readonly<{
  host: string;
  watcher: FSWatcher | null;
}>;

export function serve561GroupSiteOptionsFromEnv(): Required<Omit<Serve561GroupSiteOptions, "log">> {
  return {
    host: process.env.SITE_561_GROUP_HOST ?? process.env.HOST ?? DEFAULT_HOST,
    port: envPort() ?? DEFAULT_PORT,
  };
}

export async function serve561GroupSite(options: Serve561GroupSiteOptions = {}): Promise<Serve561GroupSiteResult> {
  const envOptions = serve561GroupSiteOptionsFromEnv();
  const host = options.host ?? envOptions.host;
  const port = options.port ?? envOptions.port;

  const reader = markdownDirectoryReader();
  const semanticApp = buildApp(reader, SITE_CONFIG);

  // Override the index route: render the 'home' subject's body claim as clean prose HTML.
  // buildApp's default renderIndex emits an hFeed list; that's right for a blog but wrong
  // for a landing page. We read the body claim directly and wrap it as HTML paragraphs.
  const resources = semanticApp.resources.map((resource) => {
    if (resource.id !== "semantic-site.index") return resource;
    return {
      ...resource,
      handler: async (ctx: Parameters<typeof resource.handler>[0]) => {
        const algebra = reader.settle(CONTENT_ROOT, "home");
        const bodyText = String(algebra.potential.find((c) => c.predicate === "body")?.object ?? "");
        const articleHtml = bodyText ? `<p class="lede">${escapeHtml(bodyText)}</p>` : "";
        return {
          status: 200,
          type: "text/html; charset=utf-8",
          body: render(fiveSixOneTheme, articleHtml, {
            nonce: ctx.nonce,
            title: "The 561 Group",
            siteName: "The 561 Group",
            description: SITE_CONFIG.tagline,
            canonical: "https://561.group/",
            lang: "en",
            year: 2026,
          }),
        };
      },
    };
  });

  const app = { ...semanticApp, resources };
  const running = await start(app, { host, port });
  const watcher = watchContent(CONTENT_ROOT, reader, {});

  installGracefulShutdown(running, {
    onClosed: () => {
      watcher?.close();
      options.log?.("561 Group site stopped");
    },
    onError: (error) => options.log?.(`561 Group site shutdown failed: ${error instanceof Error ? error.message : String(error)}`),
  });

  options.log?.(`561 Group site listening at https://561.group/ on ${host}:${running.port}`);
  return { ...running, host, watcher };
}

function envPort(): number | undefined {
  const raw = process.env.SITE_561_GROUP_PORT ?? process.env.PORT;
  if (raw === undefined) return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65_535) {
    throw new Error(`Invalid SITE_561_GROUP_PORT: ${raw}`);
  }
  return parsed;
}

function isMain(): boolean {
  return process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMain()) {
  serve561GroupSite({ log: (line) => console.log(line) }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

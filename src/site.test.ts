import assert from "node:assert/strict";
import { test } from "node:test";

import { start } from "@emsenn/http-holography";

import { create561GroupSiteApp } from "./index.ts";

test("serves the 561.group apex HTML", async () => {
  const running = await start(create561GroupSiteApp(), { host: "127.0.0.1", port: 0 });
  try {
    const response = await fetch(`http://127.0.0.1:${running.port}/`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html/);
    const body = await response.text();
    assert.match(body, /The 561 Group/);
    assert.match(body, /Black Liberation/);
    assert.match(body, /Indigenous Sovereignty/);
  } finally {
    await running.close();
  }
});

test("serves machine-readable site metadata", async () => {
  const running = await start(create561GroupSiteApp(), { host: "127.0.0.1", port: 0 });
  try {
    const response = await fetch(`http://127.0.0.1:${running.port}/site.json`);
    assert.equal(response.status, 200);
    const body = await response.json() as { url?: unknown; description?: unknown };
    assert.equal(body.url, "https://561.group/");
    assert.equal(typeof body.description, "string");
  } finally {
    await running.close();
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { verifyEphemerisOffer } from "../scripts/verify-ephemeris-offer.mjs";
import worker from "../src/worker.mjs";

const base = { x402Version: 2, resource: {}, accepts: [{ scheme: "exact", network: "eip155:8453", asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", payTo: "0x42F72C0a340A4A55C082Fe42483e87691D2bff64" }] };
function fixture({ moment = {}, precision = {} } = {}) {
  return async (url) => {
    const patch = url.includes("precision-moment") ? precision : moment;
    const amount = url.includes("precision-moment") ? "320000" : "40000";
    return new Response("{}", { status: 402, headers: { "payment-required": Buffer.from(JSON.stringify({ ...base, ...patch, resource: { url }, accepts: [{ ...base.accepts[0], amount, ...(patch.accepts?.[0] ?? {}) }] })).toString("base64url") } });
  };
}

test("qualifies the two public Base-USDC Ephemeris offers without paying", async () => {
  const result = await verifyEphemerisOffer({ fetchImpl: fixture() });
  assert.equal(result.qualified, true);
  assert.equal(result.offers.length, 2);
  assert.equal(result.authority.paymentAttempted, false);
});

test("refuses a market card when the payee or price drifts", async () => {
  const result = await verifyEphemerisOffer({ fetchImpl: fixture({ moment: { accepts: [{ payTo: "0x1111111111111111111111111111111111111111", amount: "9" }] } }) });
  assert.equal(result.qualified, false);
  assert.deepEqual(result.offers[0].problems, ["payee drift", "price drift"]);
});

test("one generated carrier serves the 561 Group apex and market projection", async () => {
  const apex = await worker.fetch(new Request("https://561.group/"));
  const apexBody = await apex.text();
  assert.equal(apex.status, 200);
  assert.match(apexBody, /Black Liberation/);
  assert.match(apexBody, /#F2EAD8/);
  assert.match(apexBody, /github\.com\/561-group/);

  const market = await worker.fetch(new Request("https://market.561.group/"));
  const marketBody = await market.text();
  assert.equal(market.status, 200);
  assert.match(marketBody, /Paid Ephemeris Gateway/);
  assert.match(marketBody, /eip155:8453/);
  assert.match(marketBody, /0x42F72C0a340A4A55C082Fe42483e87691D2bff64/);
});

test("the stale apex market path redirects to the market hostname", async () => {
  const response = await worker.fetch(new Request("https://561.group/market"));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://market.561.group/");
});

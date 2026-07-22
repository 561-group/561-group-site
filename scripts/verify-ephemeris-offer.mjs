const BASE = "eip155:8453";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913".toLowerCase();
const PAY_TO = "0x42F72C0a340A4A55C082Fe42483e87691D2bff64".toLowerCase();
const OFFERS = Object.freeze([
  Object.freeze({
    name: "Moment Essentials",
    url: "https://ephemeris.561.group/v1/ephemeris/moment/2026-07-22T00:00:00Z",
    amount: "40000",
  }),
  Object.freeze({
    name: "Precision Moment",
    url: "https://ephemeris.561.group/v1/ephemeris/precision-moment/2026-07-22T00:00:00Z?latitude=46.7867&longitude=-92.1005",
    amount: "320000",
  }),
]);

function decodePaymentRequired(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+={0,2}$/u.test(value)) throw new Error("payment-required header is absent or not base64url JSON");
  try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")); }
  catch { throw new Error("payment-required header does not decode to JSON"); }
}

function verifyChallenge(challenge, offer) {
  const problems = [];
  if (challenge?.x402Version !== 2) problems.push("expected x402 v2");
  if (challenge?.resource?.url !== offer.url) problems.push("resource URL drift");
  const matching = (challenge?.accepts ?? []).filter((entry) => entry?.scheme === "exact" && entry?.network === BASE);
  if (matching.length !== 1) problems.push("expected exactly one Base exact payment option");
  const acceptance = matching[0];
  if (acceptance?.asset?.toLowerCase() !== USDC) problems.push("USDC asset drift");
  if (acceptance?.payTo?.toLowerCase() !== PAY_TO) problems.push("payee drift");
  if (acceptance?.amount !== offer.amount) problems.push("price drift");
  return Object.freeze({ name: offer.name, url: offer.url, amount: offer.amount, qualified: problems.length === 0, problems: Object.freeze(problems) });
}

/** Public, no-payment assay of the market claims printed on the catalog. */
export async function verifyEphemerisOffer({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("one fetch implementation is required");
  const results = await Promise.all(OFFERS.map(async (offer) => {
    const response = await fetchImpl(offer.url, { method: "GET", redirect: "error", headers: { accept: "application/json" } });
    if (response.status !== 402) return Object.freeze({ name: offer.name, url: offer.url, amount: offer.amount, qualified: false, problems: Object.freeze([`expected HTTP 402, received ${response.status}`]) });
    return verifyChallenge(decodePaymentRequired(response.headers.get("payment-required")), offer);
  }));
  const qualified = results.every((result) => result.qualified);
  return Object.freeze({
    type: "561GroupMarketEphemerisOfferRequalification",
    qualified,
    offers: Object.freeze(results),
    settlement: Object.freeze({ network: BASE, asset: USDC, payTo: PAY_TO }),
    authority: Object.freeze({ publicReadOnly: true, paymentAttempted: false, settlementAttempted: false, deploymentAttempted: false }),
  });
}

if (process.argv[1]?.endsWith("verify-ephemeris-offer.mjs")) {
  try {
    const result = await verifyEphemerisOffer();
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exitCode = result.qualified ? 0 : 1;
  } catch (error) { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; }
}

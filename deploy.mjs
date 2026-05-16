import { createClient, createAccount } from "genlayer-js";
import { readFileSync } from "fs";

const PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const API_URL = "https://api.genbetapp.com";

const { chains } = await import("genlayer-js");
const account = createAccount(PRIVATE_KEY);
const client = createClient({ chain: chains.localnet, account });

console.log("Deploying from:", account.address);
const code = readFileSync("./contract.py", "utf8");

const txHash = await client.deployContract({ code, args: [API_URL] });
console.log("Tx hash:", txHash);
console.log("Waiting for FINALIZED...");

let receipt;
try {
  receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: "FINALIZED",
    interval: 4000,
    retries: 60,
  });
  const addr =
    receipt?.data?.contract_address ??
    receipt?.contractAddress ??
    "not found in receipt — see raw below";
  console.log("\n=== CONTRACT ADDRESS ===");
  console.log(addr);
  console.log("========================\n");
} catch (err) {
  // Fetch raw tx even if wait timed out
  console.error("Wait failed:", err.message);
  console.log("Fetching raw tx for contract address...");
  const raw = await client.getTransaction({ hash: txHash });
  const addr = raw?.data?.contract_address ?? JSON.stringify(raw, null, 2);
  console.log("\n=== CONTRACT ADDRESS (from raw tx) ===");
  console.log(addr);
  console.log("======================================\n");
}

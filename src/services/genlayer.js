import { createClient, createAccount as createGenLayerAccount, generatePrivateKey } from "genlayer-js";
import { testnet } from "genlayer-js/chains";

export const CONTRACT_ADDRESS = "0x3253E603ca06989daA11356785D0c4C3ab51593f";

const accountPrivateKey = localStorage.getItem("accountPrivateKey") || null;
export const account = accountPrivateKey ? createGenLayerAccount(accountPrivateKey) : null;

export const createAccount = () => {
  const newAccountPrivateKey = generatePrivateKey();
  localStorage.setItem("accountPrivateKey", newAccountPrivateKey);
  return createGenLayerAccount(newAccountPrivateKey);
};

export const removeAccount = () => {
  localStorage.removeItem("accountPrivateKey");
};

export const client = createClient({
  chain: testnet,
  account
});

const parseContractJson = (result) => {
  try {
    return typeof result === "string" ? JSON.parse(result) : result;
  } catch {
    return result;
  }
};

export const verifyPayment = async (playerAddress, receipt, baseContractAddress) => {
  if (!account) throw new Error("No active account. Please create an account first.");
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "verify_payment",
    args: [playerAddress, receipt, baseContractAddress],
  });
  return txHash;
};

export const checkValidPayment = async (playerAddress, receipt, baseContractAddress) => {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "check_valid_payment",
    args: [playerAddress, receipt, baseContractAddress],
  });
  return parseContractJson(result);
};

export const getMessage = async (receipt) => {
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_message",
    args: [receipt],
  });
  return parseContractJson(result);
};

export const getDeal = async (receipt) => getMessage(receipt);

export const approveManually = async (playerAddress, receipt, baseContractAddress) => {
  if (!account) throw new Error("No active account. Please create an account first.");
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "approve_manually",
    args: [playerAddress, receipt, baseContractAddress],
  });
  return txHash;
};
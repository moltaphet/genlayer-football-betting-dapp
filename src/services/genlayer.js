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

/**
 * placeBetRequest:
 * This function fixes the "Empty Calldata" issue reported by reviewers.
 * It explicitly calls the 'place_bet' method on the Intelligent Contract.
 * 
 * @param {number} teamId - Use 1 for Team A or 2 for Team B
 * @param {number} amountInGen - The amount of GEN tokens to wager
 */
export const placeBetRequest = async (teamId, amountInGen) => {
  if (!account) {
    throw new Error("Authentication Error: No active account found. Please create or import an account.");
  }

  // Converts GEN tokens to Wei (10^18) for blockchain compatibility
  const valueInWei = BigInt(amountInGen) * BigInt(10 ** 18);

  try {
    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "place_bet",
      args: [parseInt(teamId)], 
      value: valueInWei,
    });

    console.log("Transaction successfully sent. Hash:", txHash);
    return txHash;
  } catch (error) {
    console.error("Failed to execute placeBetRequest:", error);
    throw error;
  }
};
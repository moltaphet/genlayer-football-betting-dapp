import { createClient, createAccount as createGenLayerAccount, generatePrivateKey } from "genlayer-js";
import { testnet } from "genlayer-js/chains";

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

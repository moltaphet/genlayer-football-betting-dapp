/**
 * ============================================================
 * GENBET AI — genbet.js
 * Thin wrapper around genlayer-js for the FootballBets contract
 * deployed on GenLayer StudioNet. Signs writes via MetaMask
 * (account is passed as an address string, so genlayer-js routes
 * eth_* calls through window.ethereum).
 * ============================================================
 */

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

// Convert a decoded genlayer-js value (Map for TreeMap / dataclass) into a
// plain JS object. Leaves primitives untouched.
function mapToObject(value) {
  if (value instanceof Map) {
    const obj = {};
    for (const [k, v] of value.entries()) obj[k] = mapToObject(v);
    return obj;
  }
  return value;
}

export class GenBetContract {
  constructor(contractAddress, rpcUrl, account = null) {
    this.contractAddress = contractAddress;
    this.rpcUrl = rpcUrl;
    this.account = account;
    this._buildClient();
  }

  _buildClient() {
    this.client = createClient({
      chain: studionet,
      endpoint: this.rpcUrl,
      ...(this.account ? { account: this.account } : {}),
    });
  }

  // Pass the MetaMask address string; genlayer-js will sign through window.ethereum.
  setAccount(account) {
    this.account = account;
    this._buildClient();
  }

  // ── Reads ───────────────────────────────────────────────

  /** get_bets() -> caller's bets as an array of { id, ...betFields }. */
  async getBets() {
    const bets = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_bets",
      args: [],
    });
    const obj = mapToObject(bets);
    return Object.entries(obj).map(([id, bet]) => ({ id, ...bet }));
  }

  /** get_points() -> leaderboard sorted by points desc. */
  async getPoints() {
    const points = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_points",
      args: [],
    });
    const obj = mapToObject(points);
    return Object.entries(obj)
      .map(([address, pts]) => ({ address, points: Number(pts) }))
      .sort((a, b) => b.points - a.points);
  }

  /** get_player_points(address) -> number. */
  async getPlayerPoints(address) {
    if (!address) return 0;
    const points = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_player_points",
      args: [address],
    });
    return Number(points);
  }

  // ── Writes (signed via MetaMask) ────────────────────────

  /** create_bet(game_date, team1, team2, predicted_winner). */
  async createBet(gameDate, team1, team2, predictedWinner) {
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "create_bet",
      args: [gameDate, team1, team2, predictedWinner],
    });
    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "FINALIZED",
      interval: 5000,
      retries: 30,
    });
    return { txHash, receipt };
  }

  /** resolve_bet(bet_id). */
  async resolveBet(betId) {
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "resolve_bet",
      args: [betId],
    });
    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "FINALIZED",
      interval: 5000,
      retries: 30,
    });
    return { txHash, receipt };
  }
}

export default GenBetContract;

# GenBet — Decentralized Football Prediction Market

![GenLayer](https://img.shields.io/badge/Built%20on-GenLayer-6366f1?style=for-the-badge)
![Python](https://img.shields.io/badge/Contract-Python%203-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Vite](https://img.shields.io/badge/Build-Vite%205-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Network](https://img.shields.io/badge/Network-StudioNet-10b981?style=for-the-badge)

---

## Overview

**GenBet** is a decentralized football prediction market built on [GenLayer](https://genlayer.com) — the first blockchain with native AI inference inside smart contracts. Users place predictions on real football matches, and outcomes are resolved automatically by an Intelligent Contract that fetches live web data, applies LLM-based extraction, and reaches multi-validator consensus — without any centralized oracle or off-chain intermediary.

This project was built for the **GenLayer Buildathon** as a demonstration of real-world AI-Consensus applied to sports prediction markets.

**Deployed contract (StudioNet):** `0xf8895A42AECe956975083A2595b982321EF76615`

---

## Key Features

- **On-Chain Predictions** — Place match predictions directly through an Intelligent Contract; no intermediaries, no trusted third parties.
- **AI-Powered Resolution** — The contract fetches live match data from BBC Sport and uses an LLM to extract the final score and winner as structured JSON.
- **Leader / Validator Consensus** — Resolution runs as a non-deterministic block where a leader produces the result and every validator independently re-derives and gates it before any state change is committed.
- **Leaderboard & Points System** — Correct predictions earn on-chain points tracked in a `TreeMap`, exposed through a public leaderboard view.
- **MetaMask Wallet** — The frontend connects via MetaMask; writes are signed by the user's wallet through `genlayer-js`.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Intelligent Contract | Python 3 · GenVM · `py-genlayer` SDK |
| AI Oracle | `gl.nondet.web.render` + `gl.nondet.exec_prompt` |
| Consensus | `gl.vm.run_nondet_unsafe` (leader + validator gate) |
| Frontend | Vanilla JS + Tailwind CSS (CDN) |
| Build Tool | Vite 5 |
| Blockchain Client | `genlayer-js` v0.18 |
| Target Network | GenLayer StudioNet (gasless) |

---

## Smart Contract Details

The Intelligent Contract is written in Python and executed inside the GenVM. It passes `genvm-lint check` (lint + SDK validation).

### Storage Schema

```python
class FootballBets(gl.Contract):
    bets: TreeMap[str, Bet]        # key: "<address_hex>:<bet_id>"
    points: TreeMap[Address, u256]
```

Storage uses a **flat `TreeMap`** keyed by `"<address_hex>:<bet_id>"` (built by the `_bet_key` helper). This avoids nested `TreeMap` values, which the GenVM compiler rejects, while still scoping every bet to its owner. Standard Python `dict`/`list` are intentionally avoided in storage.

The `Bet` struct is a storage-compatible dataclass:

```python
@allow_storage
@dataclass
class Bet:
    id: str
    has_resolved: bool
    game_date: str
    resolution_url: str
    team1: str
    team2: str
    predicted_winner: str
    real_winner: str
    real_score: str
```

### Public Interface

| Method | Type | Description |
|---|---|---|
| `create_bet(game_date, team1, team2, predicted_winner)` | `@gl.public.write` | Records a new prediction for a match (one per match per address) |
| `resolve_bet(bet_id)` | `@gl.public.write` | Triggers AI resolution; awards a point if the prediction was correct |
| `get_bets()` | `@gl.public.view` | Returns the calling wallet's bets, keyed by `bet_id` |
| `get_points()` | `@gl.public.view` | Returns the full points leaderboard |
| `get_player_points(player_address)` | `@gl.public.view` | Returns the point total for a specific address |

### AI Resolution & Consensus

When `resolve_bet` is called, the contract runs a non-deterministic block. The **leader** fetches the page and runs the LLM; every **validator** independently re-runs the same logic and gates the leader's answer:

```python
def _check_match(self, resolution_url, team1, team2) -> dict:
    def leader_fn() -> dict:
        web_data = gl.nondet.web.render(resolution_url, mode="text")
        result = gl.nondet.exec_prompt(task, response_format="json")
        return {"score": str(result["score"]), "winner": int(result["winner"])}

    def validator_fn(leaders_res: gl.vm.Result) -> bool:
        if not isinstance(leaders_res, gl.vm.Return):
            return False
        validator_result = leader_fn()
        leader_winner = int(leaders_res.calldata["winner"])
        validator_winner = validator_result["winner"]
        # Agree on whether the match is finished, then on the exact winner.
        if (leader_winner < 0) != (validator_winner < 0):
            return False
        if leader_winner < 0 and validator_winner < 0:
            return True
        return leader_winner == validator_winner

    return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```

**Key design decisions:**

- **Leader/validator gate** — a validator accepts only if it independently agrees on whether the match finished and on the derived winner (team 1 / team 2 / draw), preventing any single validator from forcing an outcome.
- **`winner == -1` guard** — if the match has not finished, `resolve_bet` raises a `UserError` instead of resolving incorrectly.
- **`response_format="json"`** — the LLM is constrained to structured JSON output for robust parsing.
- **Error classification** — deterministic business-logic failures are raised with the `[EXPECTED]` prefix so validators compare them by exact match on the failure path.

---

## Project Structure

```
genbet/
├── contract.py          # Intelligent Contract (GenVM / Python)
├── deploy.mjs           # Deployment script (Node.js, StudioNet)
├── index.html           # Betting console UI (vanilla JS + Tailwind CDN)
├── .env.example         # Environment variable template
├── vite.config.js       # Vite build config
├── package.json
└── src/
    ├── main.js          # App logic: UI, MetaMask, contract wiring
    └── services/
        └── genbet.js    # genlayer-js StudioNet client wrapper (5 methods)
```

---

## Quick Start

### Prerequisites

- Node.js v18 or later, npm v9 or later
- [MetaMask](https://metamask.io) browser extension
- GenLayer CLI (`npm install -g genlayer`) if deploying yourself

> **StudioNet is gasless** — no tokens are required to deploy or interact.

### 1. Install

```bash
git clone https://github.com/moltaphet/genlayer-football-betting-dapp.git
cd genlayer-football-betting-dapp
npm install
```

### 2. (Optional) Deploy your own contract

The repo is pre-wired to a deployed StudioNet contract. To deploy your own:

```bash
# Using the GenLayer CLI (recommended)
genlayer network set studionet
genlayer deploy --contract contract.py

# …or the bundled script with a funded key
DEPLOYER_PRIVATE_KEY=0xYourPrivateKey node deploy.mjs
```

Copy the printed contract address. Update it in **two** places if you redeploy:
`CONTRACT_ADDRESS` in `src/main.js`, and `VITE_CONTRACT_ADDRESS` in `.env`.

```bash
cp .env.example .env   # then edit VITE_CONTRACT_ADDRESS
```

### 3. Run

```bash
npm run dev
```

Open **http://localhost:5173/** in a browser with MetaMask installed, connect your wallet, and place a prediction.

### 4. Production build

```bash
npm run build   # outputs to dist/
```

---

## How It Works — End to End

```
User connects MetaMask + selects match + predicted winner
           │
           ▼
  create_bet(game_date, team1, team2, predicted_winner)
  (stored as bets["<address>:<bet_id>"])
           │
           ▼
  match finishes in the real world
           │
           ▼
  resolve_bet(bet_id) called on-chain
           │
           ▼
  GenLayer leader + validators:
    1. Fetch BBC Sport page via gl.nondet.web.render()
    2. Run LLM extraction via gl.nondet.exec_prompt()
    3. Validators re-derive and gate the winner
           │
           ▼
  Consensus reached → result committed to chain
  Correct prediction? → points[sender] += 1
```

---

## Security Notes

- `.env` is excluded from version control. Never commit private keys or secrets.
- All contract state mutations require an explicit on-chain transaction signed in MetaMask.
- `DEPLOYER_PRIVATE_KEY` is read from the environment only by `deploy.mjs` and is never written to disk or bundled into the frontend.

---

## License

This project is licensed under the **MIT License**.

---

<p align="center">
  Built with Intelligent Contracts on <a href="https://genlayer.com">GenLayer</a>
</p>

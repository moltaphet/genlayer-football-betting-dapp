# GenBet — Decentralized Football Prediction Market

![GenLayer](https://img.shields.io/badge/Built%20on-GenLayer-6366f1?style=for-the-badge)
![Python](https://img.shields.io/badge/Contract-Python%203-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Vue 3](https://img.shields.io/badge/Frontend-Vue%203-42b883?style=for-the-badge&logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Build-Vite%205-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Network](https://img.shields.io/badge/Network-testnetAsimov-10b981?style=for-the-badge)

---

## Overview

**GenBet** is a fully decentralized football prediction market built on [GenLayer](https://genlayer.com) — the first blockchain with native AI inference inside smart contracts. Users place predictions on real football matches, and outcomes are resolved automatically by Intelligent Contracts that query live web data, apply LLM-based analysis, and reach multi-validator consensus — all without any centralized oracle or off-chain intermediary.

This project was built for the **GenLayer Buildathon** as a demonstration of real-world AI-Consensus applied to sports prediction markets.

---

## Key Features

- **On-Chain Predictions** — Place match predictions directly through an Intelligent Contract; no intermediaries, no trusted third parties.
- **AI-Powered Resolution** — The contract fetches live match data from the BBC Sport website and uses an LLM to extract the final score and winner in a structured JSON format.
- **Multi-Validator Strict Consensus** — Uses `gl.eq_principle_strict_eq` to guarantee all GenLayer validators independently reach the exact same result before any state change is committed.
- **Leaderboard & Points System** — Correct predictions earn on-chain points tracked in a `TreeMap`, with a live leaderboard visible to all users.
- **Dual Interface** — A polished betting console UI (`index.html`) and a full Vue 3 bets management dashboard (`app.html`) built from a single codebase.
- **Non-Custodial Accounts** — Private keys are generated client-side and stored only in `localStorage`; no wallet extension required.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Intelligent Contract | Python 3 · GenVM · `py-genlayer` SDK |
| Consensus Mechanism | `gl.eq_principle_strict_eq` (strict equivalence) |
| AI Oracle | `gl.get_webpage` + `gl.exec_prompt` |
| Frontend Framework | Vue 3 (Composition API) |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Blockchain Client | `genlayer-js` v0.18 |
| Target Network | GenLayer `testnetAsimov` |

---

## Smart Contract Details

The Intelligent Contract is written in Python and executed inside the GenVM. It adheres fully to the GenLayer SDK specification.

### Storage Schema

```python
class FootballBets(gl.Contract):
    bets: TreeMap[Address, TreeMap[str, Bet]]
    points: TreeMap[Address, u256]
```

All persistent state uses `TreeMap` — the GenLayer-native ordered map — ensuring deterministic serialization across validators. Standard Python `dict` and `list` are intentionally avoided in storage.

The `Bet` struct is declared as a storage-compatible dataclass:

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
| `create_bet(game_date, team1, team2, predicted_winner)` | `@gl.public.write` | Records a new prediction for a given match |
| `resolve_bet(bet_id)` | `@gl.public.write` | Triggers AI resolution; awards a point if prediction was correct |
| `get_bets()` | `@gl.public.view` | Returns all bets across all users |
| `get_points()` | `@gl.public.view` | Returns the full points leaderboard |
| `get_player_points(player_address)` | `@gl.public.view` | Returns the point total for a specific address |

### AI Resolution & Strict Consensus

When `resolve_bet` is called, the contract fetches live match data and applies a deterministic extraction pipeline:

```python
def _check_match(self, resolution_url: str, team1: str, team2: str) -> dict:
    def get_match_result() -> str:
        web_data = gl.get_webpage(resolution_url, mode="text")
        task = f"""
Extract the match result for:
Team 1: {team1}
Team 2: {team2}
...
Respond ONLY with the JSON object. No extra text, no markdown fences.
"""
        result = gl.exec_prompt(task).replace("```json", "").replace("```", "").strip()
        return json.dumps(json.loads(result), sort_keys=True)

    return json.loads(gl.eq_principle_strict_eq(get_match_result))
```

**Key design decisions:**

- `gl.eq_principle_strict_eq` — all validators must produce byte-identical JSON before the result is accepted. This prevents any single validator from manipulating the outcome.
- `json.dumps(..., sort_keys=True)` — key ordering is normalized before comparison, ensuring structural equivalence even if the LLM returns keys in different order.
- Markdown fence stripping — the LLM output is sanitized before `json.loads`, making the pipeline robust against common model formatting quirks.
- `winner = -1` guard — if the match has not finished, the contract raises a `UserError` rather than resolving with an incorrect result.

---

## Project Structure

```
genbet/
├── contract.py              # Intelligent Contract (GenVM / Python)
├── deploy.mjs               # Deployment script (Node.js, testnetAsimov)
├── index.html               # Betting console UI (vanilla JS + Tailwind)
├── app.html                 # Bets dashboard entry point (Vue 3)
├── .env.example             # Environment variable template
├── vite.config.js           # Vite multi-entry build config
├── package.json
└── src/
    ├── vue-main.js          # Vue app entry point
    ├── App.vue              # Root component with Suspense boundary
    ├── style.css
    ├── components/
    │   ├── BetsScreen.vue   # Main bets dashboard component
    │   └── Address.vue      # Address display with truncation
    ├── logic/
    │   └── FootballBets.js  # Contract interaction class
    └── services/
        └── genlayer.js      # genlayer-js client + account management
```

---

## Quick Start

### Prerequisites

- Node.js v18 or later
- npm v9 or later
- A GenLayer account with testnet funds

### 1. Clone the Repository

```bash
git clone https://github.com/moltaphet/genlayer-football-betting-dapp.git
cd genlayer-football-betting-dapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set the following:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddressHere
VITE_STUDIO_URL=https://studio.genlayer.com/api
```

> `VITE_CONTRACT_ADDRESS` is the address you receive after deploying the contract (see Step 4).
> `VITE_STUDIO_URL` points to the GenLayer Studio API endpoint used by `genlayer-js`.

### 4. Deploy the Intelligent Contract

The deployment script targets `testnetAsimov` and requires a private key with testnet funds:

```bash
DEPLOYER_PRIVATE_KEY=0xYourPrivateKey node deploy.mjs
```

On success, the contract address is printed to the console:

```
Deploying from: 0xYourAddress
Tx hash: 0x...
Waiting for FINALIZED...

=== CONTRACT ADDRESS ===
0xYourDeployedContractAddress
========================
```

Copy this address into `VITE_CONTRACT_ADDRESS` in your `.env` file.

### 5. Run the Development Server

```bash
npm run dev
```

The application is served at `http://localhost:5173`.

| Entry Point | URL | Description |
|---|---|---|
| Betting Console | `http://localhost:5173/` | Full-screen betting UI with live match odds |
| Bets Dashboard | `http://localhost:5173/app.html` | Vue 3 dashboard to create/resolve bets and view leaderboard |

### 6. Production Build

```bash
npm run build
```

Output is written to `dist/`. Both `index.html` and `app.html` entry points are bundled and optimized.

---

## How It Works — End to End

```
User selects match + predicted winner
           │
           ▼
  create_bet() called on-chain
  (stored in TreeMap[sender][bet_id])
           │
           ▼
  match finishes in real world
           │
           ▼
  resolve_bet(bet_id) called on-chain
           │
           ▼
  GenLayer validators independently:
    1. Fetch BBC Sport page via gl.get_webpage()
    2. Run LLM extraction via gl.exec_prompt()
    3. Normalize JSON with sort_keys=True
    4. Compare outputs → gl.eq_principle_strict_eq()
           │
           ▼
  Consensus reached → result committed to chain
  Correct prediction? → points[sender] += 1
```

---

## Security Notes

- `.env` is excluded from version control via `.gitignore`. Never commit private keys or contract addresses to a public repository.
- Private keys used by the frontend are generated client-side and stored in browser `localStorage` only — they are never transmitted to any server.
- All contract state mutations require an explicit on-chain transaction signed by the user's account.

---

## License

This project is licensed under the **MIT License**.

---

<p align="center">
  Built with Intelligent Contracts on <a href="https://genlayer.com">GenLayer</a> · GenLayer Buildathon 2025
</p>

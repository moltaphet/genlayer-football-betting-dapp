```markdown

# ⚽ GenBet AI: Intelligent Football Prediction Market
**Built for the GenLayer Ecosystem**

GenBet AI is a decentralized prediction market that leverages **GenLayer's Intelligent Contracts** and AI-powered validators to automate match resolutions using real-time data from sources like BBC Sport.

---

## 🎓 Technical Deep Dive (Educational Guide)

### 1. The Symmetric Risk-Reward Logic
Unlike traditional platforms, GenBet implements a **Symmetric Risk Engine**. This ensures a fair 1:1 ratio between the user's potential net profit and their risk, calculated dynamically based on AI-provided odds.

**The Math:**
* **Net Profit:** $Stake \times (Odds - 1)$
* **Risk:** $Net Profit$ (Automatically balanced by the contract)

**JavaScript Implementation:**
```javascript
const netProfit = amount * (selectedOdds - 1);
lossDisplay.innerText = `-${netProfit.toFixed(2)} GEN`; // Dynamic Risk Calculation

```

### 2. Intelligent Oracle Integration

We use GenLayer's unique **AI Web Rendering** capabilities. The contract doesn't just fetch data; it "reads" the sports page to determine the winner.

* **Source:** BBC Sport / Real-time API
* **Validation:** AI-powered nodes (e.g., Mistral) achieve consensus on the final score.

---

## 🛠 Prerequisites & Setup

GenBet requires **Docker** and the **GenLayer CLI** to run its local node and validator infrastructure.

1. **Start Local Node:**

```bash
pip install py-genlayer
genlayer up

```

2. **AI Validator:** Ensure an AI validator (Mistral/OpenAI) is active in your local node dashboard with a valid API key.

---

## 🚀 Deployment & Smart Contract

### 1. Using GenLayer Studio

* Load `contracts/football_bets.py` into the GenLayer Studio.
* **Constructor Inputs:** * `game_date`: YYYY-MM-DD
* `team1` / `team2`: Names of the competing clubs.


* Click **Deploy** to generate the Contract Address.

### 2. Contract Methods

* `place_bet(selection)`: Submit your prediction (1, 2, or 0).
* `resolve()`: Triggers the `gl.nondet.web.render` logic to scrape results and process payouts.

---

## 📂 Project Structure

* `contracts/`: Python-based Intelligent Contracts for GenLayer.
* `frontend/`: Responsive UI built with Tailwind CSS and GenLayer-JS.
* `tests/`: Automated scripts for verifying bet logic.

---

## 🔗 Submission Evidence

* **Live Demo:** [genlayer-football-betting-dapp.vercel.app](https://www.google.com/search?q=https://genlayer-football-betting-dapp.vercel.app/)
* **Project Goal:** To demonstrate how AI Oracles can eliminate human error in decentralized betting.

---

*Developed by @0xehs4hn for GenLayer Buildathon 2026.*

# genlayer-football-betting-dapp
# ⚽ GenLayer Football Betting DApp

A decentralized football prediction market built on the **GenLayer** network. This project leverages **Intelligent Contracts** to automatically resolve match outcomes by analyzing real-time data from BBC Sport using AI-powered validators.

---

## 🛠 Prerequisites & Setup

To get this project running locally, follow these steps in order:

### 1. Environment Setup (Docker)
GenLayer requires Docker to run its local node and validator infrastructure.
* **Install Docker Desktop**: Ensure it is running on your system.
* **Install GenLayer CLI**: Run the following in your terminal:
    `pip install py-genlayer`
* **Start Local Node**: Navigate to the project root and run:
    `genlayer up`

### 2. AI Validator Configuration
The match resolution depends on an active AI validator to achieve consensus.
* Go to your local node management dashboard.
* Ensure a validator (e.g., **Mistral**) is active with a valid API key to finalize transactions.

---

## 🚀 Deployment & Usage

### 1. Using GenLayer Studio
The [GenLayer Studio](http://localhost:8080) provides a visual interface for testing.
* Load `football_bets.py` from the `contracts/` directory into the Studio.
* Fill the **Constructor Inputs** with match details:
    * `game_date`: Format `YYYY-MM-DD` (e.g., 2024-05-19).
    * `team1`: First team name.
    * `team2`: Second team name.
* Click **Deploy** to generate your unique Contract Address.

### 2. Smart Contract Methods
* **`place_bet(selection)`**: Allows users to send tokens and choose a winner (1, 2, or 0 for Draw).
* **`resolve()`**: Triggers the `gl.nondet.web.render` logic to scrape BBC Sport and uses AI to determine the final result.

---

## 📂 Project Structure
* `contracts/`: Contains Python-based Intelligent Contracts.
* `frontend/`: (In Development) Web interface to interact with the blockchain.
* `tests/`: Automated scripts to verify contract logic.

---

## 🔗 Git Integration
To push your latest changes to GitHub:
1. `git add .`
2. `git commit -m "Complete documentation and core logic"`
3. `git push origin main`
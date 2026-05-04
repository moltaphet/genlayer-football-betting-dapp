# GenBet AI - Intelligent Prediction Market

GenBet is a decentralized football betting platform powered by GenLayer's Intelligent Contracts. It leverages AI-Consensus to resolve match results without relying on centralized oracles.

## 🚀 Key Improvements (Resubmission)
- **Unified Architecture**: All core files (`contract.py`, `genlayer.js`) are now in the root and `/src` directories for better accessibility.
- **True Intelligent Transactions**: Fixed the "Empty Calldata" issue. The frontend now correctly invokes contract methods (`place_bet`) instead of plain wallet transfers.
- **AI-Consensus Logic**: Integrated multi-proposer consensus to fetch and verify real-world scores via the GenLayer Oracle[cite: 1].

## 🛠️ Project Structure
- `contract.py`: The Intelligent Contract (Python) containing the betting logic and AI-Consensus[cite: 1].
- `src/services/genlayer.js`: Updated service layer to handle structured contract calls.
- `GenLayer_Research_Report.pdf`: Technical research on LLM-driven contracts and security analysis[cite: 1].
- `src/`: Frontend Vue.js application source code.

## ⚙️ Requirements
- A running **GenLayer Studio** (Local or Hosted).
- Node.js (v18+) and npm.

## 🏃‍♂️ Quick Start

### 1. Deploy the Contract
1. Open **GenLayer Studio**.
2. Create a new contract and paste the contents of `contract.py`.
3. Deploy the contract. 
4. **Copy the Deployed Address.**

### 2. Configure Frontend
1. Open `src/services/genlayer.js`.
2. Replace `CONTRACT_ADDRESS` with your copied address:
   ```javascript
   export const CONTRACT_ADDRESS = "your_deployed_address_here";
   ```

### 3. Run the App
```bash
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

## ⚽ How it Works
1. **Place Bet**: Users select a team and wager GEN tokens. This triggers the `place_bet` method on-chain.
2. **Oracle Resolution**: Once the game ends, the `resolve_market` function is called.
3. **AI Consensus**: GenLayer validators fetch the result from a sports URL, reach a consensus on the score using strict JSON schema validation, and update the winner state[cite: 1].
4. **Automated Payouts**: The contract calculates rewards and transfers GEN tokens to the winners automatically.

## 📜 License
This project is licensed under the MIT License.
```
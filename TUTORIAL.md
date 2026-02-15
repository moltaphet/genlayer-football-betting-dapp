# 🎓 GenBet AI: Building a Decentralized Prediction Market
**Author: @0xehs4hn**

This technical tutorial provides a step-by-step breakdown of **GenBet AI**, a decentralized sports prediction console built on **GenLayer**. We explore the integration of Intelligent Oracles, symmetric risk-reward logic, and the blockchain-to-UI communication flow.

---

## 1. Project Concept & Vision
**GenBet AI** is a decentralized betting DApp that eliminates the need for central bookmakers. By leveraging **GenLayer’s Intelligent Oracles**, we ensure that match results are verified by AI, providing a transparent and tamper-proof environment for users.

---

## 2. The Math: Symmetric Risk-Reward Engine
In traditional betting, risk management is often opaque. In GenBet, we implemented a **Symmetric Risk-Reward Model** to ensure fairness.

### The Formula:
* **Net Profit:** $Stake \times (Odds - 1)$
* **Risk on Loss:** Mathematically tied to the potential Net Profit ($Risk = Net Profit$).

### JavaScript Implementation (`app.js`):
This snippet shows how the UI dynamically calculates potential gains and losses in real-time as the user inputs their stake.

```javascript
// Core function for symmetric risk calculation
const calculateBets = () => {
    const amount = parseFloat(amountInput.value) || 0;
    
    // Calculate profit based on the selected multiplier (selectedOdds)
    const netProfit = amount * (selectedOdds - 1);
    const totalPayout = amount + netProfit;

    // Update UI elements
    payoutDisplay.innerText = totalPayout.toFixed(2);
    netProfitDisplay.innerText = `+${netProfit.toFixed(2)} GEN`;
    
    // In this model, the risk is exactly equal to the potential net gain
    // This creates a fair 1:1 Risk/Reward ratio based on the odds
    lossDisplay.innerText = `-${netProfit.toFixed(2)} GEN`;
};
3. Blockchain Integration (GenLayer Simnet)
We utilize the GenLayer-JS SDK and MetaMask to handle decentralized transactions. Every bet is a state-changing transaction on the GenLayer Simnet.

Wallet Connection Logic:
JavaScript
async function connectWallet() {
    if (window.ethereum) {
        try {
            // Requesting access to MetaMask accounts
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            
            // UI State Management for connected wallet
            connectBtn.innerHTML = `<span>${userAddress.substring(0, 6)}...${userAddress.substring(38)}</span>`;
            walletDot.className = "w-2.5 h-2.5 bg-green-500 rounded-full"; // Green online status
            
            showStatus('Wallet Connected Successfully!', 'success');
        } catch (err) {
            showStatus('Connection Denied', 'error');
        }
    } else {
        showStatus('Please Install MetaMask to use GenBet AI', 'error');
    }
}
4. Leveraging Intelligent Oracles
The core innovation of GenLayer is the Intelligent Contract. Unlike legacy smart contracts, these can interact with LLMs to interpret real-world data from the internet.

The Oracle's Role in GenBet AI:

Contextual Verification: The AI Oracle fetches final scores and reasons through potential anomalies (e.g., postponed matches or disputed results).

Automated Settlement: Once the Oracle verifies the outcome via natural language processing, the contract automatically settles the balance between winners and the liquidity pool.

5. UI/UX Design Principles

The interface is built with Tailwind CSS, focusing on a "Finance-First" user experience:

Glassmorphism: A modern, translucent navigation bar for aesthetic clarity and focus.

Live Betting History: A real-time data table showing recent network activity and user predictions.

Dynamic Visuals: CSS animations (shake/scale) to provide instant haptic-like feedback on user actions and stake changes.

6. Local Setup & Deployment

To run this project locally and start contributing:

Clone the repository: git clone https://github.com/moltaphet/genlayer-football-betting-dapp

Run with Live Server: Open index.html via a local server (e.g., VS Code Live Server).

Network Setup: Ensure MetaMask is connected to the GenLayer Simnet.

Interact: Input your stake, select your odds, and submit your prediction to the blockchain.
import { createGenLayerClient } from 'genlayer-js';

// 1. Connection setup
const client = createGenLayerClient({ endpoint: "http://localhost:8080" });

// 2. IMPORTANT: Paste your purple address from GenLayer Studio here
const CONTRACT_ADDRESS = "0xEBb2863137Dff7e96886090D303373E8Ec9CF5B8"; 

// Function to refresh data from the blockchain
async function refreshData() {
    try {
        const data = await client.readContract({
            address: CONTRACT_ADDRESS,
            functionName: 'get_market_data'
        });

        document.getElementById('pool-amount').innerText = data.total_pool;
        if (data.has_resolved) {
            document.getElementById('status').innerText = "Match Resolved";
            document.getElementById('match-score').innerText = data.score;
        }
    } catch (err) { console.log("Blockchain sync error..."); }
}

// Function to place a bet
window.bet = async (side) => {
    const amount = prompt("How many tokens to bet?");
    if(!amount) return;

    try {
        await client.writeContract({
            address: CONTRACT_ADDRESS,
            functionName: 'place_bet',
            args: [side],
            value: parseInt(amount)
        });
        alert("Bet successfully recorded on GenLayer!");
        refreshData();
    } catch (err) { alert("Transaction failed. Check your node."); }
};

// Admin function to trigger AI scraping
window.resolveMarket = async () => {
    alert("AI Validator is now rendering BBC Sport...");
    await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'resolve'
    });
    refreshData();
};

// Initial load
refreshData();
setInterval(refreshData, 10000); // Auto-refresh every 10s
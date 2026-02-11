import { createGenLayerClient } from 'genlayer-js';

// 1. Connection setup
const client = createGenLayerClient({ endpoint: "http://localhost:8080" });

// 2. Contract Address from GenLayer Studio
const CONTRACT_ADDRESS = "0xEBb2863137Dff7e96886090D303373E8Ec9CF5B8"; 

// 3. Mock Data for UI (Since contract data is local)
const matches = {
    today: { t1: "Real Madrid", t2: "Barcelona", time: "LIVE" },
    tomorrow: { t1: "Arsenal", t2: "Man City", time: "FEB 12 - 20:45" }
};

// 4. UI Logic: Change Day
window.changeDay = function(day) {
    // Update Button Styles
    document.getElementById('btn-today').classList.toggle('active-date', day === 'today');
    document.getElementById('btn-tomorrow').classList.toggle('active-date', day === 'tomorrow');
    document.getElementById('btn-today').classList.toggle('text-slate-500', day !== 'today');
    document.getElementById('btn-tomorrow').classList.toggle('text-slate-500', day !== 'tomorrow');

    // Update Team Names in UI
    document.getElementById('team1-label').innerText = matches[day].t1;
    document.getElementById('team2-label').innerText = matches[day].t2;
    document.getElementById('match-time').innerText = matches[day].time;
}

// 5. Blockchain Logic: Refresh data
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
    } catch (err) { 
        console.log("Blockchain sync error - Ensure your node is running."); 
    }
}

// 6. Interaction: Place a bet
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
    } catch (err) { 
        alert("Transaction failed. Check your local node (genlayer up)."); 
    }
};

// 7. Admin: Trigger AI
window.resolveMarket = async () => {
    alert("AI Oracle is now analyzing real-time sports data...");
    try {
        await client.writeContract({
            address: CONTRACT_ADDRESS,
            functionName: 'resolve'
        });
        refreshData();
    } catch (err) {
        alert("Resolution failed. Check node logs.");
    }
};

// 8. Initialization
window.onload = () => {
    changeDay('today');
    refreshData();
    setInterval(refreshData, 10000); // Sync every 10s
};
import { createGenLayerClient } from 'genlayer-js';

const client = createGenLayerClient({ endpoint: "http://localhost:8080" });
const CONTRACT_ADDRESS = "0xEBb2863137Dff7e96886090D303373E8Ec9CF5B8"; 

const matches = {
    today: { 
        t1: "Real Madrid", 
        t2: "Barcelona", 
        time: "LIVE",
        t1_logo: "https://flagcdn.com/w160/es.png",
        t2_logo: "https://flagcdn.com/w160/es.png"
    },
    tomorrow: { 
        t1: "Arsenal", 
        t2: "Man City", 
        time: "FEB 12 - 20:45",
        t1_logo: "https://flagcdn.com/w160/gb.png",
        t2_logo: "https://flagcdn.com/w160/gb.png"
    }
};

window.changeDay = function(day) {
    const btnToday = document.getElementById('btn-today');
    const btnTomorrow = document.getElementById('btn-tomorrow');
    
    // Toggle active styles for date buttons
    btnToday.classList.toggle('active-date', day === 'today');
    btnToday.classList.toggle('text-slate-500', day !== 'today');
    btnTomorrow.classList.toggle('active-date', day === 'tomorrow');
    btnTomorrow.classList.toggle('text-slate-500', day !== 'tomorrow');

    // Update Team Info (Names and Logos) in the separate boxes
    document.getElementById('team1-name').innerText = matches[day].t1.toUpperCase();
    document.getElementById('team2-name').innerText = matches[day].t2.toUpperCase();
    document.getElementById('team1-logo').src = matches[day].t1_logo;
    document.getElementById('team2-logo').src = matches[day].t2_logo;
    document.getElementById('match-time').innerText = matches[day].time;
};

async function refreshData() {
    try {
        const data = await client.readContract({
            address: CONTRACT_ADDRESS,
            functionName: 'get_market_data'
        });
        document.getElementById('pool-amount').innerText = data.total_pool;
        if (data.has_resolved) {
            document.getElementById('status').innerText = "Match Resolved";
        }
    } catch (err) { 
        console.log("Sync error - Ensure 'genlayer up' is running locally."); 
    }
}

window.bet = async (side) => {
    const amount = prompt("Enter GEN amount to bet:");
    if(!amount) return;
    try {
        await client.writeContract({
            address: CONTRACT_ADDRESS,
            functionName: 'place_bet',
            args: [side],
            value: parseInt(amount)
        });
        alert("Bet recorded successfully!");
        refreshData();
    } catch (err) { 
        alert("Transaction failed. Is your local node active?"); 
    }
};

window.resolveMarket = async () => {
    alert("AI Oracle is now verifying the result from the web...");
    try {
        await client.writeContract({ 
            address: CONTRACT_ADDRESS, 
            functionName: 'resolve' 
        });
        refreshData();
    } catch (err) { 
        alert("Resolution failed. Check your contract logic."); 
    }
};

// Initial load
window.onload = () => {
    changeDay('today');
    refreshData();
    setInterval(refreshData, 10000);
};
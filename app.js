import { createGenLayerClient } from 'genlayer-js';

const client = createGenLayerClient({ endpoint: "http://localhost:8080" });
const CONTRACT_ADDRESS = "0xEBb2863137Dff7e96886090D303373E8Ec9CF5B8"; 

const matches = {
    today: { t1: "Real Madrid", t2: "Barcelona", time: "LIVE" },
    tomorrow: { t1: "Arsenal", t2: "Man City", time: "FEB 12 - 20:45" }
};

// UI: Day Switcher
window.changeDay = function(day) {
    const btnToday = document.getElementById('btn-today');
    const btnTomorrow = document.getElementById('btn-tomorrow');
    
    if (day === 'today') {
        btnToday.classList.add('active-date');
        btnToday.classList.remove('text-slate-500');
        btnTomorrow.classList.remove('active-date');
        btnTomorrow.classList.add('text-slate-500');
    } else {
        btnTomorrow.classList.add('active-date');
        btnTomorrow.classList.remove('text-slate-500');
        btnToday.classList.remove('active-date');
        btnToday.classList.add('text-slate-500');
    }

    document.getElementById('team1-label').innerText = matches[day].t1;
    document.getElementById('team2-label').innerText = matches[day].t2;
    document.getElementById('match-time').innerText = matches[day].time;
};

// Blockchain: Read
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
        console.log("Sync error - Check if 'genlayer up' is running."); 
    }
}

// Blockchain: Write Bet
window.bet = async (side) => {
    const amount = prompt("Enter amount to bet:");
    if(!amount) return;
    try {
        await client.writeContract({
            address: CONTRACT_ADDRESS,
            functionName: 'place_bet',
            args: [side],
            value: parseInt(amount)
        });
        alert("Bet recorded!");
        refreshData();
    } catch (err) { alert("Error: Node not responding."); }
};

// Blockchain: Resolve
window.resolveMarket = async () => {
    alert("AI Oracle analyzing data...");
    try {
        await client.writeContract({
            address: CONTRACT_ADDRESS,
            functionName: 'resolve'
        });
        refreshData();
    } catch (err) { alert("Resolution failed."); }
};

// Init
window.onload = () => {
    changeDay('today');
    refreshData();
    setInterval(refreshData, 10000);
};
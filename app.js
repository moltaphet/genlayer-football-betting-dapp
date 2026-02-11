// DATABASE WITH STABLE SVG LOGOS
const matchData = [
    { id: "m1", date: "Today, Feb 11", t1: "Real Madrid", t2: "Barcelona", t1_img: "https://crests.football-data.org/86.svg", t2_img: "https://crests.football-data.org/81.svg" },
    { id: "m2", date: "Feb 12, 20:45", t1: "Arsenal", t2: "Man City", t1_img: "https://crests.football-data.org/57.svg", t2_img: "https://crests.football-data.org/65.svg" },
    { id: "m3", date: "Feb 13, 21:00", t1: "B. Munich", t2: "PSG", t1_img: "https://crests.football-data.org/5.svg", t2_img: "https://crests.football-data.org/524.svg" },
    { id: "m4", date: "Feb 14, 18:30", t1: "Liverpool", t2: "Chelsea", t1_img: "https://crests.football-data.org/64.svg", t2_img: "https://crests.football-data.org/61.svg" }
];

// STATE MANAGEMENT
let selectedOdds = 1.5;
let currentMatchId = "m1";
let userAccount = null;

// DOM ELEMENTS
const amountInput = document.getElementById('bet-amount');
const payoutDisplay = document.getElementById('calc-payout');
const netProfitDisplay = document.getElementById('net-profit');
const lossDisplay = document.getElementById('calc-loss');
const connectBtn = document.getElementById('connect-btn');
const walletDot = document.getElementById('wallet-dot');

// BALANCED RISK CALCULATOR LOGIC
const calculateBets = () => {
    const amount = parseFloat(amountInput.value) || 0;
    
    // Total Payout calculation
    const totalPayout = amount * selectedOdds;
    
    // Net Profit calculation (Potential Gain)
    const netProfit = totalPayout - amount;
    
    // NEW LOSS LOGIC: Risk equals the Potential Net Profit
    // If user stands to win 15 GEN, they also stand to lose only 15 GEN.
    const riskAmount = netProfit;

    payoutDisplay.innerText = totalPayout.toFixed(2);
    netProfitDisplay.innerText = `+${netProfit.toFixed(2)} GEN`;
    lossDisplay.innerText = `-${riskAmount.toFixed(2)} GEN`;
};

// ODDS SELECTION UI
window.setOdds = (odds, btn) => {
    selectedOdds = odds;
    document.querySelectorAll('.odds-btn').forEach(b => {
        b.className = "odds-btn py-2.5 bg-slate-50 rounded-xl text-[10px] font-black border border-slate-100 transition-all";
    });
    btn.className = "odds-btn py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black border border-blue-600 transition-all shadow-md";
    calculateBets();
};

// UI UPDATE ENGINE
const updateUI = (id) => {
    currentMatchId = id;
    const data = matchData.find(m => m.id === id);
    
    document.getElementById('match-date-display').innerText = data.date;
    document.getElementById('team1-name').innerText = data.t1;
    document.getElementById('team2-name').innerText = data.t2;
    
    const img1 = document.getElementById('team1-logo');
    const img2 = document.getElementById('team2-logo');
    
    img1.src = data.t1_img;
    img2.src = data.t2_img;

    const fallback = 'https://cdn-icons-png.flaticon.com/512/53/53283.png';
    img1.onerror = () => { img1.src = fallback; };
    img2.onerror = () => { img2.src = fallback; };

    renderSidebar();
    calculateBets();
};

// SIDEBAR RENDERER
const renderSidebar = () => {
    const list = document.getElementById('side-match-list');
    list.innerHTML = '';
    matchData.forEach(m => {
        const isActive = m.id === currentMatchId;
        const card = document.createElement('div');
        card.className = `match-card p-4 rounded-2xl flex flex-col ${isActive ? 'active-match' : 'bg-white shadow-sm'}`;
        card.innerHTML = `
            <span class="text-[9px] font-bold ${isActive ? 'text-blue-500' : 'text-slate-400'} uppercase">${m.date}</span>
            <span class="text-[11px] font-black text-slate-800">${m.t1} vs ${m.t2}</span>
        `;
        card.onclick = () => updateUI(m.id);
        list.appendChild(card);
    });
};

// WALLET CONNECTION (WEB3)
const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            connectBtn.querySelector('span').innerText = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
            walletDot.className = "w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]";
        } catch (error) {
            console.error("Connection failed");
        }
    } else {
        alert("Wallet extension not detected");
    }
};

// EVENT LISTENERS
amountInput.oninput = calculateBets;
connectBtn.onclick = connectWallet;

document.getElementById('bet-t1').onclick = () => {
    const team = matchData.find(m => m.id === currentMatchId).t1;
    alert(`ACTION: Staking on ${team}`);
};

document.getElementById('bet-t2').onclick = () => {
    const team = matchData.find(m => m.id === currentMatchId).t2;
    alert(`ACTION: Staking on ${team}`);
};

// INITIALIZE
window.onload = () => {
    updateUI("m1");
};
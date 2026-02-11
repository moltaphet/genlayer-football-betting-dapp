// DATABASE
const matchData = [
    { id: "m1", date: "Today, Feb 11", t1: "Real Madrid", t2: "FC Barcelona", t1_img: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg", t2_img: "https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_logo.svg/1024px-FC_Barcelona_logo.svg.png" },
    { id: "m2", date: "Feb 12, 20:45", t1: "Arsenal", t2: "Manchester City", t1_img: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg", t2_img: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" },
    { id: "m3", date: "Feb 13, 21:00", t1: "Bayern Munich", t2: "Paris SG", t1_img: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/1024px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png", t2_img: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg" },
    { id: "m4", date: "Feb 14, 18:30", t1: "Liverpool", t2: "Chelsea", t1_img: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg", t2_img: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg" }
];

// STATE
let currentMatchId = "m1";
let userAccount = null;
let selectedOdds = 1.5;

// DOM ELEMENTS
const amountInput = document.getElementById('bet-amount');
const payoutDisplay = document.getElementById('calc-payout');
const lossDisplay = document.getElementById('calc-loss');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');

// CALCULATION LOGIC
const calculateBets = () => {
    const amount = parseFloat(amountInput.value) || 0;
    payoutDisplay.innerText = (amount * selectedOdds).toFixed(2);
    lossDisplay.innerText = `-${amount.toFixed(2)} GEN`;
};

window.setOdds = (odds, btn) => {
    selectedOdds = odds;
    document.querySelectorAll('.odds-btn').forEach(b => {
        b.className = "odds-btn py-2.5 bg-slate-50 rounded-xl text-[10px] font-black border border-slate-100 transition-all";
    });
    btn.className = "odds-btn py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black border border-blue-600 transition-all shadow-md";
    calculateBets();
};

// UI UPDATES
const updateUI = (matchId) => {
    currentMatchId = matchId;
    const data = matchData.find(m => m.id === matchId);
    document.getElementById('match-date-display').innerText = data.date;
    document.getElementById('team1-name').innerText = data.t1;
    document.getElementById('team2-name').innerText = data.t2;
    document.getElementById('team1-logo').src = data.t1_img;
    document.getElementById('team2-logo').src = data.t2_img;
    renderSidebar();
};

const renderSidebar = () => {
    const list = document.getElementById('side-match-list');
    list.innerHTML = '';
    matchData.forEach(match => {
        const isActive = match.id === currentMatchId;
        const card = document.createElement('div');
        card.className = `match-card p-4 rounded-2xl flex flex-col gap-1 ${isActive ? 'active-match' : 'bg-white'}`;
        card.innerHTML = `
            <span class="text-[9px] font-bold ${isActive ? 'text-blue-500' : 'text-slate-400'} uppercase">${match.date}</span>
            <div class="flex justify-between items-center text-[11px] font-black text-slate-800">
                <span>${match.t1} vs ${match.t2}</span>
                <div class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}"></div>
            </div>`;
        card.onclick = () => updateUI(match.id);
        list.appendChild(card);
    });
};

// WALLET LOGIC
const connect = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            connectBtn.querySelector('span').innerText = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
            document.getElementById('wallet-dot').className = "w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]";
            disconnectBtn.classList.add('hidden');
        } catch (e) { console.error(e); }
    } else { alert("MetaMask not found!"); }
};

const disconnect = () => {
    userAccount = null;
    connectBtn.querySelector('span').innerText = "Connect Wallet";
    document.getElementById('wallet-dot').className = "w-2.5 h-2.5 bg-slate-300 rounded-full";
    disconnectBtn.classList.add('hidden');
};

// EVENTS
amountInput.oninput = calculateBets;
connectBtn.onclick = () => userAccount ? disconnectBtn.classList.toggle('hidden') : connect();
disconnectBtn.onclick = (e) => { e.stopPropagation(); disconnect(); };
document.getElementById('bet-t1').onclick = () => alert(`Placing ${amountInput.value} GEN bet on ${matchData.find(m=>m.id===currentMatchId).t1}`);
document.getElementById('bet-t2').onclick = () => alert(`Placing ${amountInput.value} GEN bet on ${matchData.find(m=>m.id===currentMatchId).t2}`);

window.onload = () => { updateUI("m1"); calculateBets(); };
// CONFIGURATION
const CONTRACT_ADDRESS = "0x4d8Cd6Caa7D7681AeF2E3B6e21FFB3238eCb4814";

// DATABASE
const matchData = [
    { id: "m1", date: "Today, Feb 11", t1: "Real Madrid", t2: "Barcelona", t1_img: "https://crests.football-data.org/86.svg", t2_img: "https://crests.football-data.org/81.svg" },
    { id: "m2", date: "Feb 12, 20:45", t1: "Arsenal", t2: "Man City", t1_img: "https://crests.football-data.org/57.svg", t2_img: "https://crests.football-data.org/65.svg" },
    { id: "m3", date: "Feb 13, 21:00", t1: "B. Munich", t2: "PSG", t1_img: "https://crests.football-data.org/5.svg", t2_img: "https://crests.football-data.org/524.svg" },
    { id: "m4", date: "Feb 14, 18:30", t1: "Liverpool", t2: "Chelsea", t1_img: "https://crests.football-data.org/64.svg", t2_img: "https://crests.football-data.org/61.svg" }
];

// STATE
let selectedOdds = 1.5;
let currentMatchId = "m1";
let userAccount = null;

// DOM
const amountInput = document.getElementById('bet-amount');
const payoutDisplay = document.getElementById('calc-payout');
const netProfitDisplay = document.getElementById('net-profit');
const lossDisplay = document.getElementById('calc-loss');
const connectBtn = document.getElementById('connect-btn');
const walletDot = document.getElementById('wallet-dot');
const disconnectMenu = document.getElementById('disconnect-menu'); // منوی دیسکانکت
const disconnectBtnActual = document.getElementById('disconnect-btn-actual'); // دکمه دیسکانکت
const historyBody = document.getElementById('betting-history-body');

// CALCULATIONS
const calculateBets = () => {
    const amount = parseFloat(amountInput.value) || 0;
    const netProfit = amount * (selectedOdds - 1);
    netProfitDisplay.innerText = `+${netProfit.toFixed(2)} GEN`;
    lossDisplay.innerText = `-${netProfit.toFixed(2)} GEN`;
    payoutDisplay.innerText = (amount + netProfit).toFixed(2);
};

window.setOdds = (odds, btn) => {
    selectedOdds = odds;
    document.querySelectorAll('.odds-btn').forEach(b => b.className = "odds-btn py-2.5 bg-slate-50 rounded-xl text-[10px] font-black border border-slate-100 transition-all");
    btn.className = "odds-btn py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black border border-blue-600 transition-all shadow-md";
    calculateBets();
};

// WALLET ENGINE
const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            updateWalletUI(true);
        } catch (error) { console.error("Connection failed", error); }
    } else { alert("GenLayer extension not detected!"); }
};

const updateWalletUI = (connected) => {
    if (connected && userAccount) {
        connectBtn.querySelector('span').innerText = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
        walletDot.className = "w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]";
    } else {
        userAccount = null;
        connectBtn.querySelector('span').innerText = "Connect Wallet";
        walletDot.className = "w-2.5 h-2.5 bg-slate-300 rounded-full shadow-none";
        disconnectMenu.classList.add('hidden');
    }
};

// ==========================================
// اصلاح شده: LISTENERS (حل مشکل دیسکانکت)
// ==========================================

// ۱. مدیریت دکمه اصلی (اتصال یا باز کردن منو)
connectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!userAccount) {
        connectWallet();
    } else {
        disconnectMenu.classList.toggle('hidden');
    }
});

// ۲. اجرای دیسکانکت با اولویت بالا (mousedown)
disconnectBtnActual.addEventListener('mousedown', (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    updateWalletUI(false);
    console.log("Wallet Disconnected");
});

// ۳. بستن منو در صورت کلیک روی هر جای دیگر صفحه
document.addEventListener('click', (e) => {
    if (!connectBtn.contains(e.target) && !disconnectMenu.contains(e.target)) {
        disconnectMenu.classList.add('hidden');
    }
});

// LIVE HISTORY HANDLER
const addBetToHistory = (prediction, amount, hash) => {
    const row = document.createElement('tr');
    row.className = "border-b border-slate-50 hover:bg-slate-50/50 transition-all";
    row.innerHTML = `
        <td class="py-5 px-4">
            <div class="flex flex-col gap-1">
                <span class="font-mono text-[11px] text-slate-500">${userAccount.slice(0, 12)}...</span>
                <a href="#" class="text-[9px] text-blue-500 font-bold underline italic">HASH: ${hash.slice(0, 10)}...</a>
            </div>
        </td>
        <td class="py-5 px-4">
            <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${prediction == 1 ? 'bg-blue-100 text-blue-600' : 'bg-slate-900 text-white'}">
                Team ${prediction}
            </span>
        </td>
        <td class="py-5 px-4 text-right">
            <span class="font-black text-slate-800">${amount}</span>
            <span class="text-[9px] text-slate-400 font-bold uppercase ml-1">GEN</span>
        </td>
    `;
    historyBody.prepend(row);
};

// SEND TRANSACTION
const sendBetTransaction = async (predictedWinner) => {
    if (!userAccount) { alert("Please connect wallet!"); return; }
    const amountInGen = parseFloat(amountInput.value);
    if (isNaN(amountInGen) || amountInGen < 10) { alert("Minimum bet: 10 GEN"); return; }

    try {
        const valueInWei = "0x" + (BigInt(Math.floor(amountInGen)) * BigInt(10**18)).toString(16);
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{ to: CONTRACT_ADDRESS, from: userAccount, value: valueInWei }],
        });
        addBetToHistory(predictedWinner, amountInGen, txHash);
        alert("Transaction Confirmed!");
    } catch (error) { alert("Transaction Failed!"); }
};

// UI ENGINE
const updateUI = (id) => {
    currentMatchId = id;
    const data = matchData.find(m => m.id === id);
    document.getElementById('match-date-display').innerText = data.date;
    document.getElementById('team1-name').innerText = data.t1;
    document.getElementById('team2-name').innerText = data.t2;
    document.getElementById('team1-logo').src = data.t1_img;
    document.getElementById('team2-logo').src = data.t2_img;
    renderSidebar();
    calculateBets();
};

const renderSidebar = () => {
    const list = document.getElementById('side-match-list');
    list.innerHTML = '';
    matchData.forEach(m => {
        const isActive = m.id === currentMatchId;
        const card = document.createElement('div');
        card.className = `match-card p-4 rounded-2xl flex flex-col cursor-pointer ${isActive ? 'active-match shadow-sm' : 'bg-white hover:bg-slate-50 border border-slate-100'}`;
        card.innerHTML = `<span class="text-[9px] font-bold ${isActive ? 'text-blue-500' : 'text-slate-400'} uppercase">${m.date}</span><span class="text-[11px] font-black text-slate-800">${m.t1} vs ${m.t2}</span>`;
        card.onclick = () => updateUI(m.id);
        list.appendChild(card);
    });
};

amountInput.oninput = calculateBets;
document.getElementById('bet-t1').onclick = () => sendBetTransaction(1);
document.getElementById('bet-t2').onclick = () => sendBetTransaction(2);

window.onload = () => updateUI("m1");
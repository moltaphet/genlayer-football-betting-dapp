// CONFIGURATION
const CONTRACT_ADDRESS = "0x4d8Cd6Caa7D7681AeF2E3B6e21FFB3238eCb4814";

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
const disconnectMenu = document.getElementById('disconnect-menu');
const historyBody = document.getElementById('betting-history-body');

// CALCULATIONS
const calculateBets = () => {
    const amount = parseFloat(amountInput.value) || 0;
    const netProfit = amount * (selectedOdds - 1);
    const totalPayout = amount + netProfit;

    netProfitDisplay.innerText = `+${netProfit.toFixed(2)} GEN`;
    lossDisplay.innerText = `-${netProfit.toFixed(2)} GEN`;
    payoutDisplay.innerText = totalPayout.toFixed(2);
};

window.setOdds = (odds, btn) => {
    selectedOdds = odds;
    document.querySelectorAll('.odds-btn').forEach(b => {
        b.className = "odds-btn py-2.5 bg-slate-50 rounded-xl text-[10px] font-black border border-slate-100 transition-all";
    });
    btn.className = "odds-btn py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black border border-blue-600 transition-all shadow-md";
    calculateBets();
};

// WALLET HANDLERS
const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            updateWalletUI(true);
        } catch (error) { console.error(error); }
    } else { alert("Install GenLayer!"); }
};

const disconnectWallet = () => {
    userAccount = null;
    updateWalletUI(false);
    disconnectMenu.classList.add('hidden');
};

const updateWalletUI = (connected) => {
    if (connected && userAccount) {
        connectBtn.querySelector('span').innerText = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
        walletDot.className = "w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]";
    } else {
        connectBtn.querySelector('span').innerText = "Connect Wallet";
        walletDot.className = "w-2.5 h-2.5 bg-slate-300 rounded-full shadow-none";
        disconnectMenu.classList.add('hidden');
    }
};

// ACTIONS
const sendBetTransaction = async (predictedWinner) => {
    if (!userAccount) return alert("Connect Wallet!");
    const amount = parseFloat(amountInput.value);
    if (amount < 10) return alert("Min 10 GEN");

    try {
        const valueInWei = "0x" + (BigInt(Math.floor(amount)) * BigInt(10**18)).toString(16);
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{ to: CONTRACT_ADDRESS, from: userAccount, value: valueInWei }],
        });

        // Add to history
        const row = document.createElement('tr');
        row.innerHTML = `<td class="py-5 px-4 text-[11px] font-mono">${userAccount.slice(0, 10)}...</td><td class="py-5 px-4 uppercase font-black text-[10px] ${predictedWinner == 1 ? 'text-blue-600' : 'text-slate-900'}">Team ${predictedWinner}</td><td class="py-5 px-4 text-right font-black">${amount} GEN</td>`;
        historyBody.prepend(row);
        alert("Bet Placed!");
    } catch (e) { alert("Failed!"); }
};

// LISTENERS
connectBtn.onclick = (e) => {
    e.stopPropagation();
    if (!userAccount) connectWallet();
    else disconnectMenu.classList.toggle('hidden');
};

document.getElementById('disconnect-btn-actual').onclick = (e) => {
    e.stopPropagation();
    disconnectWallet();
};

document.addEventListener('click', () => disconnectMenu.classList.add('hidden'));

amountInput.oninput = calculateBets;
document.getElementById('bet-t1').onclick = () => sendBetTransaction(1);
document.getElementById('bet-t2').onclick = () => sendBetTransaction(2);

const updateUI = (id) => {
    currentMatchId = id;
    const data = matchData.find(m => m.id === id);
    document.getElementById('match-date-display').innerText = data.date;
    document.getElementById('team1-name').innerText = data.t1;
    document.getElementById('team2-name').innerText = data.t2;
    document.getElementById('team1-logo').src = data.t1_img;
    document.getElementById('team2-logo').src = data.t2_img;
    
    const list = document.getElementById('side-match-list');
    list.innerHTML = '';
    matchData.forEach(m => {
        const div = document.createElement('div');
        div.className = `match-card p-4 rounded-2xl ${m.id === id ? 'active-match' : 'bg-white border border-slate-100'}`;
        div.innerHTML = `<span class="text-[9px] font-bold uppercase">${m.date}</span><br><span class="text-[11px] font-black">${m.t1} vs ${m.t2}</span>`;
        div.onclick = () => updateUI(m.id);
        list.appendChild(div);
    });
};

window.onload = () => updateUI("m1");
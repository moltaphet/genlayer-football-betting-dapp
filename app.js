
const CONTRACT_ADDRESS = "0x4d8Cd6Caa7D7681AeF2E3B6e21FFB3238eCb4814";

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
const historyBody = document.getElementById('betting-history-body');

// BALANCED RISK CALCULATOR
const calculateBets = () => {
    const amount = parseFloat(amountInput.value) || 0;
    const totalPayout = amount * selectedOdds;
    const netProfit = totalPayout - amount;
    const riskAmount = amount;

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

// WALLET CONNECTION
const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            connectBtn.querySelector('span').innerText = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
            walletDot.className = "w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]";
            fetchBettingHistory(); 
        } catch (error) {
            console.error("Connection failed", error);
        }
    } else {
        alert("GenLayer extension not detected!");
    }
};

// FETCH HISTORY FROM CONTRACT
const fetchBettingHistory = async () => {
    if (!historyBody) return;
    try {
        const history = await window.ethereum.request({
            method: 'eth_call',
            params: [{
                to: CONTRACT_ADDRESS,
                data: 'get_all_bets()' 
            }]
        });
        renderHistoryTable(history || []);
    } catch (error) {
        console.error("Error fetching history:", error);
    }
};

const renderHistoryTable = (data) => {
    if (!Array.isArray(data)) return;
    historyBody.innerHTML = data.map(bet => `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
            <td class="py-5 px-4">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span class="font-mono text-[11px] text-slate-500">${bet.address}</span>
                </div>
            </td>
            <td class="py-5 px-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${bet.team == 1 ? 'bg-blue-100 text-blue-600' : 'bg-slate-900 text-white'}">
                    Team ${bet.team}
                </span>
            </td>
            <td class="py-5 px-4 text-right">
                <span class="font-black text-slate-800">${(BigInt(bet.amount) / BigInt(1e18))}</span>
                <span class="text-[9px] text-slate-400 font-bold uppercase ml-1">GEN</span>
            </td>
        </tr>
    `).join('');
};

// CONTRACT ACTION: PLACE BET (FIXED CALCULATION)
const sendBetTransaction = async (predictedWinner) => {
    if (!userAccount) {
        alert("Please connect your wallet first!");
        return;
    }

    const amountInGen = parseFloat(amountInput.value);
    
    if (isNaN(amountInGen) || amountInGen < 10) {
        amountInput.classList.add('shake', 'border-red-500', 'bg-red-50');
        setTimeout(() => amountInput.classList.remove('shake', 'border-red-500', 'bg-red-50'), 1000);
        alert("⚠️ Minimum bet allowed is 10 GEN.");
        return; 
    }

    try {
        // فیکس کردن باگ عدد 15: تبدیل دقیق به Wei با دقت 18 رقم اعشار
        const factor = BigInt(10**18);
        const amountBigInt = BigInt(Math.floor(amountInGen));
        const valueInWei = (amountBigInt * factor).toString(16);

        const transactionParameters = {
            to: CONTRACT_ADDRESS,
            from: userAccount,
            value: '0x' + valueInWei, 
            data: `place_bet(${predictedWinner})`
        };

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });

        alert("Bet Placed Successfully! Hash: " + txHash);
        setTimeout(fetchBettingHistory, 3000); 
    } catch (error) {
        console.error("Transaction failed", error);
        alert("Transaction Failed! Check console for details.");
    }
};

// UI UPDATE ENGINE
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
        card.className = `match-card p-4 rounded-2xl flex flex-col cursor-pointer ${isActive ? 'active-match' : 'bg-white shadow-sm'}`;
        card.innerHTML = `
            <span class="text-[9px] font-bold ${isActive ? 'text-blue-500' : 'text-slate-400'} uppercase">${m.date}</span>
            <span class="text-[11px] font-black text-slate-800">${m.t1} vs ${m.t2}</span>
        `;
        card.onclick = () => updateUI(m.id);
        list.appendChild(card);
    });
};

// EVENT LISTENERS
amountInput.oninput = calculateBets;
connectBtn.onclick = connectWallet;
document.getElementById('bet-t1').onclick = () => sendBetTransaction(1);
document.getElementById('bet-t2').onclick = () => sendBetTransaction(2);

window.onload = () => {
    updateUI("m1");
};
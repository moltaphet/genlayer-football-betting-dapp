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
const historyBody = document.getElementById('betting-history-body');

const calculateBets = () => {
    const amount = parseFloat(amountInput.value) || 0;
    payoutDisplay.innerText = (amount * selectedOdds).toFixed(2);
    netProfitDisplay.innerText = `+${(amount * selectedOdds - amount).toFixed(2)} GEN`;
    lossDisplay.innerText = `-${amount.toFixed(2)} GEN`;
};

window.setOdds = (odds, btn) => {
    selectedOdds = odds;
    document.querySelectorAll('.odds-btn').forEach(b => b.className = "odds-btn py-2.5 bg-slate-50 rounded-xl text-[10px] font-black border border-slate-100 transition-all");
    btn.className = "odds-btn py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black border border-blue-600 transition-all shadow-md";
    calculateBets();
};

const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            connectBtn.querySelector('span').innerText = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
            walletDot.className = "w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]";
            fetchBettingHistory(); 
        } catch (error) { console.error("Connection failed", error); }
    } else { alert("GenLayer extension not detected!"); }
};

const fetchBettingHistory = async () => {
    if (!historyBody || !userAccount) return;
    try {
        const history = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: CONTRACT_ADDRESS, data: '0x' }] // Simple call to check connection
        });
        console.log("History fetched");
    } catch (error) { console.error("History error:", error); }
};

// تابع اصلی ارسال تراکنش با اصلاح باگ دیتا
const sendBetTransaction = async (predictedWinner) => {
    if (!userAccount) { alert("Please connect wallet!"); return; }

    const amountInGen = parseFloat(amountInput.value);
    if (isNaN(amountInGen) || amountInGen < 10) {
        alert("Minimum bet: 10 GEN");
        return;
    }

    try {
        // محاسبه دقیق مقدار وی (Wei)
        const valueInWei = "0x" + (BigInt(Math.floor(amountInGen)) * BigInt(10**18)).toString(16);

        const transactionParameters = {
            to: CONTRACT_ADDRESS,
            from: userAccount,
            value: valueInWei,
            // برای رفع ارور uint8Array، فعلا دیتا را به صورت هگزادسیمال خالی می‌فرستیم
            // اگر قرارداد شما تابع خاصی می‌خواهد، باید انکود شود. فعلا برای تست تراکنش:
            data: '0x' 
        };

        console.log("Sending Transaction...", transactionParameters);

        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
        });

        alert("Bet Successful! Hash: " + txHash);
    } catch (error) {
        console.error("TX Error:", error);
        if (error.code === -32000 || error.message.includes("nonce")) {
            alert("🚨 NONCE ERROR: Please go to MetaMask > Settings > Advanced > Clear Activity Tab Data");
        } else {
            alert("Transaction Failed. Check console.");
        }
    }
};

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
        card.innerHTML = `<span class="text-[9px] font-bold ${isActive ? 'text-blue-500' : 'text-slate-400'} uppercase">${m.date}</span><span class="text-[11px] font-black text-slate-800">${m.t1} vs ${m.t2}</span>`;
        card.onclick = () => updateUI(m.id);
        list.appendChild(card);
    });
};

amountInput.oninput = calculateBets;
connectBtn.onclick = connectWallet;
document.getElementById('bet-t1').onclick = () => sendBetTransaction(1);
document.getElementById('bet-t2').onclick = () => sendBetTransaction(2);

window.onload = () => updateUI("m1");
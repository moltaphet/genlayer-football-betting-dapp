// ============================================================
// GENBET AI — app.js
// Refactored for 100% stability and Expiration Logic.
// All Persian words avoided in code structures.
// ============================================================

// -----------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------
const CONTRACT_ADDRESS = "0x4d8Cd6Caa7D7681AeF2E3B6e21FFB3238eCb4814";

// -----------------------------------------------------------
// MATCH DATABASE (With Deadlines)
// -----------------------------------------------------------
const MATCH_DATA = [
    {
        id: "m1",
        date: "Today, May 5",
        deadline: 1746489600, // May 2026
        team1: "Real Madrid",
        team2: "Barcelona",
        logo1: "/logos/spain-la-liga-2025-2026.football-logos.cc/256x256/real-madrid.football-logos.cc.png",
        logo2: "/logos/spain-la-liga-2025-2026.football-logos.cc/256x256/barcelona.football-logos.cc.png",
    },
    {
        id: "m2",
        date: "May 6, 20:45",
        deadline: 1746564300, 
        team1: "Arsenal",
        team2: "Man City",
        logo1: "/logos/english-premier-league-2025-2026.football-logos.cc/256x256/arsenal.football-logos.cc.png",
        logo2: "/logos/english-premier-league-2025-2026.football-logos.cc/256x256/manchester-city.football-logos.cc.png",
    },
    {
        id: "m3",
        date: "May 7, 21:00",
        deadline: 1746651600,
        team1: "B. Munich",
        team2: "PSG",
        logo1: "/logos/germany-bundesliga-2025-2026.football-logos.cc/256x256/bayern-munchen.football-logos.cc.png",
        logo2: "/logos/france-ligue-1-2025-2026.football-logos.cc/256x256/paris-saint-germain.football-logos.cc.png",
    },
    {
        id: "m4",
        date: "May 8, 18:30",
        deadline: 1746729000,
        team1: "Liverpool",
        team2: "Chelsea",
        logo1: "/logos/english-premier-league-2025-2026.football-logos.cc/256x256/liverpool.football-logos.cc.png",
        logo2: "/logos/english-premier-league-2025-2026.football-logos.cc/256x256/chelsea.football-logos.cc.png",
    }
];

const FALLBACK_LOGO_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='%2394a3b8'%3E%3F%3C/text%3E%3C/svg%3E";

// -----------------------------------------------------------
// APPLICATION STATE
// -----------------------------------------------------------
let selectedOdds = 1.5;
let currentMatchId = "m1";
let userAccount = null;

// -----------------------------------------------------------
// DOM REFERENCES
// -----------------------------------------------------------
const dom = {
    amountInput:      () => document.getElementById("bet-amount"),
    payoutDisplay:    () => document.getElementById("calc-payout"),
    netProfitDisplay: () => document.getElementById("net-profit"),
    lossDisplay:      () => document.getElementById("calc-loss"),
    connectBtn:       () => document.getElementById("connect-btn"),
    walletDot:        () => document.getElementById("wallet-dot"),
    disconnectMenu:   () => document.getElementById("disconnect-menu"),
    disconnectBtn:    () => document.getElementById("disconnect-btn-actual"),
    historyBody:      () => document.getElementById("betting-history-body"),
    matchDateDisplay: () => document.getElementById("match-date-display"),
    team1Name:        () => document.getElementById("team1-name"),
    team2Name:        () => document.getElementById("team2-name"),
    team1Logo:        () => document.getElementById("team1-logo"),
    team2Logo:        () => document.getElementById("team2-logo"),
    sideMatchList:    () => document.getElementById("side-match-list"),
    betT1:            () => document.getElementById("bet-t1"),
    betT2:            () => document.getElementById("bet-t2"),
};

// -----------------------------------------------------------
// 1. CALCULATION ENGINE
// -----------------------------------------------------------
function calculateBets() {
    const stake = parseFloat(dom.amountInput().value) || 0;
    const netProfit = stake * (selectedOdds - 1);
    const totalPayout = stake + netProfit;

    dom.payoutDisplay().textContent = totalPayout.toFixed(2);
    dom.netProfitDisplay().textContent = `+${netProfit.toFixed(2)} GEN`;
    dom.lossDisplay().textContent = `-${netProfit.toFixed(2)} GEN`;
}

window.setOdds = function setOdds(odds, clickedBtn) {
    selectedOdds = odds;
    document.querySelectorAll(".odds-btn").forEach((btn) => {
        btn.className = "odds-btn py-2.5 bg-slate-50 rounded-xl text-[10px] font-black border border-slate-100 transition-all";
    });
    clickedBtn.className = "odds-btn py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black border border-blue-600 transition-all shadow-md";
    calculateBets();
};

// -----------------------------------------------------------
// 2. WALLET LOGIC
// -----------------------------------------------------------
async function connectWallet() {
    const provider = window.genlayer || window.ethereum;
    if (!provider) {
        showNotification("Please install the GenLayer extension or MetaMask.", "error");
        return;
    }
    try {
        const accounts = await provider.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) {
            showNotification("No accounts returned.", "error");
            return;
        }
        userAccount = accounts[0];
        updateWalletUI(true);
        showNotification("Wallet connected!", "success");
    } catch (err) {
        if (err.code !== 4001) console.error(err);
        showNotification("Connection cancelled.", "error");
    }
}

function disconnectWallet() {
    userAccount = null;
    updateWalletUI(false);
    showNotification("Disconnected.", "info");
}

function updateWalletUI(connected) {
    const btn = dom.connectBtn();
    const dot = dom.walletDot();
    const span = btn.querySelector("span");
    if (connected && userAccount) {
        span.textContent = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
        dot.className = "w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]";
    } else {
        span.textContent = "Connect Wallet";
        dot.className = "w-2.5 h-2.5 bg-slate-300 rounded-full transition-colors duration-300";
        dom.disconnectMenu().classList.add("hidden");
    }
}

// -----------------------------------------------------------
// 3. EVENT LISTENERS
// -----------------------------------------------------------
function bindEventListeners() {
    dom.connectBtn().addEventListener("click", (e) => {
        e.stopPropagation();
        if (!userAccount) connectWallet();
        else dom.disconnectMenu().classList.toggle("hidden");
    });

    dom.disconnectBtn().addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        disconnectWallet();
    });

    document.addEventListener("click", () => dom.disconnectMenu().classList.add("hidden"));
    dom.amountInput().addEventListener("input", calculateBets);

    dom.betT1().addEventListener("click", () => sendBetTransaction(1));
    dom.betT2().addEventListener("click", () => sendBetTransaction(2));
}

// -----------------------------------------------------------
// 4. TRANSACTION ENGINE (With Time Check)
// -----------------------------------------------------------
async function sendBetTransaction(predictedTeam) {
    if (!userAccount) {
        showNotification("Connect your wallet first!", "error");
        return;
    }

    const currentMatch = MATCH_DATA.find(m => m.id === currentMatchId);
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentMatch && currentTime > currentMatch.deadline) {
        showNotification("Market Closed! Match already started.", "error");
        return;
    }

    const stake = parseFloat(dom.amountInput().value);
    if (!stake || stake < 10) {
        showNotification("Minimum bet is 10 GEN.", "error");
        return;
    }

    const provider = window.genlayer || window.ethereum;
    try {
        const valueInWei = "0x" + (BigInt(Math.floor(stake)) * BigInt(10 ** 18)).toString(16);
        const txHash = await provider.request({
            method: "eth_sendTransaction",
            params: [{ to: CONTRACT_ADDRESS, from: userAccount, value: valueInWei, data: "0x" }],
        });
        addBetToHistory(predictedTeam, stake, txHash);
        showNotification("Bet placed!", "success");
    } catch (err) {
        console.error(err);
        showNotification("Transaction failed.", "error");
    }
}

// -----------------------------------------------------------
// 5. HISTORY ENGINE
// -----------------------------------------------------------
function addBetToHistory(predictedTeam, stake, txHash) {
    const row = document.createElement("tr");
    row.className = "border-b border-slate-50 hover:bg-slate-50/50 transition-all";
    const teamBadgeClass = predictedTeam === 1 ? "bg-blue-100 text-blue-600" : "bg-slate-900 text-white";
    row.innerHTML = `
        <td class="py-5 px-4"><div class="flex flex-col gap-1">
            <span class="font-mono text-[11px] text-slate-500">${userAccount.slice(0, 14)}...</span>
            <span class="text-[9px] text-blue-500 font-bold uppercase italic">TX: ${txHash.slice(0, 8)}</span>
        </div></td>
        <td class="py-5 px-4"><span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${teamBadgeClass}">Team ${predictedTeam}</span></td>
        <td class="py-5 px-4 text-right"><span class="font-black text-slate-800">${stake.toFixed(2)}</span><span class="text-[9px] text-slate-400 font-bold uppercase ml-1">GEN</span></td>
    `;
    dom.historyBody().prepend(row);
}

// -----------------------------------------------------------
// 6. UI ENGINE (Handles Disabling Buttons)
// -----------------------------------------------------------
function updateUI(matchId) {
    currentMatchId = matchId;
    const match = MATCH_DATA.find((m) => m.id === matchId);
    if (!match) return;

    dom.matchDateDisplay().textContent = match.date;
    dom.team1Name().textContent = match.team1;
    dom.team2Name().textContent = match.team2;

    const t1Logo = dom.team1Logo();
    const t2Logo = dom.team2Logo();

    
    [t1Logo, t2Logo].forEach(img => {
        if (img) {
            img.style.objectFit = "contain"; 
            img.style.padding = "10px";      
            img.style.width = "100%";      
            img.style.height = "100%";
        }
    });

    setLogoSrc(t1Logo, match.logo1);
    setLogoSrc(t2Logo, match.logo2);
    // ---------------------------------------

    // TIME LOGIC
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = currentTime > match.deadline;

    if (isExpired) {
        dom.betT1().disabled = true;
        dom.betT2().disabled = true;
        dom.betT1().style.opacity = "0.5";
        dom.betT2().style.opacity = "0.5";
        dom.betT1().textContent = "CLOSED";
        dom.betT2().textContent = "CLOSED";
    } else {
        dom.betT1().disabled = false;
        dom.betT2().disabled = false;
        dom.betT1().style.opacity = "1";
        dom.betT2().style.opacity = "1";
        dom.betT1().textContent = "BET TEAM 1";
        dom.betT2().textContent = "BET TEAM 2";
    }

    renderSidebar();
    calculateBets();
}
function setLogoSrc(imgEl, rawPath) {
    if (!imgEl) return;
    
    imgEl.onerror = () => { 
        imgEl.onerror = null; 
        imgEl.src = FALLBACK_LOGO_SVG; 
    };
    
    imgEl.src = rawPath; 
}

function renderSidebar() {
    const list = dom.sideMatchList();
    list.innerHTML = "";
    MATCH_DATA.forEach((match) => {
        const isActive = match.id === currentMatchId;
        const card = document.createElement("div");
        card.className = ["match-card p-4 rounded-2xl flex flex-col cursor-pointer", isActive ? "active-match shadow-sm" : "bg-white hover:bg-slate-50 border border-slate-100"].join(" ");
        card.innerHTML = `<span class="text-[9px] font-bold ${isActive ? "text-blue-500" : "text-slate-400"} uppercase">${match.date}</span><span class="text-[11px] font-black text-slate-800">${match.team1} vs ${match.team2}</span>`;
        card.addEventListener("click", () => updateUI(match.id));
        list.appendChild(card);
    });
}

function showNotification(message, type = "info") {
    const colorMap = { success: "bg-green-500", error: "bg-red-500", info: "bg-blue-500" };
    const toast = document.createElement("div");
    toast.className = ["fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-2xl text-white text-[11px] font-black uppercase shadow-xl transition-all duration-300 opacity-0", colorMap[type] || colorMap.info].join(" ");
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.style.opacity = "1"));
    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 3000);
}

window.addEventListener("DOMContentLoaded", () => {
    bindEventListeners();
    updateUI("m1");
});
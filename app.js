// ============================================================
// GENBET AI — app.js
// Refactored for 100% stability, clean image paths, robust
// wallet handling, and full English throughout.
// ============================================================

// -----------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------
const CONTRACT_ADDRESS = "0x4d8Cd6Caa7D7681AeF2E3B6e21FFB3238eCb4814";

// -----------------------------------------------------------
// MATCH DATABASE
// Logo path convention: /logos/{league-folder}/256x256/{Team Name}.png
// encodeURI() is applied at render time to handle spaces safely.
// -----------------------------------------------------------
// -----------------------------------------------------------
// MATCH DATABASE (Direct Links from GitHub Repository)
// Using raw.githubusercontent.com to ensure direct image access.
// -----------------------------------------------------------
// -----------------------------------------------------------
// MATCH DATABASE (Direct Sync with GitHub Repository)
// -----------------------------------------------------------
// -----------------------------------------------------------
// MATCH DATABASE (Direct Sync with Leo4815162342 Repository)
// -----------------------------------------------------------
// -----------------------------------------------------------
// MATCH DATABASE (Using your EXACT local filenames from public/logos)
// -----------------------------------------------------------
const MATCH_DATA = [
    {
        id: "m1",
        date: "Today, Feb 11",
        team1: "Real Madrid",
        team2: "Barcelona",
        // مطابق با فرمت فایل‌های شما در اسکرین‌شات
        logo1: "/logos/spain-la-liga-2025-2026.football-logos.cc/256x256/real-madrid.football-logos.cc.png",
        logo2: "/logos/spain-la-liga-2025-2026.football-logos.cc/256x256/barcelona.football-logos.cc.png",
    },
    {
        id: "m2",
        date: "Feb 12, 20:45",
        team1: "Arsenal",
        team2: "Man City",
        logo1: "/logos/english-premier-league-2025-2026.football-logos.cc/256x256/arsenal.football-logos.cc.png",
        logo2: "/logos/english-premier-league-2025-2026.football-logos.cc/256x256/manchester-city.football-logos.cc.png",
    },
    {
        id: "m3",
        date: "Feb 13, 21:00",
        team1: "B. Munich",
        team2: "PSG",
        logo1: "/logos/germany-bundesliga-2025-2026.football-logos.cc/256x256/bayern-munchen.football-logos.cc.png",
        logo2: "/logos/france-ligue-1-2025-2026.football-logos.cc/256x256/paris-saint-germain.football-logos.cc.png",
    },
    {
        id: "m4",
        date: "Feb 14, 18:30",
        team1: "Liverpool",
        team2: "Chelsea",
        logo1: "/logos/english-premier-league-2025-2026.football-logos.cc/256x256/liverpool.football-logos.cc.png",
        logo2: "/logos/english-premier-league-2025-2026.football-logos.cc/256x256/chelsea.football-logos.cc.png",
    },
];

// Fallback SVG shown when a logo file cannot be loaded
const FALLBACK_LOGO_SVG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='%2394a3b8'%3E%3F%3C/text%3E%3C/svg%3E";

// -----------------------------------------------------------
// APPLICATION STATE
// -----------------------------------------------------------
let selectedOdds = 1.5;
let currentMatchId = "m1";
let userAccount = null;

// -----------------------------------------------------------
// DOM REFERENCES — resolved once at startup
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
// Symmetric risk-reward: Net Profit = Stake × (Odds − 1)
// Risk on Loss mirrors Net Profit exactly.
// -----------------------------------------------------------
function calculateBets() {
    const stake = parseFloat(dom.amountInput().value) || 0;
    const netProfit = stake * (selectedOdds - 1);
    const totalPayout = stake + netProfit;

    dom.payoutDisplay().textContent = totalPayout.toFixed(2);
    dom.netProfitDisplay().textContent = `+${netProfit.toFixed(2)} GEN`;
    dom.lossDisplay().textContent = `-${netProfit.toFixed(2)} GEN`;
}

// Exposed globally so inline onclick="setOdds(...)" in HTML can call it
window.setOdds = function setOdds(odds, clickedBtn) {
    selectedOdds = odds;

    // Reset all odds buttons to the default style
    document.querySelectorAll(".odds-btn").forEach((btn) => {
        btn.className =
            "odds-btn py-2.5 bg-slate-50 rounded-xl text-[10px] font-black border border-slate-100 transition-all";
    });

    // Highlight the selected button
    clickedBtn.className =
        "odds-btn py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black border border-blue-600 transition-all shadow-md";

    calculateBets();
};

// -----------------------------------------------------------
// 2. WALLET LOGIC
// Supports both MetaMask and the GenLayer browser extension.
// Errors are caught silently to prevent UI crashes.
// -----------------------------------------------------------
async function connectWallet() {
    // Prefer the GenLayer extension; fall back to window.ethereum (MetaMask)
    const provider = window.genlayer || window.ethereum;

    if (!provider) {
        showNotification("Please install the GenLayer extension or MetaMask.", "error");
        return;
    }

    try {
        const accounts = await provider.request({ method: "eth_requestAccounts" });

        if (!accounts || accounts.length === 0) {
            showNotification("No accounts returned. Please unlock your wallet.", "error");
            return;
        }

        userAccount = accounts[0];
        updateWalletUI(true);
        showNotification("Wallet connected successfully!", "success");
    } catch (err) {
        // Code 4001 = user rejected the request — not a crash, just ignore
        if (err.code !== 4001) {
            console.error("[GenBet] Wallet connection error:", err);
        }
        showNotification("Wallet connection cancelled.", "error");
    }
}

function disconnectWallet() {
    userAccount = null;
    updateWalletUI(false);
    showNotification("Wallet disconnected.", "info");
}

function updateWalletUI(connected) {
    const btn = dom.connectBtn();
    const dot = dom.walletDot();
    const span = btn.querySelector("span");

    if (connected && userAccount) {
        // Truncated address: 0x1234...abcd
        span.textContent =
            userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
        dot.className =
            "w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]";
    } else {
        span.textContent = "Connect Wallet";
        dot.className =
            "w-2.5 h-2.5 bg-slate-300 rounded-full transition-colors duration-300";
        dom.disconnectMenu().classList.add("hidden");
    }
}

// -----------------------------------------------------------
// 3. EVENT LISTENERS
// -----------------------------------------------------------
function bindEventListeners() {
    // Connect / toggle disconnect menu
    dom.connectBtn().addEventListener("click", (e) => {
        e.stopPropagation();
        if (!userAccount) {
            connectWallet();
        } else {
            dom.disconnectMenu().classList.toggle("hidden");
        }
    });

    // Disconnect button inside the dropdown menu
    dom.disconnectBtn().addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        disconnectWallet();
    });

    // Close the disconnect menu when clicking anywhere else
    document.addEventListener("click", () => {
        dom.disconnectMenu().classList.add("hidden");
    });

    // Stake input — recalculate on every keystroke
    dom.amountInput().addEventListener("input", calculateBets);

    // Bet buttons
    dom.betT1().addEventListener("click", () => sendBetTransaction(1));
    dom.betT2().addEventListener("click", () => sendBetTransaction(2));
}

// -----------------------------------------------------------
// 4. TRANSACTION ENGINE
// Sends a raw ETH transfer to CONTRACT_ADDRESS.
// The prediction team number is recorded only in the UI history.
// -----------------------------------------------------------
async function sendBetTransaction(predictedTeam) {
    if (!userAccount) {
        showNotification("Connect your wallet first!", "error");
        return;
    }

    const stake = parseFloat(dom.amountInput().value);
    if (!stake || stake < 10) {
        showNotification("Minimum bet is 10 GEN.", "error");
        return;
    }

    const provider = window.genlayer || window.ethereum;
    if (!provider) {
        showNotification("No wallet provider found.", "error");
        return;
    }

    try {
        // Convert GEN amount to wei (1 GEN = 10^18 wei)
        const valueInWei =
            "0x" + (BigInt(Math.floor(stake)) * BigInt(10 ** 18)).toString(16);

        const txHash = await provider.request({
            method: "eth_sendTransaction",
            params: [
                {
                    to: CONTRACT_ADDRESS,
                    from: userAccount,
                    value: valueInWei,
                    data: "0x",
                },
            ],
        });

        addBetToHistory(predictedTeam, stake, txHash);
        showNotification("Bet placed successfully!", "success");
    } catch (err) {
        console.error("[GenBet] Transaction error:", err);
        showNotification("Transaction failed or was rejected.", "error");
    }
}

// -----------------------------------------------------------
// 5. LIVE BETTING HISTORY
// Prepends a new row to the table after each confirmed bet.
// -----------------------------------------------------------
function addBetToHistory(predictedTeam, stake, txHash) {
    const row = document.createElement("tr");
    row.className =
        "border-b border-slate-50 hover:bg-slate-50/50 transition-all";

    const teamBadgeClass =
        predictedTeam === 1
            ? "bg-blue-100 text-blue-600"
            : "bg-slate-900 text-white";

    row.innerHTML = `
        <td class="py-5 px-4">
            <div class="flex flex-col gap-1">
                <span class="font-mono text-[11px] text-slate-500">
                    ${userAccount.slice(0, 14)}...
                </span>
                <span class="text-[9px] text-blue-500 font-bold uppercase italic">
                    TX: ${txHash.slice(0, 8)}
                </span>
            </div>
        </td>
        <td class="py-5 px-4">
            <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${teamBadgeClass}">
                Team ${predictedTeam}
            </span>
        </td>
        <td class="py-5 px-4 text-right">
            <span class="font-black text-slate-800">${stake.toFixed(2)}</span>
            <span class="text-[9px] text-slate-400 font-bold uppercase ml-1">GEN</span>
        </td>
    `;

    dom.historyBody().prepend(row);
}

// -----------------------------------------------------------
// 6. UI ENGINE
// -----------------------------------------------------------

/**
 * Updates the main match panel and refreshes the sidebar.
 * @param {string} matchId - One of the IDs defined in MATCH_DATA.
 */
function updateUI(matchId) {
    currentMatchId = matchId;
    const match = MATCH_DATA.find((m) => m.id === matchId);
    if (!match) return;

    dom.matchDateDisplay().textContent = match.date;
    dom.team1Name().textContent = match.team1;
    dom.team2Name().textContent = match.team2;

    setLogoSrc(dom.team1Logo(), match.logo1);
    setLogoSrc(dom.team2Logo(), match.logo2);

    renderSidebar();
    calculateBets();
}

/**
 * Safely sets an <img> src with URI encoding and a fallback on error.
 * encodeURI() handles spaces in filenames (e.g. "Real Madrid.png")
 * while preserving the slash separators in the path.
 */
function setLogoSrc(imgEl, rawPath) {
    imgEl.onerror = () => {
        imgEl.onerror = null; // prevent infinite loop if fallback also fails
        imgEl.src = FALLBACK_LOGO_SVG;
    };
    imgEl.src = encodeURI(rawPath);
}

/**
 * Re-renders the sidebar match list, highlighting the active match.
 */
function renderSidebar() {
    const list = dom.sideMatchList();
    list.innerHTML = "";

    MATCH_DATA.forEach((match) => {
        const isActive = match.id === currentMatchId;
        const card = document.createElement("div");

        card.className = [
            "match-card p-4 rounded-2xl flex flex-col cursor-pointer",
            isActive
                ? "active-match shadow-sm"
                : "bg-white hover:bg-slate-50 border border-slate-100",
        ].join(" ");

        card.innerHTML = `
            <span class="text-[9px] font-bold ${isActive ? "text-blue-500" : "text-slate-400"} uppercase">
                ${match.date}
            </span>
            <span class="text-[11px] font-black text-slate-800">
                ${match.team1} vs ${match.team2}
            </span>
        `;

        card.addEventListener("click", () => updateUI(match.id));
        list.appendChild(card);
    });
}

// -----------------------------------------------------------
// NOTIFICATION HELPER
// Lightweight toast-style status messages — no external deps.
// -----------------------------------------------------------
function showNotification(message, type = "info") {
    const colorMap = {
        success: "bg-green-500",
        error:   "bg-red-500",
        info:    "bg-blue-500",
    };

    const toast = document.createElement("div");
    toast.className = [
        "fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-2xl text-white",
        "text-[11px] font-black uppercase shadow-xl transition-all duration-300 opacity-0",
        colorMap[type] || colorMap.info,
    ].join(" ");
    toast.textContent = message;

    document.body.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = "1";
        });
    });

    // Auto-dismiss after 3 s
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// -----------------------------------------------------------
// INIT — runs once the DOM is fully parsed
// -----------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    bindEventListeners();
    updateUI("m1");
});
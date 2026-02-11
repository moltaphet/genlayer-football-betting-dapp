// Database of football matches with stable links
const matchData = [
    {
        id: "m1",
        date: "Today, Feb 11",
        t1: "Real Madrid",
        t2: "FC Barcelona",
        t1_img: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
        t2_img: "https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_logo.svg/1024px-FC_Barcelona_logo.svg.png"
    },
    {
        id: "m2",
        date: "Feb 12, 20:45",
        t1: "Arsenal",
        t2: "Manchester City",
        t1_img: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
        t2_img: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"
    },
    {
        id: "m3",
        date: "Feb 13, 21:00",
        t1: "Bayern Munich",
        t2: "Paris SG",
        t1_img: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/1024px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png",
        t2_img: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg"
    },
    {
        id: "m4",
        date: "Feb 14, 18:30",
        t1: "Liverpool",
        t2: "Chelsea",
        t1_img: "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
        t2_img: "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg"
    }
];

let currentMatchId = "m1";
let userAccount = null;

// UI DOM ELEMENTS
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const walletDot = document.getElementById('wallet-dot');

const updateUI = (matchId) => {
    currentMatchId = matchId;
    const data = matchData.find(m => m.id === matchId);
    
    // Header and Names Update
    document.getElementById('match-date-display').innerText = data.date;
    document.getElementById('team1-name').innerText = data.t1;
    document.getElementById('team2-name').innerText = data.t2;
    
    // Logos Update
    const img1 = document.getElementById('team1-logo');
    const img2 = document.getElementById('team2-logo');
    img1.src = data.t1_img;
    img2.src = data.t2_img;

    // Fallback Image
    const fallback = "https://cdn-icons-png.flaticon.com/512/53/53283.png";
    img1.onerror = () => { img1.src = fallback; };
    img2.onerror = () => { img2.src = fallback; };

    renderSidebar();
};

const renderSidebar = () => {
    const listContainer = document.getElementById('side-match-list');
    listContainer.innerHTML = '';

    matchData.forEach(match => {
        const isActive = match.id === currentMatchId;
        const card = document.createElement('div');
        card.className = `match-card p-4 rounded-2xl flex flex-col gap-1 ${isActive ? 'active-match shadow-sm' : 'bg-white'}`;
        
        card.innerHTML = `
            <span class="text-[9px] font-bold ${isActive ? 'text-blue-500' : 'text-slate-400'} uppercase tracking-wider">${match.date}</span>
            <div class="flex justify-between items-center">
                <span class="text-[11px] font-black text-slate-800">${match.t1} <span class="text-slate-300 mx-1">vs</span> ${match.t2}</span>
                <div class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}"></div>
            </div>
        `;
        
        card.onclick = () => updateUI(match.id);
        listContainer.appendChild(card);
    });
};

// WALLET CONNECTIVITY LOGIC
const handleWalletAction = async () => {
    if (userAccount) {
        disconnectBtn.classList.toggle('hidden');
    } else {
        await connect();
    }
};

const connect = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            
            // Format address: 0x1234...abcd
            connectBtn.querySelector('span').innerText = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
            walletDot.className = "w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]";
            disconnectBtn.classList.add('hidden');
        } catch (error) {
            console.error("User rejected wallet connection");
        }
    } else {
        alert("Please install MetaMask to use this AI platform.");
    }
};

const disconnect = () => {
    userAccount = null;
    connectBtn.querySelector('span').innerText = "Connect Wallet";
    walletDot.className = "w-2.5 h-2.5 bg-slate-300 rounded-full";
    disconnectBtn.classList.add('hidden');
};

// INITIALIZATION & EVENTS
document.getElementById('bet-t1').onclick = () => alert(`Sending transaction for ${matchData.find(m => m.id === currentMatchId).t1}...`);
document.getElementById('bet-t2').onclick = () => alert(`Sending transaction for ${matchData.find(m => m.id === currentMatchId).t2}...`);
document.getElementById('resolve-btn').onclick = () => alert("AI Oracle: Verification in progress via GenLayer...");

connectBtn.onclick = handleWalletAction;
disconnectBtn.onclick = (e) => {
    e.stopPropagation();
    disconnect();
};

window.onload = () => {
    updateUI("m1");
};
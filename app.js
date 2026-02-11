// Database of matches
const matchData = [
    {
        id: "m1",
        date: "Feb 11",
        t1: "Real Madrid",
        t2: "FC Barcelona",
        t1_img: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
        t2_img: "https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_logo.svg/1024px-FC_Barcelona_logo.svg.png"
    },
    {
        id: "m2",
        date: "Feb 12",
        t1: "Arsenal",
        t2: "Manchester City",
        t1_img: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
        t2_img: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"
    },
    {
        id: "m3",
        date: "Feb 13",
        t1: "Bayern Munich",
        t2: "PSG",
        t1_img: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/1024px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png",
        t2_img: "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg"
    }
];

let currentMatchId = "m1";

const updateUI = (matchId) => {
    currentMatchId = matchId;
    const data = matchData.find(m => m.id === matchId);
    
    // Update main display
    document.getElementById('team1-name').innerText = data.t1.toUpperCase();
    document.getElementById('team2-name').innerText = data.t2.toUpperCase();
    
    const img1 = document.getElementById('team1-logo');
    const img2 = document.getElementById('team2-logo');
    img1.src = data.t1_img;
    img2.src = data.t2_img;

    const fallback = "https://cdn-icons-png.flaticon.com/512/53/53283.png";
    img1.onerror = () => { img1.src = fallback; };
    img2.onerror = () => { img2.src = fallback; };

    // Refresh the sidebar to show active state
    renderSidebar();
};

const renderSidebar = () => {
    const listContainer = document.getElementById('side-match-list');
    listContainer.innerHTML = '';

    matchData.forEach(match => {
        const isActive = match.id === currentMatchId;
        const card = document.createElement('div');
        card.className = `match-card p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 ${isActive ? 'active-match shadow-sm' : 'bg-white'}`;
        
        card.innerHTML = `
            <span class="text-[9px] font-bold text-slate-400 uppercase">${match.date}</span>
            <div class="flex justify-between items-center">
                <span class="text-[11px] font-black text-slate-800">${match.t1} vs ${match.t2}</span>
                <div class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}"></div>
            </div>
        `;
        
        card.onclick = () => updateUI(match.id);
        listContainer.appendChild(card);
    });
};

const connect = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const btn = document.getElementById('connect-btn');
            btn.querySelector('span').innerText = accounts[0].slice(0, 6) + "..." + accounts[0].slice(-4);
            document.getElementById('wallet-dot').className = "w-2 h-2 bg-green-500 rounded-full animate-pulse";
        } catch (error) {
            console.error("User rejected");
        }
    } else {
        alert("Install MetaMask");
    }
};

// Events
document.getElementById('connect-btn').onclick = connect;
document.getElementById('bet-t1').onclick = () => alert(`Bet placed on ${matchData.find(m => m.id === currentMatchId).t1}`);
document.getElementById('bet-t2').onclick = () => alert(`Bet placed on ${matchData.find(m => m.id === currentMatchId).t2}`);

// Start
window.onload = () => {
    renderSidebar();
    updateUI("m1");
};
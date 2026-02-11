// Reliable GitHub Raw URL
const GITHUB_BASE = "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos";

const matches = {
    today: { 
        t1: "Real Madrid", 
        t2: "Barcelona" 
    },
    tomorrow: { 
        t1: "Arsenal", 
        t2: "Manchester City" 
    }
};

const getLogoUrl = (name) => {
    // Standardizing the name for the GitHub repo
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return `${GITHUB_BASE}/${slug}.png`;
};

const updateUI = (day) => {
    const data = matches[day];
    
    // Update Text
    document.getElementById('team1-name').innerText = data.t1.toUpperCase();
    document.getElementById('team2-name').innerText = data.t2.toUpperCase();
    
    // Update Logos with Fallback
    const img1 = document.getElementById('team1-logo');
    const img2 = document.getElementById('team2-logo');

    img1.src = getLogoUrl(data.t1);
    img2.src = getLogoUrl(data.t2);

    // Fallback if image not found
    const fallback = "https://cdn-icons-png.flaticon.com/512/53/53283.png";
    img1.onerror = () => { img1.src = fallback; };
    img2.onerror = () => { img2.src = fallback; };
    
    // Toggle Buttons
    document.getElementById('btn-today').className = day === 'today' ? 'active-date flex-1 py-2.5 text-[11px] font-bold rounded-xl uppercase' : 'flex-1 py-2.5 text-[11px] font-bold text-slate-500 rounded-xl uppercase';
    document.getElementById('btn-tomorrow').className = day === 'tomorrow' ? 'active-date flex-1 py-2.5 text-[11px] font-bold rounded-xl uppercase' : 'flex-1 py-2.5 text-[11px] font-bold text-slate-500 rounded-xl uppercase';
};

// Wallet connection logic
const connect = async () => {
    if (window.ethereum) {
        try {
            const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
            document.getElementById('connect-btn').innerHTML = `<span>${accs[0].slice(0,6)}...${accs[0].slice(-4)}</span>`;
            document.getElementById('wallet-dot').className = "w-2 h-2 bg-green-500 rounded-full animate-pulse";
        } catch (e) { console.error("Connect failed", e); }
    } else { alert("Install MetaMask"); }
};

document.getElementById('connect-btn').onclick = connect;
document.getElementById('btn-today').onclick = () => updateUI('today');
document.getElementById('btn-tomorrow').onclick = () => updateUI('tomorrow');

window.onload = () => updateUI('today');
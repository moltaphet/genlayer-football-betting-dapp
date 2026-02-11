// Function to generate high-quality logo URL from the GitHub repo
const getLogo = (teamName) => {
    // Convert "Real Madrid" to "real-madrid" to match GitHub file names
    const slug = teamName.toLowerCase().replace(/ /g, "-");
    return `https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/${slug}.png`;
};

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

const updateUI = (day) => {
    const data = matches[day];
    
    // Update Names
    document.getElementById('team1-name').innerText = data.t1.toUpperCase();
    document.getElementById('team2-name').innerText = data.t2.toUpperCase();
    
    // Update Logos dynamically from GitHub
    document.getElementById('team1-logo').src = getLogo(data.t1);
    document.getElementById('team2-logo').src = getLogo(data.t2);
    
    // UI Button Styles
    document.getElementById('btn-today').className = day === 'today' ? 'active-date flex-1 py-2.5 text-[11px] font-bold rounded-xl uppercase' : 'flex-1 py-2.5 text-[11px] font-bold text-slate-500 rounded-xl uppercase';
    document.getElementById('btn-tomorrow').className = day === 'tomorrow' ? 'active-date flex-1 py-2.5 text-[11px] font-bold rounded-xl uppercase' : 'flex-1 py-2.5 text-[11px] font-bold text-slate-500 rounded-xl uppercase';
};

// Wallet, Bet and Resolve functions (Existing logic)
const connect = async () => {
    if (window.ethereum) {
        try {
            const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
            document.getElementById('connect-btn').querySelector('span').innerText = accs[0].slice(0,6) + "..." + accs[0].slice(-4);
            document.getElementById('wallet-dot').className = "w-2 h-2 bg-green-500 rounded-full animate-pulse";
        } catch (e) { console.error("Connection failed"); }
    } else { alert("Please install MetaMask"); }
};

document.getElementById('connect-btn').onclick = connect;
document.getElementById('btn-today').onclick = () => updateUI('today');
document.getElementById('btn-tomorrow').onclick = () => updateUI('tomorrow');
document.getElementById('bet-t1').onclick = () => alert("Betting on T1...");
document.getElementById('bet-t2').onclick = () => alert("Betting on T2...");
document.getElementById('resolve-btn').onclick = () => alert("AI Oracle verification started...");

window.onload = () => updateUI('today');
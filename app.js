// Function to get high-quality logos
const getLogoUrl = (teamName) => {
    // Standardizing the name for the API
    const encodedName = encodeURIComponent(teamName);
    return `https://www.thesportsdb.com/images/media/team/badge/small/${encodedName}.png`;
};

const matches = {
    today: { 
        t1: "Real Madrid", 
        t2: "FC Barcelona" // Added FC for better matching
    },
    tomorrow: { 
        t1: "Arsenal", 
        t2: "Manchester City" 
    }
};

const updateUI = (day) => {
    const data = matches[day];
    
    // Update Text
    document.getElementById('team1-name').innerText = data.t1.toUpperCase();
    document.getElementById('team2-name').innerText = data.t2.toUpperCase();
    
    // Update Logos
    const img1 = document.getElementById('team1-logo');
    const img2 = document.getElementById('team2-logo');

    // Special URLs for common teams to ensure 100% success
    const specialLogos = {
        "Real Madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
        "FC Barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_logo.svg",
        "Arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
        "Manchester City": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"
    };

    img1.src = specialLogos[data.t1] || getLogoUrl(data.t1);
    img2.src = specialLogos[data.t2] || getLogoUrl(data.t2);

    // Fallback if image fails
    const fallback = "https://cdn-icons-png.flaticon.com/512/53/53283.png";
    img1.onerror = () => { img1.src = fallback; };
    img2.onerror = () => { img2.src = fallback; };
    
    // Button States
    document.getElementById('btn-today').className = day === 'today' ? 'active-date flex-1 py-2.5 text-[11px] font-bold rounded-xl uppercase' : 'flex-1 py-2.5 text-[11px] font-bold text-slate-500 rounded-xl uppercase';
    document.getElementById('btn-tomorrow').className = day === 'tomorrow' ? 'active-date flex-1 py-2.5 text-[11px] font-bold rounded-xl uppercase' : 'flex-1 py-2.5 text-[11px] font-bold text-slate-500 rounded-xl uppercase';
};

// Wallet connection
const connect = async () => {
    if (window.ethereum) {
        try {
            const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const btn = document.getElementById('connect-btn');
            btn.querySelector('span').innerText = accs[0].slice(0,6) + "..." + accs[0].slice(-4);
            document.getElementById('wallet-dot').className = "w-2 h-2 bg-green-500 rounded-full animate-pulse";
        } catch (e) { console.error("Connection failed"); }
    } else { alert("Please install MetaMask"); }
};

document.getElementById('connect-btn').onclick = connect;
document.getElementById('btn-today').onclick = () => updateUI('today');
document.getElementById('btn-tomorrow').onclick = () => updateUI('tomorrow');

window.onload = () => updateUI('today');
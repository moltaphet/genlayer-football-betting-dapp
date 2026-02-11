const matches = {
    today: { t1: "Real Madrid", t2: "Barcelona", t1_img: "https://flagcdn.com/w160/es.png", t2_img: "https://flagcdn.com/w160/es.png" },
    tomorrow: { t1: "Arsenal", t2: "Man City", t1_img: "https://flagcdn.com/w160/gb.png", t2_img: "https://flagcdn.com/w160/gb.png" }
};

const updateUI = (day) => {
    const data = matches[day];
    document.getElementById('team1-name').innerText = data.t1;
    document.getElementById('team2-name').innerText = data.t2;
    document.getElementById('team1-logo').src = data.t1_img;
    document.getElementById('team2-logo').src = data.t2_img;
    
    document.getElementById('btn-today').className = day === 'today' ? 'active-date flex-1 py-2.5 text-[11px] font-bold rounded-xl uppercase' : 'flex-1 py-2.5 text-[11px] font-bold text-slate-500 rounded-xl uppercase';
    document.getElementById('btn-tomorrow').className = day === 'tomorrow' ? 'active-date flex-1 py-2.5 text-[11px] font-bold rounded-xl uppercase' : 'flex-1 py-2.5 text-[11px] font-bold text-slate-500 rounded-xl uppercase';
};

const connect = async () => {
    if (window.ethereum) {
        try {
            const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const btn = document.getElementById('connect-btn');
            btn.querySelector('span').innerText = accs[0].slice(0,6) + "..." + accs[0].slice(-4);
            document.getElementById('wallet-dot').className = "w-2 h-2 bg-green-500 rounded-full animate-pulse";
        } catch (e) { console.log("Connection failed"); }
    } else { alert("Please install MetaMask"); }
};

// Bind Events
document.getElementById('connect-btn').onclick = connect;
document.getElementById('btn-today').onclick = () => updateUI('today');
document.getElementById('btn-tomorrow').onclick = () => updateUI('tomorrow');
document.getElementById('bet-t1').onclick = () => alert("Betting on T1...");
document.getElementById('bet-t2').onclick = () => alert("Betting on T2...");
document.getElementById('resolve-btn').onclick = () => alert("AI Oracle verification started...");

// Init
window.onload = () => updateUI('today');
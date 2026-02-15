const CONTRACT_ADDRESS = "0x4d8Cd6Caa7D7681AeF2E3B6e21FFB3238eCb4814";
const matchData = [
    { id: "m1", date: "Today, Feb 15", t1: "Real Madrid", t2: "Barcelona", t1_img: "https://crests.football-data.org/86.svg", t2_img: "https://crests.football-data.org/81.svg" },
    { id: "m2", date: "Feb 16, 20:45", t1: "Arsenal", t2: "Man City", t1_img: "https://crests.football-data.org/57.svg", t2_img: "https://crests.football-data.org/65.svg" }
];

let userAccount = null;
const connectBtn = document.getElementById('connect-btn');
const walletDot = document.getElementById('wallet-dot');
const disconnectMenu = document.getElementById('disconnect-menu');
const walletWrapper = document.getElementById('wallet-wrapper');
const amountInput = document.getElementById('bet-amount');
const historyBody = document.getElementById('betting-history-body');

const updateWalletUI = (connected) => {
    if (connected && userAccount) {
        connectBtn.querySelector('span').innerText = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
        walletDot.className = "w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]";
        walletWrapper.onmouseenter = () => disconnectMenu.style.display = 'block';
        walletWrapper.onmouseleave = () => disconnectMenu.style.display = 'none';
    } else {
        connectBtn.querySelector('span').innerText = "Connect Wallet";
        walletDot.className = "w-2.5 h-2.5 bg-slate-300 rounded-full shadow-none";
        disconnectMenu.style.display = 'none';
        walletWrapper.onmouseenter = null;
        walletWrapper.onmouseleave = null;
    }
};

const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            updateWalletUI(true);
        } catch (e) { console.error(e); }
    } else { alert("Install GenLayer Extension"); }
};

const disconnectWallet = () => {
    userAccount = null;
    updateWalletUI(false);
};

const addBetToHistory = (team, amount) => {
    const row = document.createElement('tr');
    row.className = "border-b";
    row.innerHTML = `<td class="py-4 font-mono text-xs">${userAccount.slice(0,10)}...</td><td class="py-4 font-black">Team ${team}</td><td class="py-4 text-right">${amount} GEN</td>`;
    historyBody.prepend(row);
};

const updateUI = (id) => {
    const data = matchData.find(m => m.id === id);
    document.getElementById('match-date-display').innerText = data.date;
    document.getElementById('team1-name').innerText = data.t1;
    document.getElementById('team2-name').innerText = data.t2;
    document.getElementById('team1-logo').src = data.t1_img;
    document.getElementById('team2-logo').src = data.t2_img;
    renderSidebar(id);
};

const renderSidebar = (currentId) => {
    const list = document.getElementById('side-match-list');
    list.innerHTML = '';
    matchData.forEach(m => {
        const div = document.createElement('div');
        div.className = `match-card p-4 rounded-2xl ${m.id === currentId ? 'active-match' : 'bg-white'}`;
        div.innerHTML = `<p class="text-[10px] uppercase font-bold text-slate-400">${m.date}</p><p class="font-black">${m.t1} vs ${m.t2}</p>`;
        div.onclick = () => updateUI(m.id);
        list.appendChild(div);
    });
};

connectBtn.onclick = () => { if (!userAccount) connectWallet(); };
document.getElementById('disconnect-btn-actual').onclick = (e) => { e.stopPropagation(); disconnectWallet(); };
document.getElementById('bet-t1').onclick = () => { if(userAccount) addBetToHistory(1, amountInput.value); else alert("Connect Wallet"); };
document.getElementById('bet-t2').onclick = () => { if(userAccount) addBetToHistory(2, amountInput.value); else alert("Connect Wallet"); };

window.onload = () => updateUI("m1");
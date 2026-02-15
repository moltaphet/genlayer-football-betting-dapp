const matchData = [
    { id: "m1", date: "Today, Feb 15", t1: "Real Madrid", t2: "Barcelona", t1_img: "https://crests.football-data.org/86.svg", t2_img: "https://crests.football-data.org/81.svg" },
    { id: "m2", date: "Feb 16, 20:45", t1: "Arsenal", t2: "Man City", t1_img: "https://crests.football-data.org/57.svg", t2_img: "https://crests.football-data.org/65.svg" }
];

let userAccount = null;
const connectBtn = document.getElementById('connect-btn');
const walletDot = document.getElementById('wallet-dot');
const disconnectMenu = document.getElementById('disconnect-menu');
const walletWrapper = document.getElementById('wallet-wrapper');

// Function to FORCE hide the menu
const forceHideMenu = () => {
    if (disconnectMenu) {
        disconnectMenu.setAttribute('style', 'display: none !important');
    }
};

// Function to SHOW the menu
const showMenu = () => {
    if (userAccount && disconnectMenu) {
        disconnectMenu.setAttribute('style', 'display: block !important');
    }
};

const updateWalletUI = (connected) => {
    if (connected && userAccount) {
        connectBtn.querySelector('span').innerText = userAccount.slice(0, 6) + "..." + userAccount.slice(-4);
        walletDot.style.backgroundColor = "#22c55e"; // Green
        
        // Manual Hover logic to bypass any CSS conflicts
        walletWrapper.onmouseenter = showMenu;
        walletWrapper.onmouseleave = forceHideMenu;
    } else {
        connectBtn.querySelector('span').innerText = "Connect Wallet";
        walletDot.style.backgroundColor = "#cbd5e1"; // Slate
        forceHideMenu();
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

// THE DISCONNECT LOGIC
const disconnectWallet = (e) => {
    if (e) e.stopPropagation();
    userAccount = null;
    updateWalletUI(false);
    forceHideMenu(); // Instant vanish
    console.log("Wallet Disconnected Successfully");
};

// Attach events
connectBtn.onclick = () => { if (!userAccount) connectWallet(); };

const discBtn = document.getElementById('disconnect-btn-actual');
if (discBtn) {
    discBtn.onclick = disconnectWallet;
}

// UI Render Logic
const updateUI = (id) => {
    const data = matchData.find(m => m.id === id);
    document.getElementById('match-date-display').innerText = data.date;
    document.getElementById('team1-name').innerText = data.t1;
    document.getElementById('team2-name').innerText = data.t2;
    document.getElementById('team1-logo').src = data.t1_img;
    document.getElementById('team2-logo').src = data.t2_img;
};

window.onload = () => updateUI("m1");
// Database with direct stable links
const matches = {
    today: { 
        t1: "Real Madrid", 
        t2: "FC Barcelona",
        t1_img: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
        t2_img: "https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_logo.svg/1024px-FC_Barcelona_logo.svg.png"
    },
    tomorrow: { 
        t1: "Arsenal", 
        t2: "Manchester City",
        t1_img: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
        t2_img: "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"
    }
};

const updateUI = (day) => {
    const data = matches[day];
    
    // Update text elements
    document.getElementById('team1-name').innerText = data.t1.toUpperCase();
    document.getElementById('team2-name').innerText = data.t2.toUpperCase();
    
    // Update logo sources directly
    const img1 = document.getElementById('team1-logo');
    const img2 = document.getElementById('team2-logo');
    
    img1.src = data.t1_img;
    img2.src = data.t2_img;

    // Error handling: show a football icon if link fails
    const fallback = "https://cdn-icons-png.flaticon.com/512/53/53283.png";
    img1.onerror = () => { img1.src = fallback; };
    img2.onerror = () => { img2.src = fallback; };
    
    // Style active/inactive date buttons
    const btnToday = document.getElementById('btn-today');
    const btnTomorrow = document.getElementById('btn-tomorrow');
    
    if (day === 'today') {
        btnToday.className = 'active-date flex-1 py-2.5 text-[11px] font-bold rounded-xl uppercase';
        btnTomorrow.className = 'flex-1 py-2.5 text-[11px] font-bold text-slate-500 rounded-xl uppercase';
    } else {
        btnToday.className = 'flex-1 py-2.5 text-[11px] font-bold text-slate-500 rounded-xl uppercase';
        btnTomorrow.className = 'active-date flex-1 py-2.5 text-[11px] font-bold rounded-xl uppercase';
    }
};

const connect = async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const btn = document.getElementById('connect-btn');
            const address = accounts[0];
            
            // Format: 0x1234...abcd
            btn.querySelector('span').innerText = address.slice(0, 6) + "..." + address.slice(-4);
            document.getElementById('wallet-dot').className = "w-2 h-2 bg-green-500 rounded-full animate-pulse";
        } catch (error) {
            console.error("User rejected the request.");
        }
    } else {
        alert("MetaMask not detected!");
    }
};

// Event Listeners
document.getElementById('connect-btn').onclick = connect;
document.getElementById('btn-today').onclick = () => updateUI('today');
document.getElementById('btn-tomorrow').onclick = () => updateUI('tomorrow');

// Initialization
window.onload = () => {
    updateUI('today');
};
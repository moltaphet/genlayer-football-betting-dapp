/**
 * ============================================================
 * GENBET AI — main.js (FINAL: WITH RECEIPT MODAL & FIXES)
 * ============================================================
 */

'use strict';

import { GenBetContract } from './services/genbet.js';

// ─────────────────────────────────────────────────────────────
// 1. CONFIG
// ─────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS = '0xf8895A42AECe956975083A2595b982321EF76615';
const RPC_URL          = 'https://studio.genlayer.com/api';

const CONFIG = Object.freeze({
  CONTRACT_ADDRESS,
  RPC_URL,
  EXPLORER_TX_URL:  'https://genlayer-explorer.vercel.app/tx/',
  MIN_STAKE_GEN:    10,
  LOGO_BASE:        '/logos',
  FALLBACK_LOGO:    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23021409'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='28' font-family='monospace' fill='%2310b981'%3E%3F%3C/text%3E%3C/svg%3E",
});

// `gameDate` (YYYY-MM-DD) is what the contract uses to build the BBC
// resolution URL and to derive the bet id. `date` is display-only.
const MATCHES = [
  {
    id:'m1',
    date:'LIVE - Today',
    gameDate:'2026-06-26',
    deadline: 1893456000,
    team1:'Real Madrid',
    team2:'Barcelona',
    logo1: `${CONFIG.LOGO_BASE}/spain-la-liga-2025-2026.football-logos.cc/256x256/real-madrid.football-logos.cc.png`,
    logo2: `${CONFIG.LOGO_BASE}/spain-la-liga-2025-2026.football-logos.cc/256x256/barcelona.football-logos.cc.png`,
    oddsT1: 1.85,
    oddsT2: 2.10
  },
  {
    id:'m2',
    date:'May 8, 20:45',
    gameDate:'2026-05-08',
    deadline: 1893456000,
    team1:'Arsenal',
    team2:'Man City',
    logo1: `${CONFIG.LOGO_BASE}/english-premier-league-2025-2026.football-logos.cc/256x256/arsenal.football-logos.cc.png`,
    logo2: `${CONFIG.LOGO_BASE}/english-premier-league-2025-2026.football-logos.cc/256x256/manchester-city.football-logos.cc.png`,
    oddsT1: 2.45,
    oddsT2: 1.65
  }
];

// ─────────────────────────────────────────────────────────────
// 2. STATE
// ─────────────────────────────────────────────────────────────

const STATE = {
  userAccount:    null,
  currentMatchId: 'm1',
  selectedOdds:    1.85,
  bets:            [],   // bets fetched from the contract for the connected wallet
  playerPoints:    0,
  contract:        null, // GenBetContract instance
  isBetting:       false,
};

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

const el      = (id) => document.getElementById(id);
const nowSec  = ()   => Math.floor(Date.now() / 1000);
const findMatch = (id) => MATCHES.find((m) => m.id === id);

function resolveProvider() {
  if (window.ethereum && typeof window.ethereum.request === 'function') return window.ethereum;
  return null;
}

function setLogoSrc(imgEl, rawPath) {
  if (!imgEl) return;
  imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = CONFIG.FALLBACK_LOGO; };
  imgEl.src = encodeURI(rawPath);
}

// ─────────────────────────────────────────────────────────────
// WEB3 & STORAGE
// ─────────────────────────────────────────────────────────────

const Web3 = {
  async connectWallet() {
    const provider = resolveProvider();
    if (!provider) { UI.Toast.show('INSTALL METAMASK', 'error'); return; }
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      STATE.userAccount = accounts[0];
      // Pass the MetaMask address to genlayer-js; writes are signed via MetaMask.
      STATE.contract = new GenBetContract(CONFIG.CONTRACT_ADDRESS, CONFIG.RPC_URL, STATE.userAccount);

      UI.Wallet.update(true);
      UI.Toast.show('CONNECTED', 'success');
      await Bets.refresh();
    } catch (err) {
      console.error('connectWallet failed:', err);
      UI.Toast.show('CONNECTION FAILED', 'error');
    }
  },

  disconnectWallet() {
    STATE.userAccount = null;
    STATE.contract = null;
    STATE.bets = [];
    STATE.playerPoints = 0;
    UI.Wallet.update(false);
    UI.History.render();
    UI.Toast.show('DISCONNECTED', 'info');
  },

  async sendBetTransaction(teamIndex) {
    if (STATE.isBetting) return;
    if (!STATE.userAccount || !STATE.contract) { UI.Toast.show('CONNECT WALLET', 'error'); return; }

    const match = findMatch(STATE.currentMatchId);
    const stake = parseFloat(el('bet-amount')?.value);

    if (!stake || stake < CONFIG.MIN_STAKE_GEN) {
      UI.Toast.show(`MIN: ${CONFIG.MIN_STAKE_GEN} GEN`, 'error'); return;
    }

    STATE.isBetting = true;
    UI.Terminal.setLoadingState(true, teamIndex);
    UI.Toast.show('CONFIRM IN METAMASK...', 'info');

    try {
      const predictedWinner = teamIndex === 1 ? '1' : '2';
      const { txHash } = await STATE.contract.createBet(
        match.gameDate, match.team1, match.team2, predictedWinner
      );

      const receipt = {
        wallet: STATE.userAccount.toLowerCase(),
        matchName: `${match.team1} vs ${match.team2}`,
        pick: teamIndex === 1 ? match.team1 : match.team2,
        odds: STATE.selectedOdds,
        stake,
        txHash,
      };
      UI.Modal.show(receipt);

      if (el('bet-amount')) el('bet-amount').value = '';
      Calculations.update();
      await Bets.refresh();
    } catch (err) {
      console.error('createBet failed:', err);
      UI.Toast.show(Bets.errMsg(err, 'BET FAILED'), 'error');
    } finally {
      STATE.isBetting = false;
      UI.Terminal.setLoadingState(false);
      UI.Terminal.refresh(match);
    }
  },

  async resolveBet(betId) {
    if (!STATE.contract) { UI.Toast.show('CONNECT WALLET', 'error'); return; }
    UI.Toast.show('RESOLVING...', 'info');
    try {
      const { txHash } = await STATE.contract.resolveBet(betId);
      UI.Toast.show('BET RESOLVED', 'success');
      await Bets.refresh();
      return txHash;
    } catch (err) {
      console.error('resolveBet failed:', err);
      UI.Toast.show(Bets.errMsg(err, 'RESOLVE FAILED'), 'error');
    }
  }
};

const Bets = {
  // Pull the connected wallet's bets + points from the contract and re-render.
  async refresh() {
    if (!STATE.contract || !STATE.userAccount) { UI.History.render(); return; }
    try {
      const [bets, points] = await Promise.all([
        STATE.contract.getBets(),
        STATE.contract.getPlayerPoints(STATE.userAccount),
      ]);
      STATE.bets = bets;
      STATE.playerPoints = points;
    } catch (err) {
      console.error('Bets.refresh failed:', err);
      STATE.bets = [];
    }
    UI.History.render();
  },

  errMsg(err, fallback) {
    const raw = (err && (err.message || err.shortMessage)) || '';
    if (/already exists/i.test(raw)) return 'BET ALREADY EXISTS';
    if (/not finished/i.test(raw))  return 'MATCH NOT FINISHED';
    if (/already resolved/i.test(raw)) return 'ALREADY RESOLVED';
    if (/not found/i.test(raw)) return 'BET NOT FOUND';
    if (/user rejected|denied/i.test(raw)) return 'REJECTED IN WALLET';
    return fallback;
  }
};

// ─────────────────────────────────────────────────────────────
// CALCULATIONS
// ─────────────────────────────────────────────────────────────

const Calculations = {
  compute() {
    const stakeInput = el('bet-amount');
    const stake = parseFloat(stakeInput?.value) || 0;
    const odds = parseFloat(STATE.selectedOdds) || 0;
    const totalPayout = stake * odds;
    const netProfit = totalPayout - stake;

    return { 
      stake, 
      netProfit: netProfit > 0 ? netProfit : 0, 
      totalPayout: totalPayout > 0 ? totalPayout : 0 
    };
  },

  update() {
    const { stake, netProfit, totalPayout } = Calculations.compute();
    const targets = [
      { element: el('calc-payout'), value: totalPayout.toFixed(2), prefix: '' },
      { element: el('net-profit'), value: netProfit.toFixed(2), prefix: '+' },
      { element: el('calc-loss'), value: netProfit.toFixed(2), prefix: '-' }
    ];

    targets.forEach(item => {
      if (!item.element) return;
      
      const fullText = item.prefix + item.value;
      item.element.textContent = fullText;

      // --- AUTO-SCALE FONT SIZE ---
      const length = fullText.length;
      let fontSize = '14px'; 

      if (length > 18) fontSize = '8px';
      else if (length > 15) fontSize = '10px';
      else if (length > 12) fontSize = '12px';

      Object.assign(item.element.style, {
        fontSize: fontSize,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'block',
        maxWidth: '100%'
      });
    });
  },
};

// ─────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────

const UI = {
  Wallet: {
    update(connected) {
      const btn = el('connect-btn');
      const dot = el('wallet-dot');
      if (!btn || !dot) return;
      const span = btn.querySelector('span');
      if (connected && STATE.userAccount) {
        span.textContent = `${STATE.userAccount.slice(0, 6)}...${STATE.userAccount.slice(-4)}`;
        dot.className = 'w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-md';
      } else {
        span.textContent = 'CONNECT WALLET';
        dot.className = 'w-2.5 h-2.5 bg-slate-300 rounded-full';
        el('disconnect-menu')?.classList.add('hidden');
      }
    }
  },

  Match: {
    load(matchId) {
      STATE.currentMatchId = matchId;
      const match = findMatch(matchId);
      if (!match) return;

      if (el('match-date-display')) el('match-date-display').textContent = match.date;
      if (el('team1-name')) el('team1-name').textContent = match.team1;
      if (el('team2-name')) el('team2-name').textContent = match.team2;

      const oddsButtons = document.querySelectorAll('.odds-btn');
      if (oddsButtons.length >= 2) {
        oddsButtons[0].textContent = match.oddsT1.toFixed(2);
        oddsButtons[1].textContent = match.oddsT2.toFixed(2);
        UI.Terminal.setOdds(match.oddsT1, oddsButtons[0]);
      }

      const logoConfigs = [
        { id: 'team1-logo', src: match.logo1 },
        { id: 'team2-logo', src: match.logo2 }
      ];

      logoConfigs.forEach((cfg) => {
        const img = el(cfg.id);
        if (img) {
          Object.assign(img.style, {
            width: '450px', height: '450px', maxWidth: '140%', maxHeight: '140%',
            objectFit: 'contain', background: 'transparent', transform: 'scale(1.4)', 
            pointerEvents: 'none', transition: 'transform 0.3s ease'
          });
          const parent = img.parentElement;
          if(parent) {
            Object.assign(parent.style, {
              background: "transparent", border: "none", boxShadow: "none",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible"
            });
            Array.from(parent.children).forEach(child => { if (child !== img) child.style.display = 'none'; });
          }
          setLogoSrc(img, cfg.src);
        }
      });

      UI.Match.Sidebar.render();
      UI.Terminal.refresh(match);
      Calculations.update();
    },

    Sidebar: {
      render() {
        const list = el('side-match-list');
        if (!list) return;
        list.innerHTML = '';
        MATCHES.forEach((match) => {
          const isActive = match.id === STATE.currentMatchId;
          const card = document.createElement('div');
          card.className = `p-4 rounded-2xl cursor-pointer mb-3 transition-all ${isActive ? 'bg-white shadow-xl border-l-4 border-blue-600' : 'bg-white/40 hover:bg-white'}`;
          card.innerHTML = `
            <div class="text-[9px] font-bold ${isActive ? 'text-blue-500' : 'text-slate-400'} uppercase">${match.date}</div>
            <div class="text-[11px] font-black text-slate-800 uppercase">${match.team1} VS ${match.team2}</div>
          `;
          card.onclick = () => UI.Match.load(match.id);
          list.appendChild(card);
        });
      }
    }
  },

  Terminal: {
    refresh(match) {
      const isExpired = nowSec() > match.deadline;
      const b1 = el('bet-t1');
      const b2 = el('bet-t2');

      [b1, b2].forEach((btn, idx) => {
        if (!btn) return;
        btn.disabled = isExpired;
        if (isExpired) {
          btn.textContent = "CLOSED";
          btn.className = "flex-1 py-4 rounded-2xl bg-slate-200 text-slate-400 font-black text-[11px] cursor-not-allowed";
        } else {
          btn.textContent = idx === 0 ? "BET " + match.team1.toUpperCase() : "BET " + match.team2.toUpperCase();
          btn.className = idx === 0 ? "flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black text-[11px] shadow-lg hover:opacity-90 transition-opacity" : "flex-1 py-4 rounded-2xl bg-slate-800 text-white font-black text-[11px] shadow-lg hover:opacity-90 transition-opacity";
        }
      });
    },

    setLoadingState(loading, teamIndex = null) {
      const btns = [el('bet-t1'), el('bet-t2')];
      btns.forEach((btn, idx) => {
        if (!btn) return;
        btn.disabled = loading;
        if (loading) {
          btn.style.opacity = "0.7";
          btn.style.cursor = "not-allowed";
          if (teamIndex !== null && (idx + 1) === teamIndex) {
            btn.textContent = "PENDING...";
            btn.classList.add('animate-pulse');
          }
        } else {
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
          btn.classList.remove('animate-pulse');
        }
      });
    },

    setOdds(odds, clickedBtn) {
      STATE.selectedOdds = parseFloat(odds);
      document.querySelectorAll('.odds-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'shadow-lg');
        btn.classList.add('bg-white', 'text-blue-600');
        Object.assign(btn.style, { border: 'none', transform: 'scale(1)', zIndex: '1' });
      });

      if (clickedBtn) {
        clickedBtn.classList.remove('bg-white', 'text-blue-600');
        clickedBtn.classList.add('bg-blue-600', 'text-white', 'shadow-lg');
        Object.assign(clickedBtn.style, { transform: 'scale(1)', zIndex: '10' });
      }
      Calculations.update(); 
    }
  },

  History: {
    render() {
      const tbody = el('betting-history-body');
      if (!tbody) return;

      if (!STATE.userAccount) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-400 text-[10px] uppercase">CONNECT WALLET</td></tr>`;
        return;
      }

      if (STATE.bets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-400 text-[10px] uppercase">NO HISTORY FOUND</td></tr>`;
        return;
      }

      tbody.innerHTML = STATE.bets.map(bet => {
        const pick = bet.predicted_winner === '1' ? bet.team1 : bet.team2;
        const resolved = bet.has_resolved === true || bet.has_resolved === 'true';
        const status = resolved
          ? `<span class="text-green-600">${bet.real_score || 'RESOLVED'}</span>`
          : `<button data-bet-id="${bet.id}" class="resolve-btn text-blue-500 hover:underline font-black text-[9px] uppercase">RESOLVE ↻</button>`;
        return `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
          <td class="py-4 px-4 font-black text-slate-800 text-[10px] w-[40%] text-left uppercase">${bet.team1} vs ${bet.team2}</td>
          <td class="py-4 px-4 text-center text-[10px] font-bold text-slate-600 w-[30%] uppercase">${pick}</td>
          <td class="py-4 px-4 text-right font-black text-[10px] w-[30%]">${status}</td>
        </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.resolve-btn').forEach(btn => {
        btn.addEventListener('click', () => Web3.resolveBet(btn.dataset.betId));
      });
    }
  },

  Modal: {
    show(bet) {
      const modal = el('bet-modal');
      const content = el('receipt-content');
      if (!modal || !content) return;

      content.innerHTML = `
        <div class="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200">
          <div class="text-center mb-4">
            <div class="text-[10px] font-bold text-blue-600 uppercase mb-1">Match Detail</div>
            <div class="text-sm font-black text-slate-800 uppercase">${bet.matchName}</div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white p-3 rounded-xl border border-slate-100 text-center">
              <div class="text-[9px] font-bold text-slate-400 uppercase">Your Pick</div>
              <div class="text-[12px] font-black text-slate-800 uppercase">${bet.pick}</div>
            </div>
            <div class="bg-white p-3 rounded-xl border border-slate-100 text-center">
              <div class="text-[9px] font-bold text-slate-400 uppercase">Odds</div>
              <div class="text-[12px] font-black text-blue-600">${bet.odds.toFixed(2)}</div>
            </div>
            <div class="bg-white p-3 rounded-xl border border-slate-100 text-center">
              <div class="text-[9px] font-bold text-slate-400 uppercase">Stake</div>
              <div class="text-[12px] font-black text-slate-800">${bet.stake} GEN</div>
            </div>
            <div class="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
              <div class="text-[9px] font-bold text-green-600 uppercase">Est. Payout</div>
              <div class="text-[12px] font-black text-green-700">${(bet.stake * bet.odds).toFixed(2)} GEN</div>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-200 text-center">
            <a href="${CONFIG.EXPLORER_TX_URL}${bet.txHash}" target="_blank" class="inline-block text-blue-500 font-bold text-[10px] hover:underline uppercase">
              Verify On Blockchain ↗
            </a>
          </div>
        </div>
      `;

      modal.classList.remove('hidden');
    },
    close() {
      const modal = el('bet-modal');
      if (modal) modal.classList.add('hidden');
    }
  },

  Toast: {
    show(msg, type) {
      const toast = document.createElement('div');
      toast.className = `fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-2xl text-white text-[11px] font-black uppercase shadow-xl ${type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  }
};

window.closeBetModal = () => UI.Modal.close();

// Expose contract actions for manual use / debugging from the console.
window.GenBet = {
  resolveBet: (betId) => Web3.resolveBet(betId),
  getBets:    () => STATE.contract?.getBets(),
  getPoints:  () => STATE.contract?.getPoints(),
  getPlayerPoints: (addr) => STATE.contract?.getPlayerPoints(addr || STATE.userAccount),
  contractAddress: CONFIG.CONTRACT_ADDRESS,
};

window.addEventListener('DOMContentLoaded', () => {
  el('connect-btn')?.addEventListener('click', () => {
    if (!STATE.userAccount) Web3.connectWallet();
    else el('disconnect-menu')?.classList.toggle('hidden');
  });
  
  el('disconnect-btn-actual')?.addEventListener('click', Web3.disconnectWallet);
  el('bet-amount')?.addEventListener('input', Calculations.update);
  
  document.querySelectorAll('.odds-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      UI.Terminal.setOdds(this.textContent, this);
    });
  });

  el('bet-t1')?.addEventListener('click', () => Web3.sendBetTransaction(1));
  el('bet-t2')?.addEventListener('click', () => Web3.sendBetTransaction(2));

  UI.Match.load('m1');
});
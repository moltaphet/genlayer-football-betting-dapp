# v0.1.0
# { "Depends": "py-genlayer:latest" }

from genlayer import *
import json
from dataclasses import dataclass

@allow_storage
@dataclass
class BetInfo:
    team: u256
    amount: u256

class PredictionMarket(gl.Contract):
    has_resolved: bool
    team1: str
    team2: str
    resolution_url: str
    winner: u256  # 1: Team1, 2: Team2, 0: Draw
    score: str
    total_pool: u256
    bets: TreeMap[Address, BetInfo]
    pool_team1: u256
    pool_team2: u256

    def __init__(self, game_date: str, team1: str, team2: str):
        """
        Initializes the betting market.
        game_date format: YYYY-MM-DD (e.g., 2026-05-02)
        """
        self.has_resolved = False
        self.resolution_url = f"https://www.bbc.com/sport/football/scores-fixtures/{game_date}"
        self.team1 = team1
        self.team2 = team2
        self.winner = u256(0)
        self.score = ""
        self.total_pool = u256(0)
        self.pool_team1 = u256(0)
        self.pool_team2 = u256(0)
        self.bets = TreeMap()

    @gl.public.write
    def place_bet(self, predicted_winner: int):
        """Allows users to place bets on Team 1 or Team 2"""
        assert not self.has_resolved, "Market is already closed and resolved"
        
        # Minimum bet set to 10 GEN (assuming 18 decimals)
        min_bet = u256(10 * 10**18)
        amount = gl.message.value
        assert amount >= min_bet, "Minimum bet amount is 10 GEN"
        
        team_id = u256(predicted_winner)
        assert team_id in [u256(1), u256(2)], "Invalid selection: Choose 1 (Team1) or 2 (Team2)"
        
        sender = gl.message.sender_address
        self.bets[sender] = BetInfo(team=team_id, amount=amount)
        
        self.total_pool += amount
        if team_id == u256(1):
            self.pool_team1 += amount
        else:
            self.pool_team2 += amount
        
        return "SUCCESS: BET_PLACED"

    @gl.public.write
    def resolve_market(self):
        """Fetches results via AI Oracle and distributes funds"""
        if self.has_resolved:
            return "ERROR: ALREADY_RESOLVED"

        # Fetching raw text from the sports page
        web_content = gl.nondet.web.render(self.resolution_url, mode="text")
        
        # Strict prompt to ensure AI returns valid JSON
        prompt = (f"Analyze the following football score data: {web_content[:2000]}. "
                  f"Identify the winner between {self.team1} and {self.team2}. "
                  "Rules: Return 1 if Team1 won, 2 if Team2 won, 0 if it was a Draw. "
                  "Your response must be ONLY a valid JSON object like: "
                  "{\"winner\": int, \"score\": \"string\"}")

        # Consensus logic with 3 proposers
        raw_result = gl.eq_principle.prompt_non_comparative(
            gl.nondet.exec_prompt(prompt, num_proposers=3)
        )

        try:
            result = json.loads(raw_result)
            win_id = int(result.get("winner", -1))
            
            if win_id in [0, 1, 2]:
                self.has_resolved = True
                self.winner = u256(win_id)
                self.score = result.get("score", "N/A")
                
                if self.winner == u256(0):
                    self._execute_refunds()
                    return f"RESOLVED: DRAW ({self.score}). ALL BETS REFUNDED."
                else:
                    self._execute_payouts()
                    return f"RESOLVED: TEAM {win_id} WON ({self.score}). PAYOUTS PROCESSED."
            else:
                return "ERROR: INVALID_AI_RESPONSE"
        except:
            return "ERROR: CONSENSUS_OR_PARSING_FAILED"

    def _execute_payouts(self):
        """Calculates and sends rewards to winners (Pari-mutuel style)"""
        winning_pool = self.pool_team1 if self.winner == u256(1) else self.pool_team2
        
        if winning_pool > 0:
            for addr in self.bets.keys():
                bet = self.bets[addr]
                if bet.team == self.winner:
                    # Formula: (UserBet * TotalPool) / WinningPool
                    reward = (bet.amount * self.total_pool) // winning_pool
                    gl.chain.Account(addr).emit_transfer(reward)

    def _execute_refunds(self):
        """Refunds original stakes to everyone in case of a Draw"""
        for addr in self.bets.keys():
            bet = self.bets[addr]
            gl.chain.Account(addr).emit_transfer(bet.amount)

    @gl.public.view
    def get_market_data(self) -> dict:
        """Returns the current state of the market"""
        return {
            "is_resolved": self.has_resolved,
            "winner_id": int(self.winner),
            "final_score": self.score,
            "total_pool": str(self.total_pool),
            "team1_pool": str(self.pool_team1),
            "team2_pool": str(self.pool_team2)
        }

    @gl.public.view
    def check_my_bet(self, user_addr: Address) -> dict:
        """Helper to check a specific user's bet"""
        if user_addr in self.bets:
            bet = self.bets[user_addr]
            return {"team": int(bet.team), "amount": str(bet.amount)}
        return {"error": "NO_BET_FOUND"}

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
    winner: u256
    score: str
    total_pool: u256
    bets: TreeMap[Address, BetInfo]
    pool_team1: u256
    pool_team2: u256

    def __init__(self, game_date: str, team1: str, team2: str):
        self.has_resolved = False
        # Ensures avoiding Persian characters in code structures
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
        assert not self.has_resolved, "Market is already closed"
        
        min_bet = u256(10 * 10**18)
        amount = gl.message.value
        assert amount >= min_bet, "Minimum bet is 10 GEN"
        
        team_id = u256(predicted_winner)
        assert team_id in [u256(1), u256(2)], "Choose 1 or 2"
        
        sender = gl.message.sender_address
        self.bets[sender] = BetInfo(team=team_id, amount=amount)
        
        self.total_pool += amount
        if team_id == u256(1):
            self.pool_team1 += amount
        else:
            self.pool_team2 += amount
        
        return "BET_PLACED"

    @gl.public.write
    def resolve_market(self):
        if self.has_resolved:
            return "ALREADY_RESOLVED"

        web_content = gl.nondet.web.render(self.resolution_url, mode="text")
        
        prompt = (f"Analyze this: {web_content[:2500]}. "
                  f"Winner between {self.team1} and {self.team2}? "
                  "Return JSON: {\"winner\": 1/2/0, \"score\": \"X-Y\"}")

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
                else:
                    self._execute_payouts()
                return "RESOLVED_SUCCESSFULLY"
        except:
            return "RESOLUTION_FAILED"

    def _execute_payouts(self):
        winning_pool = self.pool_team1 if self.winner == u256(1) else self.pool_team2
        if winning_pool > 0:
            for addr, bet in self.bets.items():
                if bet.team == self.winner:
                    reward = (bet.amount * self.total_pool) // winning_pool
                    gl.transfer(addr, reward)

    def _execute_refunds(self):
        for addr, bet in self.bets.items():
            gl.transfer(addr, bet.amount)

    @gl.public.view
    def get_market_data(self) -> dict:
        return {
            "is_resolved": self.has_resolved,
            "winner_id": int(self.winner),
            "final_score": self.score,
            "total_pool": str(self.total_pool)
        }
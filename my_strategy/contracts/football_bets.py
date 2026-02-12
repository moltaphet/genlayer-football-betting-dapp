# v0.1.0
# { "Depends": "py-genlayer:latest" }

from genlayer import *
import json
import typing
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
        self.resolution_url = "https://www.bbc.com/sport/football/scores-fixtures/" + game_date
        self.team1 = team1
        self.team2 = team2
        self.winner = u256(0)
        self.score = ""
        self.total_pool = u256(0)
        self.pool_team1 = u256(0)
        self.pool_team2 = u256(0)

    @gl.public.write
    def place_bet(self, predicted_winner: int):
        assert not self.has_resolved, "Game already resolved"
        team_id = u256(predicted_winner)
        assert team_id == u256(1) or team_id == u256(2), "Invalid team: Choose 1 or 2"
        
        amount = gl.message.value
        assert amount > 0, "Must send some value to bet"
        
        sender = gl.message.sender_address
        self.bets[sender] = BetInfo(team=team_id, amount=amount)
        
        self.total_pool += amount
        if team_id == u256(1):
            self.pool_team1 += amount
        else:
            self.pool_team2 += amount

    @gl.public.write
    def resolve(self) -> typing.Any:
        if self.has_resolved:
            return "Already resolved"

        url = self.resolution_url
        t1, t2 = self.team1, self.team2

        def get_match_result() -> typing.Any:
            web_data = gl.nondet.web.render(url, mode="text")
            task = f"Find the winner between {t1} and {t2} in this page: {web_data}. Respond ONLY JSON: {{\"score\": \"str\", \"winner\": int}}"
            result = gl.nondet.exec_prompt(task).replace("```json", "").replace("```", "")
            return json.loads(result)

        result_json = gl.eq_principle.strict_eq(get_match_result)

        if result_json["winner"] > -1:
            self.has_resolved = True
            self.winner = u256(result_json["winner"])
            self.score = result_json["score"]
          
            self._distribute_prizes()
            
        return result_json

    def _distribute_prizes(self):
        """
        Calculates and transfers the rewards to the winners.
        """
        winning_team = self.winner
      
        winning_pool = self.pool_team1 if winning_team == u256(1) else self.pool_team2
        
        if winning_pool > u256(0):
            for addr, info in self.bets.items():
                if info.team == winning_team:
                  
                    reward = (info.amount * self.total_pool) // winning_pool
                    gl.transfer(addr, reward)

    @gl.public.view
    def get_market_status(self) -> dict:
        return {
            "winner": int(self.winner),
            "score": self.score,
            "total_pool": str(self.total_pool),
            "has_resolved": self.has_resolved,
            "pool_t1": str(self.pool_team1),
            "pool_t2": str(self.pool_team2)
        }
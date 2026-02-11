# v0.1.0
# { "Depends": "py-genlayer:latest" }

from genlayer import *
import json
import typing

class PredictionMarket(gl.Contract):
    # Contract state variables
    has_resolved: bool
    team1: str
    team2: str
    resolution_url: str
    winner: u256
    score: str
    total_pool: u256
    # Store bets: {address: {'amount': int, 'selection': int}}
    bets: dict[address, dict[str, u256]]

    def __init__(self, game_date: str, team1: str, team2: str):
        self.has_resolved = False
        self.resolution_url = (
            "https://www.bbc.com/sport/football/scores-fixtures/" + game_date
        )
        self.team1 = team1
        self.team2 = team2
        self.winner = u256(0)
        self.score = ""
        self.total_pool = u256(0)
        self.bets = {}

    @gl.public.write
    def place_bet(self, selection: u256):
        """
        Users call this method to place a bet.
        selection: 1 (Team1), 2 (Team2), 0 (Draw)
        """
        amount = gl.message.value
        sender = gl.message.sender

        if amount <= 0:
            return "Error: You must send some tokens to bet!"
        if self.has_resolved:
            return "Error: Market already closed"

        self.bets[sender] = {"amount": amount, "selection": selection}
        self.total_pool += amount
        return f"Success: Bet of {amount} placed on selection {selection}"

    @gl.public.write
    def resolve(self) -> typing.Any:
        if self.has_resolved:
            return "Status: Already resolved"

        market_resolution_url = self.resolution_url
        team1 = self.team1
        team2 = self.team2

        def get_match_result() -> typing.Any:
            # AI node fetches the webpage data
            web_data = gl.nondet.web.render(market_resolution_url, mode="text")
            task = f"""
            In the following web page, find the winning team in a matchup between:
            Team 1: {team1}
            Team 2: {team2}
            Web page content: {web_data}
            Respond ONLY with this JSON:
            {{
                "score": str,
                "winner": int // 0 for draw, 1 for team1, 2 for team2, -1 if not finished
            }}
            """
            result = gl.nondet.exec_prompt(task).replace("```json", "").replace("```", "")
            return json.loads(result)

        # Consensus via Mistral validator
        result_json = gl.eq_principle.strict_eq(get_match_result)

        if result_json["winner"] > -1:
            self.has_resolved = True
            self.winner = u256(result_json["winner"])
            self.score = result_json["score"]
            # Trigger automatic reward distribution
            self._distribute_prizes()

        return result_json

    def _distribute_prizes(self):
        """Internal method to split the pool among winners"""
        winners_total_bet = u256(0)
        winning_selection = self.winner

        # Calculate total amount of winning bets
        for addr in self.bets:
            if self.bets[addr]["selection"] == winning_selection:
                winners_total_bet += self.bets[addr]["amount"]

        # Transfer rewards to winners
        if winners_total_bet > 0:
            for addr in self.bets:
                if self.bets[addr]["selection"] == winning_selection:
                    # Individual Share = (User Bet / Total Winning Bets) * Total Pool
                    share = (self.bets[addr]["amount"] * self.total_pool) // winners_total_bet
                    gl.transfer(addr, share)

    @gl.public.view
    def get_market_data(self) -> dict:
        return {
            "winner": self.winner,
            "score": self.score,
            "total_pool": self.total_pool,
            "has_resolved": self.has_resolved
        }
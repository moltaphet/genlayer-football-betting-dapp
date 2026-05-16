# { "Depends": "py-genlayer:test" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class Bet:
    id: str
    has_resolved: bool
    game_date: str
    resolution_url: str
    team1: str
    team2: str
    predicted_winner: str
    real_winner: str
    real_score: str


class FootballBets(gl.Contract):
    bets: TreeMap[Address, TreeMap[str, Bet]]
    points: TreeMap[Address, u256]

    def __init__(self):
        pass

    def _check_match(self, resolution_url: str, team1: str, team2: str) -> dict:
        def get_match_result() -> str:
            web_data = gl.get_webpage(resolution_url, mode="text")
            task = f"""
Extract the match result for:
Team 1: {team1}
Team 2: {team2}

Web content:
{web_data}

Respond in JSON:
{{
    "score": str,
    "winner": int
}}
Rules:
- "score" should be e.g. "1:2", or "-" if the match has not finished.
- "winner" should be 1 if Team 1 won, 2 if Team 2 won, 0 for draw,
  or -1 if the match has not finished yet.
Respond ONLY with the JSON object. No extra text, no markdown fences.
"""
            result = gl.exec_prompt(task).replace("```json", "").replace("```", "").strip()
            return json.dumps(json.loads(result), sort_keys=True)

        return json.loads(gl.eq_principle_strict_eq(get_match_result))

    @gl.public.write
    def create_bet(
        self, game_date: str, team1: str, team2: str, predicted_winner: str
    ) -> None:
        resolution_url = (
            "https://www.bbc.com/sport/football/scores-fixtures/" + game_date
        )
        sender = gl.message.sender_address
        bet_id = f"{game_date}_{team1}_{team2}".lower()

        if sender in self.bets and bet_id in self.bets[sender]:
            raise gl.vm.UserError("Bet already exists for this match")

        bet = Bet(
            id=bet_id,
            has_resolved=False,
            game_date=game_date,
            resolution_url=resolution_url,
            team1=team1,
            team2=team2,
            predicted_winner=predicted_winner,
            real_winner="",
            real_score="",
        )
        self.bets.get_or_insert_default(sender)[bet_id] = bet

    @gl.public.write
    def resolve_bet(self, bet_id: str) -> None:
        sender = gl.message.sender_address

        if sender not in self.bets or bet_id not in self.bets[sender]:
            raise gl.vm.UserError("Bet not found")

        if self.bets[sender][bet_id].has_resolved:
            raise gl.vm.UserError("Bet already resolved")

        bet = self.bets[sender][bet_id]
        match_result = self._check_match(bet.resolution_url, bet.team1, bet.team2)

        if int(match_result["winner"]) < 0:
            raise gl.vm.UserError("Match has not finished yet")

        bet.has_resolved = True
        bet.real_winner = str(match_result["winner"])
        bet.real_score = match_result["score"]

        if bet.real_winner == bet.predicted_winner:
            if sender not in self.points:
                self.points[sender] = u256(0)
            self.points[sender] += u256(1)

    @gl.public.view
    def get_bets(self) -> dict:
        return {k.as_hex: v for k, v in self.bets.items()}

    @gl.public.view
    def get_points(self) -> dict:
        return {k.as_hex: v for k, v in self.points.items()}

    @gl.public.view
    def get_player_points(self, player_address: str) -> int:
        return self.points.get(Address(player_address), u256(0))

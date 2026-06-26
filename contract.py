# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from dataclasses import dataclass
from genlayer import *

# Error classification prefix for deterministic business-logic failures.
# Validators compare these by exact match to reach consensus on the failure path.
ERROR_EXPECTED = "[EXPECTED]"


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
    bets: TreeMap[str, Bet]
    points: TreeMap[Address, u256]

    def __init__(self):
        pass

    def _bet_key(self, address: Address, bet_id: str) -> str:
        return address.as_hex + ":" + bet_id

    def _check_match(self, resolution_url: str, team1: str, team2: str) -> dict:
        def leader_fn() -> dict:
            web_data = gl.nondet.web.render(resolution_url, mode="text")
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
            result = gl.nondet.exec_prompt(task, response_format="json")
            return {"score": str(result["score"]), "winner": int(result["winner"])}

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False

            validator_result = leader_fn()
            leader_winner = int(leaders_res.calldata["winner"])
            validator_winner = validator_result["winner"]

            # Gate check: leader and validator must agree on whether the match
            # has finished (winner == -1 means unfinished).
            if (leader_winner < 0) != (validator_winner < 0):
                return False

            # If both consider the match unfinished, that is agreement.
            if leader_winner < 0 and validator_winner < 0:
                return True

            # Otherwise the derived winner (draw/team1/team2) must match exactly.
            return leader_winner == validator_winner

        return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

    @gl.public.write
    def create_bet(
        self, game_date: str, team1: str, team2: str, predicted_winner: str
    ) -> None:
        resolution_url = (
            "https://www.bbc.com/sport/football/scores-fixtures/" + game_date
        )
        sender = gl.message.sender_address
        bet_id = f"{game_date}_{team1}_{team2}".lower()
        key = self._bet_key(sender, bet_id)

        if key in self.bets:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Bet already exists for this match")

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
        self.bets[key] = bet

    @gl.public.write
    def resolve_bet(self, bet_id: str) -> None:
        sender = gl.message.sender_address
        key = self._bet_key(sender, bet_id)

        if key not in self.bets:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Bet not found")

        if self.bets[key].has_resolved:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Bet already resolved")

        bet = self.bets[key]
        match_result = self._check_match(bet.resolution_url, bet.team1, bet.team2)

        if int(match_result["winner"]) < 0:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Match has not finished yet")

        bet.has_resolved = True
        bet.real_winner = str(match_result["winner"])
        bet.real_score = match_result["score"]

        if bet.real_winner == bet.predicted_winner:
            if sender not in self.points:
                self.points[sender] = u256(0)
            self.points[sender] += u256(1)

    @gl.public.view
    def get_bets(self) -> dict:
        sender = gl.message.sender_address
        prefix = sender.as_hex + ":"
        return {
            k[len(prefix):]: v
            for k, v in self.bets.items()
            if k.startswith(prefix)
        }

    @gl.public.view
    def get_points(self) -> dict:
        return {k.as_hex: v for k, v in self.points.items()}

    @gl.public.view
    def get_player_points(self, player_address: str) -> int:
        return self.points.get(Address(player_address), u256(0))

# v0.1.0
# { "Depends": "py-genlayer:latest" }

from genlayer import *
import json
import typing

class PredictionMarket(gl.Contract):
    has_resolved: bool
    team1: str
    team2: str
    resolution_url: str
    winner: u256
    score: str

    def __init__(self, game_date: str, team1: str, team2: str):
        self.has_resolved = False
        self.resolution_url = (
            "https://www.bbc.com/sport/football/scores-fixtures/" + game_date
        )
        self.team1 = team1
        self.team2 = team2
        self.winner = u256(0)
        self.score = ""

    @gl.public.write
    def resolve(self) -> typing.Any:
        if self.has_resolved:
            return "Already resolved"

        market_resolution_url = self.resolution_url
        team1 = self.team1
        team2 = self.team2

        def get_match_result() -> typing.Any:
            # The AI node uses this to fetch the actual webpage data
            web_data = gl.nondet.web.render(market_resolution_url, mode="text")
            
            task = f"""
            In the following web page, find the winning team in a matchup between:
            Team 1: {team1}
            Team 2: {team2}

            Web page content:
            {web_data}

            Respond ONLY with this JSON:
            {{
                "score": str, // e.g, "1:2" or "-"
                "winner": int // 0 for draw, 1 for team1, 2 for team2, -1 if not finished
            }}
            """
            result = (
                gl.nondet.exec_prompt(task).replace("```json", "").replace("```", "")
            )
            return json.loads(result)

        # Consensus happens here using your active Mistral validator
        result_json = gl.eq_principle.strict_eq(get_match_result)

        if result_json["winner"] > -1:
            self.has_resolved = True
            self.winner = u256(result_json["winner"])
            self.score = result_json["score"]

        return result_json

    @gl.public.view
    def get_resolution_data(self) -> dict[str, typing.Any]:
        return {
            "winner": self.winner,
            "score": self.score,
            "has_resolved": self.has_resolved,
        }
"""Integration tests for the FootballBets contract.

These run against a real GenLayer network (studionet by default — gasless, no
funding required). Deploy happens once per module; the bet-keying uses the
sender address, so all tests share the same default account.

Run:  gltest tests/integration/ -v -s
Fast: gltest tests/integration/ -v -s -m "not slow"
"""

import pytest
from gltest import get_contract_factory
from gltest.assertions import tx_execution_failed, tx_execution_succeeded

# Far-future date: the BBC fixtures page for this day has no finished result,
# so the LLM resolves winner == -1 ("not finished"). Deterministic failure path.
FUTURE_DATE = "2035-08-16"
TEAM1 = "Arsenal"
TEAM2 = "Chelsea"


def _bet_id(game_date: str, team1: str, team2: str) -> str:
    # Mirrors FootballBets._bet_key id derivation in contract.py.
    return f"{game_date}_{team1}_{team2}".lower()


@pytest.fixture(scope="module")
def contract():
    factory = get_contract_factory(contract_file_path="contract.py")
    return factory.deploy(args=[])


def test_create_bet_succeeds(contract):
    receipt = contract.create_bet(
        args=[FUTURE_DATE, TEAM1, TEAM2, "1"]
    ).transact()
    assert tx_execution_succeeded(receipt)


def test_get_bets_returns_created_bet(contract):
    bets = contract.get_bets(args=[]).call()
    bet_id = _bet_id(FUTURE_DATE, TEAM1, TEAM2)
    assert bet_id in bets, f"expected {bet_id} in {list(bets.keys())}"

    bet = bets[bet_id]
    assert bet["team1"] == TEAM1
    assert bet["team2"] == TEAM2
    assert bet["predicted_winner"] == "1"
    assert bet["has_resolved"] is False


def test_duplicate_bet_fails(contract):
    # Same sender + same match key already exists -> [EXPECTED] error.
    receipt = contract.create_bet(
        args=[FUTURE_DATE, TEAM1, TEAM2, "2"]
    ).transact()
    assert tx_execution_failed(receipt)


def test_points_start_empty(contract):
    points = contract.get_points(args=[]).call()
    assert points == {} or all(v == 0 for v in points.values())


def test_get_player_points_unknown_is_zero(contract):
    zero_addr = "0x" + "0" * 40
    assert contract.get_player_points(args=[zero_addr]).call() == 0


@pytest.mark.slow
def test_resolve_unfinished_match_fails(contract):
    """Real web + LLM call: a future match is unfinished, so resolve must fail."""
    bet_id = _bet_id(FUTURE_DATE, TEAM1, TEAM2)
    receipt = contract.resolve_bet(args=[bet_id]).transact()
    assert tx_execution_failed(receipt)

# { "Depends": "py-genlayer:test" }

from dataclasses import dataclass
from datetime import datetime
import json
from genlayer import *

@allow_storage
@dataclass
class BridgeMessageData:
    player_address: str
    receipt: str

@allow_storage
@dataclass
class BridgeMessage:
    target_chain: str
    target_contract: str
    data: BridgeMessageData
    timestamp: u64
    status: str
    result: str
    valid: bool

class UnstoppableBridge(gl.Contract):
    messages: TreeMap[str, BridgeMessage]
    api_url: str

    def __init__(self, api_url: str):
        self.api_url = api_url.strip()
        self.messages = TreeMap[str, BridgeMessage]()

    def _build_message(self, player_address: str, receipt: str, base_contract_address: str, result_data: str, timestamp: int) -> BridgeMessage:
        return BridgeMessage(
            target_chain="base",
            target_contract=base_contract_address,
            data=BridgeMessageData(
                player_address=player_address,
                receipt=receipt,
            ),
            timestamp=u64(timestamp),
            status="completed",
            result=result_data,
            valid=True,
        )

    def _message_to_json(self, msg: BridgeMessage) -> str:
        return json.dumps({
            "target_chain": msg.target_chain,
            "target_contract": msg.target_contract,
            "player_address": msg.data.player_address,
            "receipt": msg.data.receipt,
            "timestamp": int(msg.timestamp),
            "status": msg.status,
            "result": msg.result,
            "valid": msg.valid,
        }, separators=(",", ":"), sort_keys=True)

    @gl.public.view
    def check_valid_payment(self, player_address: str, receipt: str, base_contract_address: str) -> str:
        """Check if a player has paid for their message in Base via an RPC call."""
        print(f"check_valid_payment api_url: {self.api_url}")
        print(f"check_valid_payment base_contract_address: {base_contract_address}")
        print(f"check_valid_payment player_address: {player_address}")
        print(f"check_valid_payment receipt: {receipt}")

        url = (
            f"{self.api_url}/bridge/payment/validate"
            f"?baseContractAddress={base_contract_address}"
            f"&receipt={receipt}"
            f"&playerAddress={player_address}"
        )
        print(f"check_valid_payment url: {url}")

        # Both the web call and datetime.now() are captured inside strict_eq
        # so all validators agree on the response body AND the timestamp.
        with gl.eq_principle.strict_eq() as eq:
            response = gl.nondet.web.get(url)
            eq.set(json.dumps({
                "body": response.text,
                "timestamp": int(datetime.now().timestamp()),
            }))

        data = json.loads(eq.get())
        body_json = json.loads(data["body"])
        timestamp = data["timestamp"]
        print(f"check_valid_payment response: {body_json}")

        if body_json["data"]["valid"] is not True:
            raise gl.vm.UserError(
                f"Payment for {receipt} not found: {body_json['data']['error']}"
            )

        msg = self._build_message(player_address, receipt, base_contract_address, json.dumps(body_json["data"]), timestamp)
        return self._message_to_json(msg)

    @gl.public.write
    def verify_payment(self, player_address: str, receipt: str, base_contract_address: str) -> str:
        """Verify payment and persist a BridgeMessage to contract storage."""
        print(f"verify_payment api_url: {self.api_url}")
        print(f"verify_payment base_contract_address: {base_contract_address}")
        print(f"verify_payment player_address: {player_address}")
        print(f"verify_payment receipt: {receipt}")

        if str(receipt) in self.messages:
            return json.dumps(
                {"status": "success", "detail": receipt},
                separators=(",", ":"),
                sort_keys=True,
            )

        try:
            result_json = self.check_valid_payment(player_address, receipt, base_contract_address)
            result_data = json.loads(result_json)
            timestamp = result_data.get("timestamp", int(datetime.now().timestamp()))
            msg = self._build_message(player_address, receipt, base_contract_address, result_data.get("result", "{}"), timestamp)
            self.messages[str(receipt)] = msg
            return json.dumps(
                {"status": "success", "detail": receipt},
                separators=(",", ":"),
                sort_keys=True,
            )
        except Exception as e:
            return json.dumps(
                {"status": "error", "detail": str(e)},
                separators=(",", ":"),
                sort_keys=True,
            )

    @gl.public.view
    def get_message(self, receipt: str) -> str:
        """Get details of a specific stored bridge message as JSON."""
        print(f"get_message receipt: {receipt}")

        if str(receipt) not in self.messages:
            raise gl.vm.UserError(f"Message {receipt} not found")

        return self._message_to_json(self.messages[str(receipt)])

    @gl.public.view
    def get_deal(self, receipt: str) -> str:
        """Alias for get_message to match frontend call conventions."""
        return self.get_message(receipt)

    @gl.public.write
    def approve_manually(self, player_address: str, receipt: str, base_contract_address: str) -> str:
        """Manually approve a bridge message without a web validation call."""
        print(f"approve_manually player_address: {player_address}")
        print(f"approve_manually receipt: {receipt}")
        print(f"approve_manually base_contract_address: {base_contract_address}")

        if str(receipt) in self.messages:
            return json.dumps(
                {"status": "success", "detail": receipt},
                separators=(",", ":"),
                sort_keys=True,
            )

        # datetime.now() is non-deterministic; capture it inside strict_eq
        # so all validators record the identical timestamp.
        with gl.eq_principle.strict_eq() as eq:
            eq.set(str(int(datetime.now().timestamp())))

        timestamp = int(eq.get())

        self.messages[str(receipt)] = self._build_message(
            player_address, receipt, base_contract_address, json.dumps({"manual": True}), timestamp
        )
        return json.dumps(
            {"status": "success", "detail": receipt},
            separators=(",", ":"),
            sort_keys=True,
        )

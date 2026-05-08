# { "Depends": "py-genlayer:test" }

from dataclasses import dataclass
from datetime import datetime
import json
from genlayer import *

@allow_storage
@dataclass
class BridgeMessageData:
    """Data class for storing bridge message data"""
    player_address: str
    receipt: str

@allow_storage
@dataclass
class BridgeMessage:
    """Data class for storing bridge message data"""
    target_chain: str  # "base"
    target_contract: str  # Address of the UnstoppableGame contract in Base
    data: BridgeMessageData  # Additional data needed for the action
    timestamp: u256
    status: str  # "pending", "completed", "failed"
    result: str  # Result of the action if completed
    valid: bool  # Whether the message is valid

class UnstoppableBridge(gl.Contract):
    messages: TreeMap[str, BridgeMessage]  # receipt -> message details
    api_url: str  # URL for Base RPC endpoint

    def __init__(self, api_url: str):
        self.api_url = api_url.strip()

    @gl.public.view
    def check_valid_payment(self, player_address: str, receipt: str, base_contract_address: str) -> dict:
        """
        Check if a player has paid for their message in Base.
        This will make an RPC call to Base to check the payment status.
        """

        print(f"check_valid_payment api_url: {self.api_url}")
        print(f"check_valid_payment base_contract_address: {base_contract_address}")
        print(f"check_valid_payment player_address: {player_address}")
        print(f"check_valid_payment receipt: {receipt}")

        # playerAddress=asdasd&receipt=asdasda&baseContractAddress=asdasdasd
        url = f"{self.api_url}/bridge/payment/validate?baseContractAddress={base_contract_address}&receipt={receipt}&playerAddress={player_address}"
        print(f"check_valid_payment url: {url}")

        # Make the RPC call to Backend using gl.get_webpage
        def fetch_payment_status() -> str:
            response = gl.nondet.web.get(url)
            return response.body

        # Use equivalence principle to ensure all nodes get the same response
        response = gl.eq_principle.strict_eq(fetch_payment_status)
        print(f"response: {response}")
        body_decoded = response.decode()
        print(f"check_valid_payment response: {body_decoded}")

        body_json = json.loads(response)
        if body_json["data"]["valid"] != True:
            # Store the message
            raise gl.vm.UserError(f"Payment for {receipt} not found: {body_json['data']['error']}")

        return BridgeMessage(
            target_chain="base",
            target_contract=base_contract_address,
            data=BridgeMessageData(
                player_address=player_address,
                receipt=receipt
            ),
            timestamp=u256(int(datetime.now().timestamp())),
            status="completed",
            result=json.dumps(body_json["data"]),
            valid=True
        )

    @gl.public.write
    def verify_payment(self, player_address: str, receipt: str, base_contract_address: str) -> str:
        """
        Verify if a player has paid for their message in Base.
        This will make an RPC call to Base to check the payment status.
        """
        print(f"verify_payment api_url: {self.api_url}")
        print(f"verify_payment base_contract_address: {base_contract_address}")
        print(f"verify_payment player_address: {player_address}")
        print(f"verify_payment receipt: {receipt}")

        if receipt in self.messages:
            response_payload = {"status": "success", "detail": receipt}
            return json.dumps(response_payload, separators=(',', ':'), sort_keys=True)

        response_payload = None
        try:
            message = self.check_valid_payment(player_address, receipt, base_contract_address)
            self.messages[receipt] = message
            response_payload = {"status": "success", "detail": receipt}
        except Exception as e:
            response_payload = {"status": "error", "detail": str(e)}

        return json.dumps(response_payload, separators=(',', ':'), sort_keys=True)

    @gl.public.view
    def get_message(self, receipt: str) -> dict:
        print(f"get_message receipt: {receipt}")
        print(f"self.messages: {self.messages}")

        """Get details of a specific message"""
        if receipt not in self.messages:
            raise gl.vm.UserError(f"Message {receipt} not found")

        return self.messages[receipt]
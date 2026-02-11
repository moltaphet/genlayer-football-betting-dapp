from genlayer import IntelligentContract

class AlphaManager(IntelligentContract):
    def __init__(self, initial_risk: str):
        self.risk_profile = initial_risk
        self.is_active = True

    @view
    def get_status(self) -> str:
        return f"System active - Risk: {self.risk_profile}"

    def run_analysis(self, news: str):
        prompt = f"Risk: {self.risk_profile}. Analyze: {news}. Action?"
        return self.ai.prompt(prompt)
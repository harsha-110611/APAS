# analyzer/assistant.py
# NOTE: AI assistant infrastructure (logic only). No free-form chat.

class ProjectAssistant:
    def __init__(self, analysis_report: dict):
        self.report = analysis_report

    def answer(self, question: str) -> str:
        question = question.lower()

        # Guardrails
        if "weather" in question or "joke" in question:
            return "I can only answer questions about the analyzed project."

        if "score" in question:
            return self._answer_score()

        if "weakness" in question or "problem" in question:
            return self._answer_weaknesses()

        if "improve" in question or "fix" in question:
            return self._answer_recommendations()

        return "Please ask about project score, weaknesses, or improvements."

    def _answer_score(self) -> str:
        return (
            f"Final score is {self.report['final_score']} "
            f"with verdict '{self.report['verdict']}' "
            f"and risk level '{self.report['risk_level']}'."
        )

    def _answer_weaknesses(self) -> str:
        if not self.report["weaknesses"]:
            return "No major weaknesses detected."
        return "Key weaknesses: " + ", ".join(self.report["weaknesses"])

    def _answer_recommendations(self) -> str:
        recs = self.report.get("recommendations", [])
        if not recs:
            return "No recommendations available."
        return "Top recommendations:\n" + "\n".join(
            f"- [{r['severity']}] {r['issue']}: {r['action']}"
            for r in recs
        )

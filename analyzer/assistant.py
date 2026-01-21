# analyzer/assistant.py
# NOTE: AI assistant infrastructure with reviewer mode (Days 15–16)

class ProjectAssistant:
    def __init__(self, analysis_report: dict):
        self.report = analysis_report

    def answer(self, question: str) -> str:
        q = question.lower()

        if "documentation" in q:
            return self._doc_review()

        if "quality" in q:
            return self._quality_review()

        if "complexity" in q:
            return self._complexity_review()

        if "structure" in q:
            return self._structure_review()

        if "score" in q:
            return self._answer_score()

        return "Ask about structure, quality, complexity, documentation, or score."

    def _answer_score(self) -> str:
        return (
            f"Final score is {self.report['final_score']} "
            f"with verdict '{self.report['verdict']}' "
            f"and risk level '{self.report['risk_level']}'."
        )

    def _doc_review(self) -> str:
        score = self.report["component_scores"]["documentation"]
        if score >= 70:
            return "Documentation is solid. Maintain README quality and keep tests updated."
        return "Documentation is weak. Add a README, explain setup/usage, and introduce basic tests."

    def _quality_review(self) -> str:
        return "Code quality issues detected. Refactor long functions, improve naming, and add comments."

    def _complexity_review(self) -> str:
        return "Code complexity is under control. Avoid deep nesting to keep it readable."

    def _structure_review(self) -> str:
        return "Project structure is clean and modular. Maintain separation of concerns."
   
    def explain_file(self, file_path: str) -> str:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                code = f.read()
        except Exception:
            return "Unable to read the specified file."

        lines = code.splitlines()
        line_count = len(lines)

        if line_count > 100:
            return (
                f"This file has {line_count} lines, which is large. "
                "Large files reduce readability and should be split into smaller modules."
            )

        if line_count > 50 and "def " in code:
            return (
                "This file likely contains long functions. "
                "Long functions make code harder to maintain and should be refactored."
            )

        return "No major structural issues detected in this file."

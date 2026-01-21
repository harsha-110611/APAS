# analyzer/scoring.py

# NOTE: Metrics frozen after Day 14. Do not modify without version bump.
WEIGHTS = {
    "structure": 0.25,
    "quality": 0.30,
    "complexity": 0.25,
    "documentation": 0.20,
}
SCORE_CATEGORIES = [
    (90, "Excellent", "Low Risk"),
    (75, "Good", "Medium Risk"),
    (60, "Needs Improvement", "High Risk"),
    (0,  "Poor", "Critical Risk"),
]

def compute_final_score(structure, quality, complexity, documentation) -> dict:
    scores = {
        "structure": structure.get("structure_score", 0),
        "quality": quality.get("quality_score", 0),
        "complexity": complexity.get("complexity_score", 0),
        "documentation": documentation.get("documentation_score", 0),
    }

    final_score = sum(scores[k] * WEIGHTS[k] for k in scores)
    final_score = round(final_score, 2)

    weaknesses = []

    if scores["structure"] < 70:
        weaknesses.append("Poor project structure")
    if scores["quality"] < 70:
        weaknesses.append("Code quality issues")
    if scores["complexity"] < 70:
        weaknesses.append("High code complexity")
    if scores["documentation"] < 70:
        weaknesses.append("Documentation/testing gaps")
    category = categorize_score(final_score)
    return {
        "final_score": final_score,
        "component_scores": scores,
        "weaknesses": weaknesses,
        "verdict": category["label"],
        "risk_level": category["risk_level"],
    }
def categorize_score(final_score: float) -> dict:
    for threshold, label, risk in SCORE_CATEGORIES:
        if final_score >= threshold:
            return {
                "label": label,
                "risk_level": risk
            }

    # fallback (should never hit)
    return {
        "label": "Unknown",
        "risk_level": "Unknown"
    }

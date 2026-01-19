# analyzer/scoring.py

WEIGHTS = {
    "structure": 0.25,
    "quality": 0.30,
    "complexity": 0.25,
    "documentation": 0.20,
}

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

    return {
        "final_score": final_score,
        "component_scores": scores,
        "weaknesses": weaknesses,
    }

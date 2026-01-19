# analyzer/insights.py

def generate_insights(report: dict) -> dict:
    strengths = []
    weaknesses = []
    recommendations = []

    # Structure
    if report["component_scores"]["structure"] >= 85:
        strengths.append("Clean and well-organized project structure")
    else:
        weaknesses.append("Project structure needs improvement")
        recommendations.append({
            "issue": "Structure",
            "severity": "Medium",
            "action": "Reduce folder nesting and split large modules"
        })

    # Quality
    if report["component_scores"]["quality"] >= 80:
        strengths.append("Acceptable code quality standards")
    else:
        weaknesses.append("Code quality issues detected")
        recommendations.append({
            "issue": "Code Quality",
            "severity": "Medium",
            "action": "Refactor long functions and improve comments"
        })

    # Complexity
    if report["component_scores"]["complexity"] >= 80:
        strengths.append("Manageable code complexity")
    else:
        weaknesses.append("High code complexity")
        recommendations.append({
            "issue": "Complexity",
            "severity": "High",
            "action": "Reduce nested logic and simplify conditionals"
        })

    # Documentation
    if report["component_scores"]["documentation"] >= 70:
        strengths.append("Basic documentation present")
    else:
        weaknesses.append("Poor documentation and missing tests")
        recommendations.append({
            "issue": "Documentation & Testing",
            "severity": "Critical",
            "action": "Add README, setup tests, and explain project usage"
        })

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations
    }

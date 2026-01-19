# analyzer/report.py

def format_report(final: dict, insights: dict) -> str:
    lines = []

    lines.append("=== PROJECT ANALYSIS REPORT ===")
    lines.append("")
    lines.append(f"Final Score: {final['final_score']}")
    lines.append(f"Verdict: {final['verdict']} ({final['risk_level']})")
    lines.append("")

    lines.append("Component Scores:")
    for k, v in final["component_scores"].items():
        lines.append(f"  - {k.capitalize()}: {v}")

    lines.append("")
    lines.append("Strengths:")
    for s in insights["strengths"]:
        lines.append(f"  + {s}")

    lines.append("")
    lines.append("Weaknesses:")
    for w in insights["weaknesses"]:
        lines.append(f"  - {w}")

    lines.append("")
    lines.append("Recommendations:")
    for r in insights["recommendations"]:
        lines.append(f"  [{r['severity']}] {r['issue']}: {r['action']}")

    return "\n".join(lines)

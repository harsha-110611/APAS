# main.py
import sys

from analyzer.file_scanner import scan_project
from analyzer.structure import analyze_structure
from analyzer.quality import analyze_quality
from analyzer.complexity import analyze_complexity
from analyzer.documentation import analyze_documentation
from analyzer.scoring import compute_final_score
from analyzer.insights import generate_insights
from analyzer.report import format_report
from analyzer.visualization import generate_score_pie
from analyzer.assistant import ProjectAssistant


WEIGHTS = {
    "structure": 0.25,
    "quality": 0.30,
    "complexity": 0.25,
    "documentation": 0.20,
}


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "."

    project_name = (
        target.replace("/", "_")
        .replace("\\", "_")
        .strip(".")
        or "root_project"
    )

    print("🔍 Analyzing project:", target)
    print("--------------------------------\n")

    # 1. Scan
    scan = scan_project(target)
    print("✔ Scan complete")

    # 2. Structure
    structure = analyze_structure(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("✔ Structure analysis complete")

    # 3. Quality
    quality = analyze_quality(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("✔ Quality analysis complete")

    # 4. Complexity
    complexity = analyze_complexity(
        target,
        scan.get("language_paths", {}).get("python", [])
    )
    print("✔ Complexity analysis complete")

    # 5. Documentation
    docs = analyze_documentation(target)
    print("✔ Documentation analysis complete")
    print(f"📘 Documentation score: {docs['documentation_score']}\n")

    # 6. Final score
    final = compute_final_score(structure, quality, complexity, docs)

    # 7. Insights
    insights = generate_insights(final)

    # 8. AI Assistant — Reviewer Mode (Day 16)
    analysis_report = {
        **final,
        "recommendations": insights["recommendations"]
    }

    assistant = ProjectAssistant(analysis_report)

    print("🤖 Assistant (Reviewer Mode):")
    print(assistant.answer("What is the project score?"))
    print(assistant.answer("Explain documentation issues"))
    print(assistant.answer("Explain code quality"))
    print(assistant.answer("Explain complexity"))
    print(assistant.answer("Explain structure"))
    print()

    # 9. Human-readable report
    report_text = format_report(final, insights)

    # 10. Weighted scores for visualization
    weighted_scores = {
        k: final["component_scores"][k] * w
        for k, w in WEIGHTS.items()
    }

    # 11. Generate project-specific chart
    chart_path = generate_score_pie(
        weighted_scores,
        output_path=f"reports/score_{project_name}.png"
    )

    # 12. Final output
    print("📊 Analysis Complete")
    print("--------------------------------")
    print(report_text)
    print("Chart saved at:", chart_path)


if __name__ == "__main__":
    main()

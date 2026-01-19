# analyzer/visualization.py
import matplotlib.pyplot as plt

def generate_score_pie(component_scores: dict, output_path="reports/score_breakdown.png"):
    labels = list(component_scores.keys())
    sizes = list(component_scores.values())

    plt.figure(figsize=(6, 6))
    plt.pie(
        sizes,
        labels=labels,
        autopct="%1.1f%%",
        startangle=140
    )
    plt.title("Project Quality Breakdown")
    plt.axis("equal")  # ensures circle

    plt.savefig(output_path, bbox_inches="tight")
    plt.close()

    return output_path

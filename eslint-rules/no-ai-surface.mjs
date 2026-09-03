// FE-SPEC.md §13 cut-scope guard: no AI surface (ADR-013). Flags any
// identifier — a variable, a property key, a type member, a member-access
// like `job.score` — whose name is or contains one of the banned AI-flavored
// terms. Deliberately broad (substring, not exact match): this is a
// trip-wire meant to catch the field showing up under any reasonable name
// (`driverScore`, `job.recommended_driver`, a `RiskLevel` type), not just
// the literal word alone. A real hit should be renamed or removed, not
// suppressed — if a legitimate, unrelated term collides, narrow the list
// here rather than disabling the rule at the call site.

const BANNED_TERMS = ["score", "rank", "confidence", "risklevel", "recommendeddriver", "predictedeta"];

function normalize(name) {
  return name.toLowerCase().replace(/_/g, "");
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow AI-surface identifiers (score/rank/confidence/risk level/recommended driver/predicted ETA) — FE-SPEC.md §13, ADR-013",
    },
    schema: [],
    messages: {
      noAiSurface:
        "No AI surface in this app (FE-SPEC.md §13, ADR-013). \"{{ name }}\" reads as score/rank/confidence/risk-level/recommended-driver/predicted-ETA — rename it or remove the feature.",
    },
  },
  create(context) {
    return {
      Identifier(node) {
        const normalized = normalize(node.name);
        if (BANNED_TERMS.some((term) => normalized.includes(term))) {
          context.report({ node, messageId: "noAiSurface", data: { name: node.name } });
        }
      },
    };
  },
};

export default rule;

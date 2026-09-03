// FE-SPEC.md §13 cut-scope guard: no driver client (ADR-006). Covers the
// geolocation-API half of that row. The other half (no route under a
// driver path) is a filesystem check, not an AST one — see
// src/lib/scope-guards.test.ts.

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow navigator.geolocation — FE-SPEC.md §13, ADR-006 (no driver client in this app)",
    },
    schema: [],
    messages: {
      noGeolocation:
        "No driver client in this app (FE-SPEC.md §13, ADR-006) — don't touch navigator.geolocation.",
    },
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          node.object.name === "navigator" &&
          node.property.type === "Identifier" &&
          node.property.name === "geolocation"
        ) {
          context.report({ node, messageId: "noGeolocation" });
        }
      },
    };
  },
};

export default rule;

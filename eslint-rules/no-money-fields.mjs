// FE-SPEC.md §13 cut-scope guard: no money (this MVP does not handle
// pricing). Flags any identifier — variable, property key, type member —
// naming a price/amount/invoice field. "total" is matched as a whole word
// only, not a substring: a bare `total` is almost always a dollar total in
// this domain, but `totalCount`/`total_pages`/`totalItems` are ordinary
// pagination fields and must not be flagged (see .agents/skills/
// fe-scope-guard.md).

const SUBSTRING_BANNED_TERMS = ["price", "amount", "invoice"];
const EXACT_BANNED_TERMS = ["total"];

function normalize(name) {
  return name.toLowerCase().replace(/_/g, "");
}

function isMoneyField(name) {
  const normalized = normalize(name);
  if (EXACT_BANNED_TERMS.includes(normalized)) return true;
  return SUBSTRING_BANNED_TERMS.some((term) => normalized.includes(term));
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow price/total/amount/invoice fields — FE-SPEC.md §13, no money handling in this MVP",
    },
    schema: [],
    messages: {
      noMoneyField:
        'No money handling in this app (FE-SPEC.md §13). "{{ name }}" reads as a price/total/amount/invoice field — rename it or remove the feature.',
    },
  },
  create(context) {
    return {
      Identifier(node) {
        if (isMoneyField(node.name)) {
          context.report({ node, messageId: "noMoneyField", data: { name: node.name } });
        }
      },
    };
  },
};

export default rule;

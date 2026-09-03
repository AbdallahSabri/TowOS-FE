// FE-SPEC.md §13 cut-scope guard: no realtime (ADR-007, polling only).
// Flags `new WebSocket(...)`, `new EventSource(...)`, and an import of a
// known realtime client library (currently just socket.io-client — extend
// the list if another one shows up).

const REALTIME_CONSTRUCTORS = new Set(["WebSocket", "EventSource"]);
const REALTIME_IMPORT_SOURCES = ["socket.io-client"];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow WebSocket/EventSource/realtime-client usage — FE-SPEC.md §13, ADR-007 (polling only)",
    },
    schema: [],
    messages: {
      noRealtimeConstructor:
        "No realtime in this app (FE-SPEC.md §13, ADR-007) — polling only, via TanStack Query's refetchInterval. Don't instantiate {{ name }} directly.",
      noRealtimeImport:
        'No realtime in this app (FE-SPEC.md §13, ADR-007) — polling only. "{{ source }}" is a realtime client library.',
    },
  },
  create(context) {
    return {
      NewExpression(node) {
        if (node.callee.type === "Identifier" && REALTIME_CONSTRUCTORS.has(node.callee.name)) {
          context.report({
            node,
            messageId: "noRealtimeConstructor",
            data: { name: node.callee.name },
          });
        }
      },
      ImportDeclaration(node) {
        if (REALTIME_IMPORT_SOURCES.includes(node.source.value)) {
          context.report({
            node,
            messageId: "noRealtimeImport",
            data: { source: node.source.value },
          });
        }
      },
    };
  },
};

export default rule;

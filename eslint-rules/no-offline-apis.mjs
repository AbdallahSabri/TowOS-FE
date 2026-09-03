// FE-SPEC.md §13 cut-scope guard: no offline support (§9.2). Covers the
// JS-API half of that row — service worker registration and IndexedDB
// access. The other half (no manifest file in the tree) is a filesystem
// check, not an AST one — see src/lib/scope-guards.test.ts.

const IDB_IMPORT_SOURCES = new Set(["idb", "idb-keyval"]);

function isNavigatorServiceWorker(node) {
  return (
    node.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    node.object.name === "navigator" &&
    node.property.type === "Identifier" &&
    node.property.name === "serviceWorker"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow service worker registration and IndexedDB access — FE-SPEC.md §13, §9.2 (no offline support)",
    },
    schema: [],
    messages: {
      noServiceWorker: "No offline support in this app (FE-SPEC.md §13, §9.2) — don't touch navigator.serviceWorker.",
      noIndexedDb: "No offline support in this app (FE-SPEC.md §13, §9.2) — don't use IndexedDB{{ via }}.",
    },
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (isNavigatorServiceWorker(node)) {
          context.report({ node, messageId: "noServiceWorker" });
        }
      },

      Identifier(node) {
        if (node.name === "indexedDB") {
          context.report({ node, messageId: "noIndexedDb", data: { via: "" } });
        }
      },

      ImportDeclaration(node) {
        if (IDB_IMPORT_SOURCES.has(node.source.value)) {
          context.report({
            node,
            messageId: "noIndexedDb",
            data: { via: ` (via "${node.source.value}")` },
          });
        }
      },
    };
  },
};

export default rule;

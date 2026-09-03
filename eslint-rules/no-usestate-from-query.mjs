// Enforces CLAUDE.md invariant #1 / FE-SPEC.md §13's "query discipline"
// guard: no useState initialized from, or holding, a TanStack Query result.
// Server state lives only in TanStack Query — never mirrored into
// component state.
//
// Catches:
//   useState(useQuery(...).data)
//   const { data } = useQuery(...); useState(data)
//   const result = useQuery(...); useState(result.data)
// Deliberately name-based, not type-based (no TS type info in a plain
// ESLint rule) — matches by tracing local names bound to a
// `@tanstack/react-query` hook import, so it won't false-positive on an
// unrelated function that happens to be named `useState`.

const QUERY_HOOK_PATTERN = /^use(Suspense)?(Infinite)?Quer(y|ies)$/;

const FUNCTION_SELECTOR =
  "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression";

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow useState initialized from a TanStack Query result (CLAUDE.md invariant #1)",
    },
    schema: [],
    messages: {
      noUseStateFromQuery:
        "Server state lives only in TanStack Query (CLAUDE.md invariant #1). Read this value from the query hook directly instead of copying it into useState.",
    },
  },
  create(context) {
    // Local names bound to a TanStack Query hook import (handles aliasing:
    // `import { useQuery as useJobsQuery }`).
    const queryHookLocalNames = new Set();

    // Stack of per-function-scope Sets of variable names known to hold all
    // or part of a query hook's return value.
    const scopeStack = [new Set()];
    const currentScope = () => scopeStack[scopeStack.length - 1];
    const isTrackedName = (name) => scopeStack.some((scope) => scope.has(name));

    const isQueryHookCall = (node) =>
      node?.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      queryHookLocalNames.has(node.callee.name);

    const isUseStateCall = (node) =>
      node.callee.type === "Identifier"
        ? node.callee.name === "useState"
        : node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "useState";

    return {
      ImportDeclaration(node) {
        if (node.source.value !== "@tanstack/react-query") return;
        for (const spec of node.specifiers) {
          if (
            spec.type === "ImportSpecifier" &&
            spec.imported.type === "Identifier" &&
            QUERY_HOOK_PATTERN.test(spec.imported.name)
          ) {
            queryHookLocalNames.add(spec.local.name);
          }
        }
      },

      [FUNCTION_SELECTOR]() {
        scopeStack.push(new Set());
      },
      [`${FUNCTION_SELECTOR}:exit`]() {
        scopeStack.pop();
      },

      VariableDeclarator(node) {
        if (!isQueryHookCall(node.init)) return;

        if (node.id.type === "Identifier") {
          currentScope().add(node.id.name);
        } else if (node.id.type === "ObjectPattern") {
          for (const prop of node.id.properties) {
            if (prop.type === "Property" && prop.value.type === "Identifier") {
              currentScope().add(prop.value.name);
            }
          }
        }
      },

      CallExpression(node) {
        if (!isUseStateCall(node)) return;

        const arg = node.arguments[0];
        if (!arg) return;

        const flaggedByDirectCall = isQueryHookCall(arg);
        const flaggedByCallMember =
          arg.type === "MemberExpression" && isQueryHookCall(arg.object);
        const flaggedByTrackedIdentifier =
          arg.type === "Identifier" && isTrackedName(arg.name);
        const flaggedByTrackedMember =
          arg.type === "MemberExpression" &&
          arg.object.type === "Identifier" &&
          isTrackedName(arg.object.name);

        if (
          flaggedByDirectCall ||
          flaggedByCallMember ||
          flaggedByTrackedIdentifier ||
          flaggedByTrackedMember
        ) {
          context.report({ node, messageId: "noUseStateFromQuery" });
        }
      },
    };
  },
};

export default rule;

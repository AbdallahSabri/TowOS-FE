// Enforces CLAUDE.md invariant #4 / FE-SPEC.md §13's timezone-discipline
// guard: no component calls toLocaleString, toLocaleDateString, or
// Intl.DateTimeFormat directly. lib/tz/ is the one place allowed to —
// every other screen goes through its formatter so every timestamp is
// rendered in the *job's* timezone, never the viewer's.

const BANNED_MEMBER_METHODS = new Set(["toLocaleString", "toLocaleDateString"]);

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow toLocaleString/toLocaleDateString/Intl.DateTimeFormat outside lib/tz/ (CLAUDE.md invariant #4)",
    },
    schema: [],
    messages: {
      noLocaleFormatOutsideTz:
        "No timestamp formatting outside lib/tz/ (CLAUDE.md invariant #4). Use the formatter from lib/tz/format.ts instead of calling {{ api }} directly.",
    },
  },
  create(context) {
    // lib/tz/ itself is exempt — it's the one place that's allowed to call
    // these APIs, since it's what everywhere else calls instead.
    const filename = context.filename ?? context.getFilename();
    if (/[/\\]lib[/\\]tz[/\\]/.test(filename)) {
      return {};
    }

    return {
      CallExpression(node) {
        const { callee } = node;

        // someValue.toLocaleString(...) / someValue.toLocaleDateString(...)
        if (
          callee.type === "MemberExpression" &&
          callee.property.type === "Identifier" &&
          BANNED_MEMBER_METHODS.has(callee.property.name)
        ) {
          context.report({
            node,
            messageId: "noLocaleFormatOutsideTz",
            data: { api: callee.property.name },
          });
          return;
        }

        // new Intl.DateTimeFormat(...) is a NewExpression, not a
        // CallExpression — handled below — but Intl.DateTimeFormat(...)
        // called without `new` is still a CallExpression and still formats
        // a date, so it's covered here too.
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "Intl" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "DateTimeFormat"
        ) {
          context.report({
            node,
            messageId: "noLocaleFormatOutsideTz",
            data: { api: "Intl.DateTimeFormat" },
          });
        }
      },

      NewExpression(node) {
        const { callee } = node;
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "Intl" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "DateTimeFormat"
        ) {
          context.report({
            node,
            messageId: "noLocaleFormatOutsideTz",
            data: { api: "Intl.DateTimeFormat" },
          });
        }
      },
    };
  },
};

export default rule;

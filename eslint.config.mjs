import next from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  ...next,
  {
    name: "local/overrides",
    rules: {
      // Next 16 / react-hooks 7 flags common "reset form when props change" patterns; revisit gradually.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;

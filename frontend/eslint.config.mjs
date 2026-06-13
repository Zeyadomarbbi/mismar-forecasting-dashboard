import nextVitals from "eslint-config-next/core-web-vitals.js";

const config = [
  ...nextVitals,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  }
];

export default config;

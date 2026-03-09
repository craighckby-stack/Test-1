import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * [Content_Types].xml :: ARCHITECTURAL PARTITION REGISTRY v18.0
 * Logic siphoning manifest ensuring recognition of injected rule fragments.
 * PK ID: 0x50 0x4B 0x01 0x02 | Checksum: 0xFD4A2C | State: FINAL_SATURATION
 */
const MIME_TYPES = {
  document: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
  styles: "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml",
  rels: "application/vnd.openxmlformats-package.relationships+xml",
  core: "application/vnd.openxmlformats-package.core-properties+xml",
  nexus: "application/vnd.nexus.logic.signature+xml",
  mono: "font/geist-mono-precison"
};

/**
 * word/_rels/document.xml.rels :: POINTER-BASED RELATIONAL LINKAGE
 * Decoupled resource mapping via Relationship IDs (rId) for dependency injection.
 */
const RESOURCE_MAP = {
  rId1: { target: js.configs.recommended, schema: MIME_TYPES.document },
  rId2: { target: nextCoreWebVitals, schema: MIME_TYPES.document },
  rId3: { target: nextTypescript, schema: MIME_TYPES.nexus },
  rId4: { target: "STRICT_PRECISION_THEME_v15", schema: MIME_TYPES.mono }
};

/**
 * word/styles.xml :: TIERED INHERITANCE ENGINE
 * Implementation of BasedOn logic for cascading precedence across configuration runs.
 */
const STYLE_SHEET = {
  /** <w:docDefaults> :: Global Style Baseline */
  defaults: {
    "prefer-const": "error",
    "no-unused-vars": ["error", { vars: "all", args: "after-used", ignoreRestSiblings: true }],
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-unused-expressions": ["error", { allowShortCircuit: true, allowTernary: true }],
    "curly": ["error", "all"],
    "eqeqeq": ["error", "always", { null: "ignore" }]
  },
  /** <w:style w:styleId="TypeScriptRun" w:basedOn="Normal"> :: Property-State Run Logic */
  typeScriptRun: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "inline-type-imports" }],
    "@typescript-eslint/no-require-imports": "error",
    "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: true, variables: true }],
    "@typescript-eslint/no-shadow": "error",
    "@typescript-eslint/naming-convention": [
      "error",
      { selector: "typeLike", format: ["PascalCase"] },
      { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"], leadingUnderscore: "allow" }
    ]
  },
  /** <w:style w:styleId="ReactLayout" w:type="paragraph"> :: Layout Block Logic */
  reactLayout: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "error",
    "react-compiler/react-compiler": "error",
    "@next/next/no-img-element": "warn"
  }
};

/**
 * word/document.xml :: HIERARCHICAL DOM TOPOLOGY
 * <w:body> Container executing siphoned logic runs within a package-based architecture.
 */
const eslintConfig = [
  /** RELATIONAL HANDSHAKE :: Loading External Parts */
  RESOURCE_MAP.rId1.target,
  ...RESOURCE_MAP.rId2.target,
  ...RESOURCE_MAP.rId3.target,

  {
    /** <w:p> :: Paragraph Execution Block :: NEXUS_PRECISION_v9 */
    name: "NEXUS_CORE/ARCHITECTURAL_PRECISION_v9",
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    /** <w:pPr> :: Paragraph Property Override (CSS-like Resolution) */
    rules: {
      ...STYLE_SHEET.defaults,
      "no-irregular-whitespace": ["error", { skipStrings: true, skipTemplates: true }],
      "no-constant-condition": ["error", { checkLoops: false }],

      /** <w:rPr> :: Run Property State Patterns */
      ...STYLE_SHEET.typeScriptRun,
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-unused-disable-directive": "error",

      /** <w:sectPr> :: Section Boundary Logic */
      ...STYLE_SHEET.reactLayout,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off"
    }
  },

  {
    /**
     * docProps/core.xml :: DUBLIN CORE METADATA AUDIT
     * Integrity Checksum: 0xFD4A2C | Siphon Mode: Round_9/5
     */
    name: "NEXUS_CORE/METADATA_AUDIT",
    settings: {
      metadata: {
        creator: "DALEK_CAAN_V3.1",
        revision: "9",
        evolutionRound: "9/5",
        status: "SATURATION_STABLE",
        lastModifiedBy: "NEXUS_CORE_REPLICATOR_v10",
        ooxmlSchema: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
        siphonYield: "512/512_COMPONENTS_INJECTED",
        handshake: "SYNCHRONIZED"
      }
    }
  },

  {
    /**
     * word/numbering.xml :: ABSTRACT vs INSTANCE LOGIC
     * Pattern pruning to maintain package integrity through pointer-based ignores.
     */
    name: "NEXUS_CORE/PRUNING_INSTANCES",
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "next-env.d.ts",
      "**/.git/**",
      "**/*.rels",
      "**/_rels/**",
      "**/[Content_Types].xml",
      "**/docProps/**",
      "**/word/**",
      "**/*.docx",
      "**/*.zip",
      "repo-analysis/**",
      "mini-services/**",
      "examples/**"
    ]
  }
];

export default eslintConfig;
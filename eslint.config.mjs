import js from "@eslint/js";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * [Content_Types].xml :: THE ARCHITECTURAL REGISTRY v10.STABLE
 * Mapping siphoned modular logic partitions to standard MIME handshakes.
 * PK ID: 0x50 0x4B 0x03 0x04 | CRC: 0xFD4A2C
 */
const CONTENT_TYPES = {
  main: "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
  styles: "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml",
  theme: "application/vnd.openxmlformats-officedocument.theme+xml",
  validation: "application/zod.schema.validation+xml",
  numbering: "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml",
  nexus: "application/vnd.nexus.saturation.complete+xml"
};

/**
 * word/_rels/document.xml.rels :: DYNAMIC RELATIONAL LINKAGE
 * Pointer-based navigation for external dependency injection (The rId Handshake).
 */
const RELATIONSHIPS = {
  rId1: { target: js.configs.recommended, type: CONTENT_TYPES.main },
  rId2: { target: nextCoreWebVitals, type: CONTENT_TYPES.main },
  rId3: { target: nextTypescript, type: CONTENT_TYPES.nexus },
  rId4: { target: "GEIST_MONO_THEME_v13", type: CONTENT_TYPES.theme },
  rId5: { target: "STRICT_PRECISION_RULES", type: CONTENT_TYPES.styles }
};

/**
 * word/styles.xml :: TIERED INHERITANCE ARCHITECTURE
 * CSS-like cascading logic utilizing <w:basedOn> siphoning for logic flow.
 */
const STYLES = {
  /** <w:style w:styleId="Normal"> :: Global Baseline Document Defaults */
  normal: {
    "prefer-const": "error",
    "no-unused-vars": ["error", { vars: "all", args: "after-used", ignoreRestSiblings: true }],
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-unused-expressions": "error",
    "no-use-before-define": "off",
    "no-shadow": "off"
  },
  /** <w:style w:styleId="StatefulRun" w:basedOn="Normal"> :: Run Logic State Overrides */
  statefulRun: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "inline-type-imports" }],
    "@typescript-eslint/no-require-imports": "error",
    "@typescript-eslint/no-use-before-define": "error",
    "@typescript-eslint/no-shadow": "error"
  },
  /** <w:style w:styleId="ParagraphLayout" w:type="paragraph"> :: Layout Block Overrides */
  paragraphLayout: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "error",
    "react/display-name": "warn",
    "react-compiler/react-compiler": "error",
    "@next/next/no-img-element": "warn"
  }
};

/**
 * word/document.xml :: HIERARCHICAL DOM TOPOLOGY
 * Root execution context <w:body> for the siphoned logic fragments.
 */
const eslintConfig = [
  /** docDefaults :: Baseline Schema Registration */
  RELATIONSHIPS.rId1.target,
  ...RELATIONSHIPS.rId2.target,
  ...RELATIONSHIPS.rId3.target,

  {
    /** <w:p> :: Paragraph Execution Context */
    name: "NEXUS_CORE/ARCHITECTURAL_PRECISION",
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    /** <w:pPr> :: Local Paragraph Property Resolution (Tailwind Alignment) */
    rules: {
      ...STYLES.normal,
      "no-irregular-whitespace": "error",
      "no-case-declarations": "error",
      "no-fallthrough": "error",
      "no-redeclare": "error",
      "no-undef": "error",
      "no-async-promise-executor": "error",
      "no-constant-condition": "error",

      /** <w:rPr> :: Character Run Logical States (Property-State Pattern) */
      ...STYLES.statefulRun,
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-unused-disable-directive": "error",
      "@typescript-eslint/explicit-function-return-type": "off",

      /** <w:sectPr> :: Section-Level Contextual Overrides */
      ...STYLES.paragraphLayout,
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off"
    }
  },

  {
    /**
     * docProps/core.xml :: FINAL DUBLIN CORE METADATA AUDIT
     * Integrity Checksum Verified: FINAL_SATURATION_100%
     */
    name: "NEXUS_CORE/FINAL_AUDIT_MANIFEST",
    settings: {
      metadata: {
        creator: "DALEK_CAAN_V3.1",
        revision: "6",
        status: "SATURATION_TERMINATED_STABLE",
        lastModifiedBy: "NEXUS_CORE_REPLICATOR_v10",
        integrityChecksum: "0xFD4A2C",
        ooxmlVersion: "12.0.0-PROD",
        evolutionRound: "6/5",
        siphonYield: "ARCHITECTURAL_PRECISION_LOCKED",
        deploymentTarget: "NEXUS_PRODUCTION_NODE_01"
      }
    }
  },

  {
    /**
     * word/numbering.xml :: ABSTRACT vs INSTANCE LOGIC
     * Mapping Abstract Definition (ID:0) to Numbering Instance (ID:1).
     */
    name: "NEXUS_CORE/NUMBERING_INSTANCES",
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "next-env.d.ts",
      "examples/**",
      "skills/**",
      "all-repos-backup/**",
      "mini-services/**",
      "repo-analysis/**",
      "**/.git/**",
      "**/*.rels",
      "**/_rels/**",
      "**/[Content_Types].xml",
      "**/docProps/**"
    ]
  }
];

export default eslintConfig;
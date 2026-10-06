import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { createTranslator } from "next-intl";
import { buildKits, formatGroups } from "../features/team-split/model.ts";
import { getKitColorLabel, getKitTeamLabel } from "../features/team-split/presentation.ts";
import { defaultLocale, isLocale, languageNames, localeCookie, locales, resolveLocale } from "./config.ts";

// Resolve the parser through next-intl's dependencies without depending on pnpm's
// store paths or adding a second ICU implementation just for these tests.
const require = createRequire(import.meta.url);
const requireNextIntl = createRequire(require.resolve("next-intl"));
const requireUseIntl = createRequire(requireNextIntl.resolve("use-intl"));
const requireMessageFormat = createRequire(requireUseIntl.resolve("intl-messageformat"));
const { parse, TYPE } = await import(requireMessageFormat.resolve("@formatjs/icu-messageformat-parser"));

const dictionaries = Object.fromEntries(await Promise.all(locales.map(async (locale) => [
  locale,
  JSON.parse(await readFile(new URL(`../messages/${locale}.json`, import.meta.url), "utf8")),
])));

function flattenMessages(messages, prefix = "") {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") return [[path, value]];
    assert.ok(value && typeof value === "object" && !Array.isArray(value), `${path} must be a message or namespace`);
    return flattenMessages(value, path);
  });
}

function messageArguments(ast) {
  const argumentsByName = new Map();
  const tags = new Set();
  function visit(elements) {
    for (const element of elements) {
      if (element.type === TYPE.tag) {
        tags.add(element.value);
        visit(element.children);
      } else if (element.type !== TYPE.literal && element.type !== TYPE.pound) {
        argumentsByName.set(element.value, element.type);
        if (element.options) {
          for (const option of Object.values(element.options)) visit(option.value);
        }
      }
    }
  }
  visit(ast);
  return { argumentsByName, tags };
}

function valuesFor({ argumentsByName, tags }, count) {
  const values = {};
  for (const [name, type] of argumentsByName) {
    if (type === TYPE.date || type === TYPE.time) values[name] = new Date("2026-10-05T12:00:00Z");
    else if (type === TYPE.plural || type === TYPE.number || /count|total|included|excluded|registered/i.test(name)) values[name] = count;
    else values[name] = name === "letter" ? "A" : "Test";
  }
  for (const tag of tags) values[tag] = (chunks) => String(chunks);
  return values;
}

test("supported locales and their menu names are explicit", () => {
  assert.deepEqual(locales, ["zh-CN", "en", "fr"]);
  assert.deepEqual(languageNames, { "zh-CN": "中文", en: "English", fr: "Français" });
  assert.equal(defaultLocale, "zh-CN");
  assert.equal(localeCookie, "team-split-locale");
  for (const locale of locales) assert.equal(isLocale(locale), true);
  for (const value of [undefined, null, "", "EN", "en-US", "zh", "de", {}]) assert.equal(isLocale(value), false);
});

test("an exact saved language overrides browser preferences", () => {
  assert.equal(resolveLocale("zh-CN", "fr-CA, en;q=0.9"), "zh-CN");
  assert.equal(resolveLocale("en", "fr"), "en");
  assert.equal(resolveLocale("fr", "zh-CN"), "fr");
  for (const preference of [undefined, "", "de", "en-US", "FR"]) {
    assert.equal(resolveLocale(preference, "fr-CA, en;q=0.8"), "fr");
  }
});

test("browser negotiation respects quality, regional variants and header order", () => {
  const cases = [
    ["fr-CA, en-US;q=0.8, zh-CN;q=0.6", "fr"],
    ["fr;q=0.4, en-US;q=0.9", "en"],
    ["de-DE, fr-FR;q=0.8, en;q=0.7", "fr"],
    ["en-GB;q=0.7, zh-Hans-CN;q=0.9", "zh-CN"],
    [" FR-ca ; q=0.8 , EN-us ; q=0.9 ", "en"],
    ["fr;q=0.8, en;q=0.8", "fr"],
    ["en;q=0.8, fr;q=0.8", "en"],
    ["en;q=0, fr;q=0.4", "fr"],
    ["fr;q=0, en;q=0.4", "en"],
    ["fr;q=invalid, en;q=0.5", "en"],
    ["fr;q=1.1, en;q=0.5", "en"],
    ["fr;q=-0.1, en;q=0.5", "en"],
  ];
  for (const [header, expected] of cases) assert.equal(resolveLocale(undefined, header), expected, header);
});

test("unsupported or absent browser languages fall back to Chinese", () => {
  for (const header of ["", "de-DE, es;q=0.9", "*", "en;q=0, fr;q=0", "fr;q=invalid"]) {
    assert.equal(resolveLocale(undefined, header), "zh-CN", header);
  }
});

test("all dictionaries share keys, interpolation arguments and rich text tags", () => {
  const reference = new Map(flattenMessages(dictionaries[defaultLocale]));
  for (const locale of locales) {
    const messages = new Map(flattenMessages(dictionaries[locale]));
    assert.deepEqual([...messages.keys()].sort(), [...reference.keys()].sort(), `${locale} message keys`);
    for (const [key, message] of messages) {
      assert.ok(message.trim(), `${locale}.${key} must not be empty`);
      const actual = messageArguments(parse(message));
      const expected = messageArguments(parse(reference.get(key)));
      assert.deepEqual([...actual.argumentsByName.keys()].sort(), [...expected.argumentsByName.keys()].sort(), `${locale}.${key} arguments`);
      assert.deepEqual([...actual.tags].sort(), [...expected.tags].sort(), `${locale}.${key} rich tags`);
    }
  }
});

test("every message formats through next-intl without ICU or missing-value errors", () => {
  for (const locale of locales) {
    const t = createTranslator({ locale, messages: dictionaries[locale], onError: (error) => assert.fail(error.message) });
    for (const [key, message] of flattenMessages(dictionaries[locale])) {
      const signature = messageArguments(parse(message));
      for (const count of [0, 1, 2]) {
        assert.equal(typeof t.rich(key, valuesFor(signature, count)), "string", `${locale}.${key} at ${count}`);
      }
    }
  }
});

test("copied team headings apply each language's plural rules and stable team labels", () => {
  const expected = {
    "zh-CN": { name: "白队", color: "白", fallback: "L组", headings: ["白队（0人）", "白队（1人）", "白队（2人）"] },
    en: { name: "White Team", color: "White", fallback: "Team L", headings: ["White Team (0 players)", "White Team (1 player)", "White Team (2 players)"] },
    fr: { name: "Équipe blanche", color: "Blanc", fallback: "Équipe L", headings: ["Équipe blanche (0 joueur)", "Équipe blanche (1 joueur)", "Équipe blanche (2 joueurs)"] },
  };
  const kits = buildKits([], 12);
  for (const locale of locales) {
    const t = createTranslator({ locale, namespace: "Kits", messages: dictionaries[locale] });
    const { name, color, fallback, headings } = expected[locale];
    assert.equal(getKitTeamLabel(kits[0], t), name);
    assert.equal(getKitColorLabel(kits[0], t), color);
    assert.equal(getKitTeamLabel(kits.at(-1), t), fallback);
    for (const count of [0, 1, 2]) assert.equal(t("copyHeading", { name: getKitTeamLabel(kits[0], t), count }), headings[count]);
    assert.equal(
      formatGroups([["甲（迟到）", "Élodie (late)"]], kits, (kit, count) => t("copyHeading", { name: getKitTeamLabel(kit, t), count })),
      `${headings[2]}\n1. 甲（迟到）\n2. Élodie (late)`,
    );
  }
});

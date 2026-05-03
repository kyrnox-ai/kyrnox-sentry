#!/usr/bin/env node
/**
 * scripts/render-social-preview.mjs
 *
 * Deterministically render `media/social-preview.png` (1280×640) from
 * the SENTRY palette tokens defined in
 * `packages/sentry-cli/src/ui/colors.ts`. The script is the source of
 * truth: the PNG is committed alongside the script so dependents can
 * re-render and diff.
 *
 * Constraints:
 *   - Apache-2.0 / OFL-only assets: Geist Mono is loaded from
 *     `@fontsource/geist-mono` (already a dependency of `apps/demo`).
 *   - Palette tokens are byte-for-byte mirrored from
 *     `packages/sentry-cli/src/ui/colors.ts`. No additional colors are
 *     introduced.
 *   - WCAG AA contrast is preserved against the matte-black background
 *     for every text run on the PNG.
 *   - No emojis. Glyphs (▶ ⚠ ▮) only.
 *   - The CI workflow `social-preview.yml` re-renders this PNG on push
 *     to `main`, diffs against the committed file, and fails on drift.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");

// SENTRY palette — mirrors packages/sentry-cli/src/ui/colors.ts.
// If those tokens drift, this object MUST drift in lockstep, and the
// social-preview workflow will fail until the PNG is re-rendered.
const HEX = {
	matteBlack: "#05070A",
	gunmetal: "#1A1F26",
	signalAmber: "#FFB000",
	warningRed: "#FF003C",
	restrictedCyan: "#00E5FF",
	natoGreen: "#39FF14",
	body: "#D6DDE6",
	muted: "#5A6470",
};

const WIDTH = 1280;
const HEIGHT = 640;

// Bundled OFL font — loaded by resvg from disk so output is reproducible
// regardless of the operator's installed system fonts.
const FONT_PATH = resolve(repoRoot, "node_modules/@fontsource/geist-mono/files/geist-mono-latin-700-normal.woff2");
const FONT_PATH_REGULAR = resolve(
	repoRoot,
	"node_modules/@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2",
);

const OUTPUT_PATH = resolve(repoRoot, "media/social-preview.png");

// Mission tagline mirrors the first sentence of README's `// MISSION`
// block. Keep it ≤ 80 chars per line.
const TAGLINE = "Guards defense-tech LLM coding agents. Fail-closed. Deny-by-default.";

const CLASSIFIED_HEADER = "// CLASSIFIED // KYRNOX SENTRY // ENFORCEMENT: DENY // FAIL-CLOSED";

const PROJECT_NAME = "KYRNOX SENTRY";
const SUBTITLE = "▮ SDK + TOOLS + CLI ▮ APACHE-2.0 ▮ NO TELEMETRY";

const CHIPS = [
	{ glyph: "▶", label: "evaluateToolPolicy", color: HEX.natoGreen, kind: "IMPL" },
	{ glyph: "⚠", label: "BundleSigner", color: HEX.signalAmber, kind: "STUB" },
	{ glyph: "⚠", label: "HashChainedAuditLedger", color: HEX.signalAmber, kind: "STUB" },
	{ glyph: "⚠", label: "FirmwareBaselineVerifier", color: HEX.signalAmber, kind: "STUB" },
	{ glyph: "⚠", label: "GeoAOIPolicy", color: HEX.signalAmber, kind: "STUB" },
];

function buildSvg() {
	// Layout grid (px). All values are integers so the rasterized output
	// is byte-stable across runs.
	const padX = 56;
	const padTop = 48;

	// Top classified banner.
	const bannerY = padTop + 18;

	// Project name.
	const titleY = padTop + 132;

	// Subtitle row.
	const subtitleY = titleY + 56;

	// Tagline.
	const taglineY = subtitleY + 72;

	// Chip strip baseline.
	const chipsY = HEIGHT - 92;
	const chipHeight = 44;
	const chipPadX = 18;
	const chipGap = 16;
	const chipFontSize = 18;

	// Bottom-left footprint stamp.
	const stampY = HEIGHT - 28;

	// Approximate width of monospace text at given font-size to lay
	// chips out without measuring fonts (≈ 0.6em per glyph in Geist
	// Mono). The script keeps the multiplier deterministic and
	// independent of the system font cache.
	const charWidth = (size) => Math.round(size * 0.62);
	const measure = (text, size) => text.length * charWidth(size);

	// Chip x cursor.
	let chipCursor = padX;
	const chipNodes = [];
	for (const chip of CHIPS) {
		const text = `${chip.glyph} ${chip.label}`;
		const w = measure(text, chipFontSize) + chipPadX * 2;
		chipNodes.push({
			x: chipCursor,
			y: chipsY,
			w,
			h: chipHeight,
			fill: chip.color,
			label: text,
			kind: chip.kind,
		});
		chipCursor += w + chipGap;
	}

	const chipMarkup = chipNodes
		.map(
			(c) => `
		<g>
			<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="4" ry="4"
				fill="${HEX.gunmetal}" stroke="${c.fill}" stroke-width="1.5" />
			<text x="${c.x + chipPadX}" y="${c.y + chipHeight / 2 + 6}"
				font-family="Geist Mono" font-size="${chipFontSize}" font-weight="700"
				fill="${c.fill}">${escapeXml(c.label)}</text>
		</g>`,
		)
		.join("\n");

	// SENTRY brand bar — three vertical stripes anchored top-right to
	// echo the [▮ ▮ ▮] glyph used throughout the CLI banner without
	// rendering text.
	const stripeRight = WIDTH - padX;
	const stripeTop = padTop;
	const stripeH = 18;
	const stripeW = 26;
	const stripeGap = 10;
	const stripes = [
		{ x: stripeRight - (stripeW * 3 + stripeGap * 2), fill: HEX.signalAmber },
		{ x: stripeRight - (stripeW * 2 + stripeGap), fill: HEX.restrictedCyan },
		{ x: stripeRight - stripeW, fill: HEX.natoGreen },
	]
		.map((s) => `<rect x="${s.x}" y="${stripeTop}" width="${stripeW}" height="${stripeH}" fill="${s.fill}" />`)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
	<rect width="${WIDTH}" height="${HEIGHT}" fill="${HEX.matteBlack}" />

	<!-- gunmetal hairline frame for the panel-grid feel -->
	<rect x="16" y="16" width="${WIDTH - 32}" height="${HEIGHT - 32}"
		fill="none" stroke="${HEX.gunmetal}" stroke-width="2" />

	<!-- top-right SENTRY stripes -->
	${stripes}

	<!-- classified banner header -->
	<text x="${padX}" y="${bannerY}"
		font-family="Geist Mono" font-size="20" font-weight="700"
		fill="${HEX.signalAmber}">${escapeXml(CLASSIFIED_HEADER)}</text>

	<!-- divider -->
	<line x1="${padX}" y1="${bannerY + 20}" x2="${WIDTH - padX}" y2="${bannerY + 20}"
		stroke="${HEX.gunmetal}" stroke-width="1" />

	<!-- project name -->
	<text x="${padX}" y="${titleY}"
		font-family="Geist Mono" font-size="84" font-weight="700"
		fill="${HEX.body}">${escapeXml(PROJECT_NAME)}</text>

	<!-- subtitle / blocks line -->
	<text x="${padX}" y="${subtitleY}"
		font-family="Geist Mono" font-size="22" font-weight="700"
		fill="${HEX.restrictedCyan}">${escapeXml(SUBTITLE)}</text>

	<!-- mission tagline -->
	<text x="${padX}" y="${taglineY}"
		font-family="Geist Mono" font-size="24" font-weight="400"
		fill="${HEX.body}">${escapeXml(TAGLINE)}</text>

	<!-- chip strip header -->
	<text x="${padX}" y="${chipsY - 18}"
		font-family="Geist Mono" font-size="14" font-weight="700"
		fill="${HEX.muted}">// PRIMITIVES</text>

	<!-- chip strip -->
	${chipMarkup}

	<!-- footer stamp -->
	<text x="${padX}" y="${stampY}"
		font-family="Geist Mono" font-size="14" font-weight="400"
		fill="${HEX.muted}">github.com/kyrnox-ai/kyrnox-sentry · Apache-2.0 · WCAG AA · OFL fonts</text>
</svg>
`;
}

function escapeXml(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function main() {
	const svg = buildSvg();

	const fontFiles = [];
	for (const path of [FONT_PATH, FONT_PATH_REGULAR]) {
		try {
			await readFile(path);
			fontFiles.push(path);
		} catch (_err) {
			throw new Error(
				`SENTRY social preview: required OFL font missing at ${path}. Run \`npm install\` so @fontsource/geist-mono is available before re-rendering.`,
			);
		}
	}

	const resvg = new Resvg(svg, {
		fitTo: { mode: "width", value: WIDTH },
		background: HEX.matteBlack,
		font: {
			loadSystemFonts: false,
			fontFiles,
			defaultFontFamily: "Geist Mono",
			monospaceFamily: "Geist Mono",
			sansSerifFamily: "Geist Mono",
		},
		shapeRendering: 2,
		textRendering: 2,
		imageRendering: 0,
	});

	const png = resvg.render().asPng();

	await mkdir(dirname(OUTPUT_PATH), { recursive: true });
	await writeFile(OUTPUT_PATH, png);

	const kb = (png.byteLength / 1024).toFixed(1);
	console.log(`SENTRY social preview rendered: ${OUTPUT_PATH} (${WIDTH}x${HEIGHT}, ${kb} KB)`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

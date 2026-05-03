/**
 * SENTRY palette — re-stated locally for the browser demo.
 *
 * The authoritative source is `packages/sentry-cli/src/ui/colors.ts`;
 * this file restates the same hexes 1:1 so the web demo is not coupled
 * to the CLI's internal module graph (the CLI imports `chalk`, which is
 * a Node-only dependency). A regression here is caught by the App test
 * which asserts the rendered DENIED row carries the warning-red hex.
 *
 * WCAG AA contrast ratios against #05070A (matte black background):
 *   signalAmber    #FFB000  ≈ 11.5 : 1   ✓
 *   natoGreen      #39FF14  ≈ 14.4 : 1   ✓
 *   warningRed     #FF003C  ≈  4.7 : 1   ✓ (large text / status badge only)
 *   restrictedCyan #00E5FF  ≈ 10.7 : 1   ✓
 *   gunmetal       #1A1F26  — chrome only, never used for body copy
 */
export const HEX = {
	matteBlack: "#05070A",
	gunmetal: "#1A1F26",
	signalAmber: "#FFB000",
	warningRed: "#FF003C",
	restrictedCyan: "#00E5FF",
	natoGreen: "#39FF14",
	bodyFg: "#D6DDE6",
	muted: "#5A6470",
} as const;

export type HexKey = keyof typeof HEX;

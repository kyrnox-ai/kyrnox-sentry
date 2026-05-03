/**
 * Central chalk palette for the Kyrnox SENTRY CLI.
 *
 * Hexes are locked to the SENTRY visual brief (sexy military cyberpunk):
 * a real ops console, not a rainbow. PR #2+ MUST import from here so the
 * `kyrnox-sentry` surface stays consistent across banner, decision rows,
 * status TUI, and demo console.
 *
 * WCAG AA contrast against #05070A matte black background:
 *   signalAmber  #FFB000  ≈ 11.5 : 1   ✓
 *   natoGreen    #39FF14  ≈ 14.4 : 1   ✓
 *   warningRed   #FF003C  ≈  4.7 : 1   ✓ (large text / status badge only)
 *   restrictedCy #00E5FF  ≈ 10.7 : 1   ✓
 *   gunmetal     #1A1F26  — muted/dim, never used for body copy
 */
import chalk from "chalk"

export const HEX = {
	matteBlack: "#05070A",
	gunmetal: "#1A1F26",
	signalAmber: "#FFB000",
	warningRed: "#FF003C",
	restrictedCyan: "#00E5FF",
	natoGreen: "#39FF14",
} as const

export const palette = {
	signalAmber: chalk.hex(HEX.signalAmber),
	warningRed: chalk.hex(HEX.warningRed),
	restrictedCyan: chalk.hex(HEX.restrictedCyan),
	natoGreen: chalk.hex(HEX.natoGreen),
	gunmetal: chalk.hex(HEX.gunmetal),
	muted: chalk.hex("#5A6470"),
} as const

export const accents = {
	allowed: palette.natoGreen.bold,
	denied: palette.warningRed.bold,
	required: palette.signalAmber.bold,
	redacted: palette.restrictedCyan,
	heading: palette.signalAmber.bold,
	body: chalk.hex("#D6DDE6"),
	dim: palette.muted,
} as const

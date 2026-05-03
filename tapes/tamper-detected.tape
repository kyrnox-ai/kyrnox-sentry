# Kyrnox SENTRY VHS tape — tamper detected
#
# Drives `kyrnox-sentry verify --bundle ./tampered-bundle.json`. The
# tampered fixture flips a single byte in toolPolicies[2].action so the
# zod schema rejects it, and the runtime collapses the synthetic
# session.start decision to DENIED in warning-red.
#
# This is Scene 2 from docs/demo-script.md. Fail-closed contract holds:
# the runtime never reached evaluateToolPolicy — the bundle was rejected
# at the schema gate.
#
# Theme hexes copied byte-for-byte from
# packages/sentry-cli/src/ui/colors.ts.

Output media/tamper-detected.gif

Set FontFamily "Geist Mono"
Set FontSize 14
Set Width 1200
Set Height 720
Set Padding 24
Set Framerate 24
Set PlaybackSpeed 1.0
Set TypingSpeed 30ms
Set Theme { "name": "SENTRY", "black": "#05070A", "red": "#FF003C", "green": "#39FF14", "yellow": "#FFB000", "blue": "#1A1F26", "magenta": "#FFB000", "cyan": "#00E5FF", "white": "#D6DDE6", "brightBlack": "#5A6470", "brightRed": "#FF003C", "brightGreen": "#39FF14", "brightYellow": "#FFB000", "brightBlue": "#1A1F26", "brightMagenta": "#FFB000", "brightCyan": "#00E5FF", "brightWhite": "#D6DDE6", "background": "#05070A", "foreground": "#D6DDE6", "selection": "#1A1F26", "cursor": "#FFB000" }

Hide
Type 'export PATH="$PWD/tapes/.bin:$PATH"'
Enter
Type "clear"
Enter
Sleep 200ms
Show

Type "diff <(jq -S .toolPolicies bundle.json) <(jq -S .toolPolicies tampered-bundle.json) | head -10"
Sleep 500ms
Enter
Sleep 2000ms

Type "kyrnox-sentry verify --bundle ./tampered-bundle.json; echo EXIT $?"
Sleep 500ms
Enter
Sleep 3000ms

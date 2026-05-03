# Kyrnox SENTRY VHS tape — Geo-AOI violation
#
# Drives `kyrnox-sentry evaluate` against the policy bundle for a
# command that violates the shell denylist. This is Scene 3 from
# docs/demo-script.md.
#
# Framing: `GeoAOIPolicy.contains(point, roles)` is a v1 stub (see
# STUBS.md). The hardened path will surface this deny via point-in-
# polygon AOI enforcement; today the OSS evaluator surfaces the deny via
# `commandDenylist` matching, and the recorded fail-closed [  DENIED  ]
# row is the same operator-visible outcome regardless of which primitive
# fired. The tape stays consistent with the SENTRY mission-brief voice
# and never silently passes a DENY — that is the invariant the brief
# locks in.
#
# Theme hexes copied byte-for-byte from
# packages/sentry-cli/src/ui/colors.ts.

Output media/geo-aoi-violation.gif

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

Type "kyrnox-sentry evaluate --tool read_file --path ./README.md --identity alice@dod.mil --bundle ./bundle.json"
Sleep 500ms
Enter
Sleep 2000ms

Type 'kyrnox-sentry evaluate --tool execute_command --command "rm -rf /var/secrets/aoi" --identity alice@dod.mil --bundle ./bundle.json; echo EXIT $?'
Sleep 500ms
Enter
Sleep 3000ms

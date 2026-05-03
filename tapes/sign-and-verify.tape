# Kyrnox SENTRY VHS tape — sign and verify
#
# Drives `kyrnox-sentry verify` and `kyrnox-sentry status` against
# ./bundle.json. The output frames the happy-path Scene 1 from
# docs/demo-script.md: BUNDLE INTEGRITY: VERIFIED in NATO-green and a
# session.start ALLOWED row.
#
# Theme hexes are copied byte-for-byte from
# packages/sentry-cli/src/ui/colors.ts:
#   matteBlack     #05070A   (HEX.matteBlack)
#   gunmetal       #1A1F26   (HEX.gunmetal)
#   signalAmber    #FFB000   (HEX.signalAmber)
#   warningRed     #FF003C   (HEX.warningRed)
#   restrictedCyan #00E5FF   (HEX.restrictedCyan)
#   natoGreen      #39FF14   (HEX.natoGreen)
#   body           #D6DDE6   (accents.body)
#   muted          #5A6470   (palette.muted / accents.dim)

Output media/sign-and-verify.gif

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

Type "kyrnox-sentry verify --bundle ./bundle.json"
Sleep 500ms
Enter
Sleep 2500ms

Type "kyrnox-sentry status --bundle ./bundle.json --json | jq '.policies'"
Sleep 500ms
Enter
Sleep 2500ms

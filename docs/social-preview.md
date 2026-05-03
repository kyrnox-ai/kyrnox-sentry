# Kyrnox SENTRY — Social Preview

```text
// CLASSIFIED // KYRNOX SENTRY SOCIAL PREVIEW
▮ 1280×640 PNG ▮ DETERMINISTIC ▮ OFL FONTS ONLY
```

`media/social-preview.png` is the GitHub social-preview card that
renders in the link unfurl when this repo is shared. It is generated
deterministically by `scripts/render-social-preview.mjs` from the
SENTRY palette tokens defined in
`packages/sentry-cli/src/ui/colors.ts`. The script is the source of
truth; the committed PNG exists so consumers can pull a render
without re-running the toolchain.

## // PALETTE LOCK

The PNG uses only the eight palette tokens already shipped by the
CLI banner:

| Token            | Hex       | Usage on the preview                           |
|------------------|-----------|------------------------------------------------|
| matteBlack       | `#05070A` | Background                                     |
| gunmetal         | `#1A1F26` | Hairline frame, chip fills, divider            |
| signalAmber      | `#FFB000` | Classified-banner header, ⚠ stub chips, stripe |
| restrictedCyan   | `#00E5FF` | Subtitle row, stripe                           |
| natoGreen        | `#39FF14` | ▶ implemented chip border + label, stripe      |
| warningRed       | `#FF003C` | Reserved (not painted)                         |
| body (`#D6DDE6`) | `#D6DDE6` | Project name, mission tagline                  |
| muted (`#5A6470`)| `#5A6470` | Footer stamp, `// PRIMITIVES` heading          |

If any of those tokens move in `colors.ts`, the
`social-preview.yml` workflow will fail until the PNG is re-rendered
and re-committed.

## // RE-RENDER LOCALLY

```sh
npm install
npm run social-preview
file media/social-preview.png   # PNG image data, 1280 x 640
du -h media/social-preview.png  # ≤ 1 MB
git diff -- media/social-preview.png
```

Commit the re-rendered PNG alongside the script change.

## // UPLOAD TO GITHUB

GitHub's REST API does not expose a public endpoint for uploading the
repository "Social preview" image. The supported path is the web UI:

1. Open <https://github.com/kyrnox-ai/kyrnox-sentry/settings>.
2. Scroll to **Social preview**.
3. Choose **Edit** → **Upload an image…**.
4. Pick `media/social-preview.png` from the cloned repo.
5. Save. Verify with `gh api repos/kyrnox-ai/kyrnox-sentry --jq
   '.id, .name'` that the repo metadata is otherwise unchanged.

The previewed unfurl can be inspected via Twitter Card Validator,
LinkedIn Post Inspector, or by sharing the repo URL into any
platform that respects `og:image`.

> TODO (maintainers): if GitHub later exposes a stable
> `repository.uploadSocialPreview` operation, add a one-liner to this
> doc and a `gh api -X PATCH …` step to the release workflow. Until
> then, the manual web-UI upload above is the only supported path.

## // WHAT NOT TO PUT ON THE CARD

- No marketing copy, no superlatives.
- No real policy bundle keys, audit-ledger rows, or attested
  firmware hashes.
- No emojis. SENTRY glyphs only (`▮ ▶ ✓ ✗ ⚠ →`).
- No third-party logos. The card identifies the OSS surface only.

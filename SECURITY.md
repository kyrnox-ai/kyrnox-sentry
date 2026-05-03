# Security policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities. Instead, email `security@kyrnox.ai` with:

- a description of the vulnerability;
- steps to reproduce or a proof-of-concept;
- the affected version(s);
- any mitigations you've already identified.

We will acknowledge receipt within 2 business days and aim to ship a fix or workaround within 30 days for high-severity issues.

## Supported versions

Only the latest minor of `@kyrnox/sentry-sdk`, `@kyrnox/sentry-tools`, and `@kyrnox/sentry-cli` receives security patches during alpha.

## Scope

The Kyrnox SENTRY OSS surface (`packages/sentry-sdk`, `packages/sentry-tools`, `packages/sentry-cli`) and the public CI workflows are in scope. The commercial Kyrnox Platform repo (`kyrnox-ai/kyrnox-platform`) has its own private vulnerability process; cross-cutting issues that affect both should still be reported via the email above.

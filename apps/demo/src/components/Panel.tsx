import type React from "react";

/**
 * Bordered panel that mirrors the Ink TUI panel grid. Border is gunmetal
 * by default and signal-amber when focused, matching `panelBorderColor()`
 * in `packages/sentry-cli/src/ui/status/StatusApp.tsx`.
 */
export function Panel({
	name,
	focused = false,
	children,
	className,
}: {
	name: string;
	focused?: boolean;
	children: React.ReactNode;
	className?: string;
}): React.ReactElement {
	return (
		<section
			className={`panel${focused ? " panel--focused" : ""}${className ? ` ${className}` : ""}`}
			aria-labelledby={`panel-${name.toLowerCase()}`}
		>
			<h2 className="panel__title" id={`panel-${name.toLowerCase()}`}>
				{`\u25AE ${name}`}
			</h2>
			{children}
		</section>
	);
}

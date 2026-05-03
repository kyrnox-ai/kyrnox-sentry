import React from "react";
import ReactDOM from "react-dom/client";

// @fontsource fonts are self-hosted (no Google Fonts CDN). Each font
// below ships under SIL Open Font License 1.1 (OFL-1.1), which is
// compatible with the Apache-2.0 repository license.
//   - Geist Mono     OFL-1.1 (https://github.com/vercel/geist-font)
//   - JetBrains Mono OFL-1.1 (https://github.com/JetBrains/JetBrainsMono)
//   - Space Mono     OFL-1.1 (https://fonts.google.com/specimen/Space+Mono)
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/space-mono/400.css";

import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("SENTRY ops console: missing #root mount");

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);

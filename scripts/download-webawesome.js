import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";

const BASE_URL = "https://early.webawesome.com/webawesome@3.0.0-alpha.4/dist/";
const OUTPUT_DIR = "./ui-src/webawesome";

const COMPONENTS = [
	"animated-image",
	"animation",
	"avatar",
	"badge",
	"breadcrumb",
  "breadcrumb-item",
	"button",
	"button-group",
	"callout",
	"card",
	"carousel",
  "carousel-item",
	"checkbox",
	"color-picker",
	"copy-button",
	"details",
	"dialog",
	"divider",
	"drawer",
	"dropdown",
	"format-bytes",
	"format-date",
	"format-number",
	"icon",
	"icon-button",
	"image-comparer",
	"include",
	"input",
	"menu",
  "menu-item",
  "menu-label",
  "mutation-observer",
  "option",
	"popup",
	"progress-bar",
	"progress-ring",
	"qr-code",
	"radio-group",
  "radio",
  "radio-button",
	"range",
	"rating",
	"relative-time",
	"resize-observer",
	"select",
	"skeleton",
	"spinner",
	"split-panel",
	"switch",
	"tab-group",
  "tab",
  "tab-panel",
	"tag",
	"textarea",
	"tooltip",
	"tree",
  "tree-item",
	"visually-hidden",
];

const fetchFile = async (url) => {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
		}
		return await response.text();
	} catch (error) {
		console.error(`Error fetching ${url}: ${error.message}`);
		return null;
	}
};

const downloadAndParseImports = async (url, visited) => {
	if (visited.has(url)) return; // Skip already visited URLs
	visited.add(url); // Mark the URL as visited

	const fileContent = await fetchFile(url);
	if (!fileContent) return;

	const filename = url.replace(BASE_URL, "");
	const filePath = resolve(OUTPUT_DIR, filename);

	// Ensure directory exists
	await mkdir(dirname(filePath), { recursive: true });
	await writeFile(filePath, fileContent);
	console.log(`Downloaded: ${filePath}`);

	// Capture different import patterns
	const importRegex =
		/import\s+(?:{[^}]*}|\w+|\*\s+as\s+\w+|\s*)\s+from\s+["'](\.[\/\w\d\-.]+\.js)["']|import\s+["'](\.[\/\w\d\-.]+\.js)["']/g;
	let match;
	const newImports = [];

	while ((match = importRegex.exec(fileContent)) !== null) {
		const importPath = match[1] || match[2];
		const importUrl = new URL(importPath, url).href;

		if (!visited.has(importUrl)) {
			newImports.push(importUrl); // Add only new imports
		}
	}

	// Recursively process each new import
	for (const newImport of newImports) {
		await downloadAndParseImports(newImport, visited);
	}
};

const main = async () => {
	const visited = new Set(); // Track visited URLs

	try {
		// Start with the main file
		await downloadAndParseImports(`${BASE_URL}webawesome.js`, visited);

		// Process each component file
		for (const component of COMPONENTS) {
			const componentUrl = `${BASE_URL}components/${component}/${component}.js`;
			console.log(`Processing component: ${componentUrl}`);
			await downloadAndParseImports(componentUrl, visited);
		}

		console.log("All modules and components downloaded successfully.");
	} catch (error) {
		console.error(`Error: ${error.message}`);
	}
};

main();

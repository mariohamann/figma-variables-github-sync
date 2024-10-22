console.clear();

export function exportToJSON() {
	// Replacer function to remove circular references
	function replacer(key, value) {
		// Check if the value is an object
		if (typeof value === "object" && value !== null) {
			// Recursively capture all enumerable properties of the object
			const result = {};
			for (let prop in value) {
				result[prop] = value[prop];
			}
			return result;
		}
		return value;
	}

	const output = {
		variables: figma.variables.getLocalVariables(),
		variableCollections: figma.variables.getLocalVariableCollections(),
	};

	return JSON.stringify(output, replacer, 2);
}

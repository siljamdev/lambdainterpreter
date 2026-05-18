let defined = null;

function getDefined(){
	const constants = Array.from(defineContainer.children).map(pocket => {
		const inputs = pocket.querySelectorAll("input");
		const name = inputs[0]?.value.trim() || "";
		const definition = inputs[1]?.value.trim() || "";
		return { name, definition };
	});
	
	defined = constants;
}

function getValue(name){
	const match = defined.find(c => c.name === name);
	if (match) {
		return match.definition;
	} else {
		throw new Error("Definition not found: " + name);
	}
}

function isThereAnyEmpty(){
	getDefined();
	return defined.some(c => c.name === "");
}
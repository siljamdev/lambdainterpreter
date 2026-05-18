function parseLambda(expression){
	getDefined();
	const {result: lam, newIndex: i} = parseLambdaIndex(expression, 0, []);
	return lam;
}

function parseLambdaIndex(expression, startPos, names){
	let i = startPos;
	if (i >= expression.length){
		throw new Error("Unexpected early end of the string");
	}
	const c = expression[i];
	if(c === '/' || c === 'λ' || c === '\\'){
		i++;
		const { result: variableName, newIndex: newI } = parseUntilDot(expression, i);
		i = newI;
		
		if(variableName.length === 0){
			throw new Error("No variable name for the function");
		}
		
		let j = 0;
		let n = 0;
		let p = new lambda(null);
		let f = p;
		
		while(j < variableName.length){
			if(n !== 0){
				f.expression = new lambda(null);
				f = f.expression;
			}
			
			if(!/[a-z]/.test(variableName[j])){
				throw new Error("Invalid variable name in a function");
			}
			j++;
			
			if(variableName.length > j && /[0-9]/.test(variableName[j])){
				names.push(variableName.substring(j - 1, j + 1));
				n--;
				j++;
			}else{
				names.push(variableName.substring(j - 1, j));
				n--;
			}
		}
		
		const { result: body, newIndex: newI2 } = parseLambdaIndex(expression, i, names);
		i = newI2;
		
		names.splice(n);
		
		f.expression = body;
		return {result: p, newIndex: i};
	}
	
	if(/[a-z]/.test(c)){
		let v = c;
		i++;
		
		if(i < expression.length && /[0-9]/.test(expression[i])){
			v += expression[i];
			i++;
		}
		
		let j = 0;
		for(j = 0; j < names.length; j++){
			if(v == names[names.length - 1 - j]){
				break;
			}
		}
		if(j === names.length){
			names.unshift(v);
		}
		const va = new variable(j);
		return {result: va, newIndex: i};
	}
	
	if(/[0-9]/.test(c) && replaceWithChurch){
		const { result: num, newIndex: newI } = parseNumbers(expression, i);
		i = newI;
		
		const n = parseInt(num);
		
		return {result: getChurch(n), newIndex: i};
	}
	
	if(c === '('){
		i++;
		const { result: func, newIndex: newI } = parseLambdaIndex(expression, i, names);
		i = newI;
		
		if (i >= expression.length){
			throw new Error("Unexpected early end of the string: Expected space");
		}
		
		if (expression[i] !== ' '){
			throw new Error("Expected space");
		}
		
		i++;
		
		while(i < expression.length && expression[i] === ' '){
			i++;
		}
		
		const { result: arg, newIndex: newI2 } = parseLambdaIndex(expression, i, names);
		i = newI2;
		
		let app = new application(func, arg);
		
		while(true){
			if (i >= expression.length){
				throw new Error("Unexpected early end of the string: Expected closing bracket or space");
			}
			
			if(expression[i] !== ' '){
				break;
			}
			
			while(i < expression.length && expression[i] === ' '){
				i++;
			}
			
			const { result: arg2, newIndex: newI3 } = parseLambdaIndex(expression, i, names);
			i = newI3;
			app = new application(app, arg2);
		}
		
		if (i >= expression.length){
			throw new Error("Unexpected early end of the string: Expected closing bracket or space");
		}
		
		if (expression[i] !== ')'){
			throw new Error("Expected closing bracket");
		}
		
		i++;
		return {result: app, newIndex: i};
	}
	
	if(c === '['){
		i++;
		const { result: func, newIndex: newI } = parseLambdaIndex(expression, i, names);
		i = newI;
		
		if (i >= expression.length){
			throw new Error("Unexpected early end of the string: Expected space");
		}
		
		if (expression[i] !== ' '){
			throw new Error("Expected space");
		}
		
		i++;
		
		while(i < expression.length && expression[i] === ' '){
			i++;
		}
		
		const { result: arg, newIndex: newI2 } = parseLambdaIndex(expression, i, names);
		i = newI2;
		
		let par = new application(func, arg);
		let app = par;
		
		while(true){
			if (i >= expression.length){
				throw new Error("Unexpected early end of the string: Expected closing square bracket or space");
			}
			
			if(expression[i] !== ' '){
				break;
			}
			
			while(i < expression.length && expression[i] === ' '){
				i++;
			}
			
			const { result: arg2, newIndex: newI3 } = parseLambdaIndex(expression, i, names);
			i = newI3;
			app.argument = new application(app.argument, arg2);
			app = app.argument;
		}
		
		if (i >= expression.length){
			throw new Error("Unexpected early end of the string: Expected closing square bracket or space");
		}
		
		if (expression[i] !== ']'){
			throw new Error("Expected closing bracket");
		}
		
		i++;
		return {result: par, newIndex: i};
	}
	
	if(c === '#'){
		const { result: name, newIndex: newI } = parseLetters(expression, i + 1);
		i = newI;
		
		const value = getValue(name);
		try{
			const { result: expr, newIndex: newI2 } = parseLambdaIndex(value, 0, names);
			return {result: expr, newIndex: i};
		}catch(e){
			throw new Error("Error parsing definition of " + name + ":<br>" + e);
		}
	}
	
	throw new Error("Unknown charachter");
}

function parseNumbers(input, startIndex){
	let result = '';
	for (let i = startIndex; i < input.length; i++) {
		if (/[^0-9]/.test(input[i])) {
			return { result: result, newIndex: i};
		}
		result += input[i]; // collect characters
	}
	return { result: result, newIndex: input.length }; // return full string if no dot is found
}

function parseLetters(input, startIndex){
	let result = '';
	for (let i = startIndex; i < input.length; i++) {
		if (/[^a-zA-Z]/.test(input[i])) {
			return { result: result, newIndex: i};
		}
		result += input[i]; // collect characters
	}
	return { result: result, newIndex: input.length }; // return full string if no dot is found
}

function parseUntilDot(input, startIndex) {
  let result = '';
  for (let i = startIndex; i < input.length; i++) {
    if (input[i] === '.') {
      return { result: result, newIndex: i + 1 }; // stop when we hit the dot and return the new position
    }
    result += input[i]; // collect characters
  }
  return { result: result, newIndex: input.length }; // return full string if no dot is found
}

function parseUntilSpace(input, startIndex) {
	let result = '';
	let counter = 0;
	for (let i = startIndex; i < input.length; i++) {
		if(input[i] === '('){
			counter++;
		}else if (input[i] === ' ' && counter === 0) {
			while(i < input.length && input[i] == ' '){
				i++;
			}
			return { result: result, newIndex: i - 1};
		}else if(input[i] === ')'){
			if(counter === 0){
				return { result: result, newIndex: i };
			}else{
				counter--;
			}
		}
		result += input[i]; // collect characters
	}
	return { result: result, newIndex: input.length }; // return full string if no dot is found
}

function getChurch(n){
	const f = new lambda(new lambda(new variable(0)));
	
	for(let i = 0; i < n; i++){
		f.expression.expression = new application(new variable(1), f.expression.expression);
	}
	
	return f;
}
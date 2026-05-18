function reduceOneAsync(expression){
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(reduceOne(expression));
		}, 0);
	});
}

function reduceOne(expression) {
	if (expression instanceof application) {
		// Try to reduce the function part first
		if (expression.func instanceof lambda) {
			// Perform a single beta reduction step
			return substitute(expression.func.expression, expression.argument);
		}

		// Try reducing the function part
		const reducedFunc = reduceOne(expression.func);
		if (reducedFunc !== expression.func) {
			return new application(reducedFunc, expression.argument);
		}

		// Try reducing the argument
		const reducedArg = reduceOne(expression.argument);
		if (reducedArg !== expression.argument) {
			return new application(expression.func, reducedArg);
		}

		return expression;
	}

	if (expression instanceof lambda) {
		const reducedBody = reduceOne(expression.expression);
		if (reducedBody !== expression.expression) {
			return new lambda(reducedBody);
		}
		return expression;
	}

	// variables don't reduce
	return expression;
}

function reduceAsyncStepsNonBlocking(expression, onStep, onEnd) {
	let current = expression;

	function step() {
		const next = reduceOne(current);

		if (next === current) {
			onEnd();
			return;
		}

		current = next;
		onStep(current);
		setTimeout(step, 0); // Yield control
	}

	setTimeout(step, 0);
}


function reduce(expression){
	if(expression instanceof lambda){
		return new lambda(reduce(expression.expression));
	}else if(expression instanceof variable){
		return expression;
	}else if (expression instanceof application) {
		const func = reduce(expression.func);
		const arg = reduce(expression.argument);

		if (func instanceof lambda) {
			return reduce(substitute(func.expression, arg));
		}

		return new application(func, arg);
	}
}

function shift(term, by, from = 0) {
	if (term instanceof variable) {
		return new variable(term.index >= from ? term.index + by : term.index);
	}
	if (term instanceof lambda) {
		return new lambda(shift(term.expression, by, from + 1));
	}
	if (term instanceof application) {
		return new application(
			shift(term.func, by, from),
			shift(term.argument, by, from)
		);
	}
}

function substitute(term, withTerm, depth = 0) {
	if (term instanceof variable) {
		if (term.index === depth) {
			return shift(withTerm, depth);
		}
		return new variable(term.index > depth ? term.index - 1 : term.index);
	}
	if (term instanceof lambda) {
		return new lambda(substitute(term.expression, withTerm, depth + 1));
	}
	if (term instanceof application) {
		return new application(
			substitute(term.func, withTerm, depth),
			substitute(term.argument, withTerm, depth)
		);
	}
}
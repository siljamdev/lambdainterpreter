let helpPanel = null;
let definePanel = null;
let defineContainer = null;

let replaceWithChurch = true;

document.addEventListener("DOMContentLoaded", function (){
	const input = document.querySelector("textarea");
	const readonlyBox = document.querySelector(".orangeReadonlyBox");
	const startButton = document.getElementById("startButton");
	const runButton = document.getElementById("runButton");
	const nextButton = document.getElementById("nextButton");
	
	const churchToggle = document.getElementById("churchToggle");
	
	const openHelpButton = document.getElementById("openHelpButton");
	const closeHelpButton = document.getElementById("closeHelpButton");
	
	const openDefineButton = document.getElementById("openDefineButton");
	const closeDefineButton = document.getElementById("closeDefineButton");
	
	const addDefineButton = document.getElementById("addDefineButton");
	defineContainer = document.getElementById("defineContainer");
	
	helpPanel = document.getElementById("helpPanel");
	definePanel = document.getElementById("definePanel");
	
	input.style.height = "auto";
	const maxHeight = window.innerHeight * 0.25;
	input.style.height = Math.min(input.scrollHeight, maxHeight) + "px";
	
	input.addEventListener("keydown", function(e) {
		if(/[^a-zA-Z0-9.#λ\/\\()=\[\]\s]/.test(e.key)){
			e.preventDefault();
			return;
		}
		closeHelpPanel();
		closeDefinePanel();
		if(e.key !== "Enter") {
			return;
		}
		e.preventDefault(); // block actual newline
		if(evaluating && currentExpression !== null){
			return;
		}
		evaluating = true;
		parsing = true;
		const inputExpression = input.value;
		try{
			const lam = parseLambda(inputExpression);
			currentExpression = lam;
			clearBeforeRepresenting();
			readonlyBox.innerHTML = currentExpression.representAsString();
			readonlyBox.scrollTop = readonlyBox.scrollHeight;
		}catch(e){
			readonlyBox.innerHTML = "Parsing error:<br>" + e;
			startButton.classList.add("red");
            setTimeout(() => startButton.classList.remove("red"), 800);
			currentExpression = null;
		}finally{
			evaluating = false;
			parsing = false;
		}
	});
	
	startButton.addEventListener("click", function () {
		if(evaluating && currentExpression !== null){
			return;
		}
		evaluating = true;
		parsing = true;
		closeHelpPanel();
		closeDefinePanel();
		const inputExpression = input.value.trim();
		try{
			if(inputExpression === ""){
				throw new Error("Empty input");
			}
			const lam = parseLambda(inputExpression);
			currentExpression = lam;
			clearBeforeRepresenting();
			readonlyBox.innerHTML = currentExpression.representAsString();
			readonlyBox.scrollTop = readonlyBox.scrollHeight;
		}catch(e){
			readonlyBox.innerHTML = "Parsing error:<br>" + e;
			startButton.classList.add("red");
            setTimeout(() => startButton.classList.remove("red"), 800);
			currentExpression = null;
		}finally{
			evaluating = false;
			parsing = false;
		}
	});
	
	nextButton.addEventListener("click", function () {
		if(currentExpression === null){
			closeHelpPanel();
			closeDefinePanel();
			readonlyBox.innerHTML = "No expression selected!";
			nextButton.classList.add("red");
            setTimeout(() => nextButton.classList.remove("red"), 800);
			evaluating = false;
			readonlyBox.scrollTop = readonlyBox.scrollHeight;
			return;
		}
		
		if(evaluating){
			return;
		}
		closeHelpPanel();
		closeDefinePanel();
		evaluating = true;
		
		reduceOneAsync(currentExpression).then(result => {
			if(currentExpression === result){
				evaluating = false;
				return;
			}
			currentExpression = result;
			clearBeforeRepresenting();
			readonlyBox.innerHTML += " β<br><br>" + currentExpression.representAsString();
			readonlyBox.scrollTop = readonlyBox.scrollHeight;
			evaluating = false;
		});
	});
	
	runButton.addEventListener("click", function () {
		if(currentExpression === null){
			closeHelpPanel();
			closeDefinePanel();
			readonlyBox.innerHTML = "No expression selected!";
			readonlyBox.scrollTop = readonlyBox.scrollHeight;
			runButton.classList.add("red");
            setTimeout(() => runButton.classList.remove("red"), 800);
			evaluating = false;
			return;
		}
		
		if(evaluating){
			return;
		}
		closeHelpPanel();
		closeDefinePanel();
		evaluating = true;
		
		reduceAsyncStepsNonBlocking(
			currentExpression,
			(nextExpr) => {
				currentExpression = nextExpr;
				clearBeforeRepresenting();
				readonlyBox.innerHTML += " β<br><br>" + currentExpression.representAsString();
				readonlyBox.scrollTop = readonlyBox.scrollHeight;
			},
			() => {
				evaluating = false;
				runButton.classList.add("green");
				setTimeout(() => runButton.classList.remove("green"), 1200);
			}
		);
	});
	
	churchToggle.addEventListener("change", function () {
		replaceWithChurch = churchToggle.checked;
	});
	
	openHelpButton.addEventListener("click", function () {
		openHelpPanel();
	});
	
	closeHelpButton.addEventListener("click", function () {
		closeHelpPanel();
	});
	
	openDefineButton.addEventListener("click", function () {
		openDefinePanel();
	});
	
	closeDefineButton.addEventListener("click", function () {
		closeDefinePanel();
	});
	
	addDefineButton.addEventListener("click", function () {
		if(parsing || isThereAnyEmpty()){
			return;
		}
		const p = document.createElement("div");
		p.className = "orangeReadonlyBox definePocket";
		p.innerHTML = `<input type=text class="orangeInput defineName" oninput="ensureOnlyLetters(this);" placeholder="Name"></input>
		<input type=text class="orangeInput defineDef" placeholder="Definition"></input>
		`;
		defineContainer.appendChild(p);
		
		// Force reflow to enable transition
		void p.offsetWidth;
		
		// Add the 'show' class to trigger the animation
		p.classList.add("show");
		
		defineContainer.parentElement.scrollTop = defineContainer.parentElement.scrollHeight;
	});
});

document.addEventListener("keydown", function (e) {
	if (e.key === "Escape"){
		closeHelpPanel();
		closeDefinePanel();
	}
});

function ensureOnlyLetters(v){
	v.value = v.value.replace(/[^a-zA-Z]/g, '');
}

function openHelpPanel(){
	closeDefinePanel();
	helpPanel.style.right = "0px";
	helpPanel.style.opacity = "1";
}

function closeHelpPanel(){
	helpPanel.style.right = (-Math.max(window.innerWidth * 0.45, 510)) + "px";
	setTimeout(() => {helpPanel.style.opacity = "0";}, 300);
}

function openDefinePanel(){
	closeHelpPanel();
	definePanel.style.left = "0px";
	definePanel.style.opacity = "1";
}

function closeDefinePanel(){
	definePanel.style.left = (-Math.max(window.innerWidth * 0.45, 510)) + "px";
	setTimeout(() => {definePanel.style.opacity = "0";}, 300);
}

let evaluating = false;
let parsing = false;
let currentExpression = null;

let counter = 0;
let funcs = [];

function clearBeforeRepresenting(){
	counter = 0;
	funcs = [];
}

function getNextVar(){
	const alphabet = "abcdefghijklmnopqrstuvwxyz";
	let result = "";
	let n = counter++;

	do{
		result = alphabet[n % 26] + result;
		n = Math.floor(n / 26) - 1;
	}while (n >= 0);

	return result;
}

class lambda {
	constructor(expression){
		this.expression = expression;
	}
	
	representAsString(){
		funcs.push(getNextVar());
		const e = this.expression.representAsString();
		const l = funcs.pop();
		return "λ" + l + "." + e;
	}
}

class application {
	constructor(func, argument){
		this.func = func;
		this.argument = argument;
	}
	
	representAsString(){
		return "(" + this.func.representAsString() + " " + this.argument.representAsString() + ")";
	}
}

class variable {
	constructor(index){
		this.index = index;
	}
	
	representAsString(){
		if(funcs.length - 1 - this.index < 0){
			return "U" + (this.index - funcs.length);
		}
		return funcs[funcs.length - 1 - this.index];
	}
}

let doDiagrams = false;
let diagram = null;

async function drawDiagram(expression){
	if(!doDiagrams){
		return;
	}
	
	if(expression === null){
		diagram.innerHTML = "";
		return;
	}
	
	generateLines(expression);
	
	const blob = await toBitmap(hlines, vlines);
	
	const url = URL.createObjectURL(blob);
	const img = document.createElement("img");
    img.src = url;
	img.classList.add("diagramImage");
	
	diagram.innerHTML = "";
    diagram.appendChild(img);
}

function toBitmap(hlin, vlin){
	const width = Math.max(Math.max(...hlin.flatMap(h => [h[1], h[2]])), Math.max(...vlin.map(h => h[0]))) + 1;
    const height = Math.max(Math.max(...vlin.flatMap(h => [h[1], h[2]])), Math.max(...hlin.map(h => h[0]))) + 1;
	
	let bitmap = Array.from({ length: height }, () =>
        new Uint8ClampedArray(width)
    );
	
	for(let i = 0; i < hlin.length; i++){
		for(let x = hlin[i][1]; x <= hlin[i][2]; x++){
			bitmap[hlin[i][0]][x] = 1;
		}
	}
	
	for(let i = 0; i < vlin.length; i++){
		for(let y = vlin[i][1]; y <= vlin[i][2]; y++){
			bitmap[y][vlin[i][0]] = 1;
		}
	}
	
	const img = new ImageData(width, height);
    const data = img.data;
	
    let i2 = 0;
	
    for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            const v = bitmap[y][x] ? 255 : 0;

            data[i2++] = v;   //R
            data[i2++] = v;   //G
            data[i2++] = v;   //B
            data[i2++] = 255; //A
        }
    }

	return new Promise(resolve => {
		const c = document.createElement("canvas");
		c.width = img.width;
		c.height = img.height;
		
		const ctx = c.getContext("2d");
		ctx.putImageData(img, 0, 0);
		
		c.toBlob(blob => resolve(blob), "image/png");
	});
}

let hlines = [];
let vlines = [];

let col = 1;
let fcol = 1;
let row = 1;

function generateLines(expression){
	//Reset
	funcs = [];
	hlines = [];
	vlines = [];
	
	col = 1;
	fcol = 1;
	row = 1;
	
	gen(expression);
	
	vlines = vlines.map(v => v[1] < 0 ? [v[0], 0, v[2]] : v); //No negative coordinates
}

function gen(expression){
	if(expression instanceof lambda){
		const st = col - 1;
		
		row += 2;
		const r = gen(expression.expression);
		row -= 2;
		
		hlines.push([row, st, fcol]);
		col = fcol + 3;
		return r;
	}else if(expression instanceof variable){
		vlines.push([col, row - (expression.index + 1) * 2, row]);
		fcol = col + 1;
		col += 3;
		return row;
	}else if(expression instanceof application){
		const lc = col;
		const lr = gen(expression.func);
		
		const rc = col;
		const rr = gen(expression.argument);
		
		const frow = Math.max(lr, rr);
		
		vlines.push([lc, lr, frow + 2]);
		if(lr > rr){
			vlines.push([rc, rr, lr]);
		}
		
		hlines.push([frow, lc, rc]);
		
		return frow + 2;
	}
}
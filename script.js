import "./astar.js";

const grid = document.getElementById('nodeTable');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const selectAlgorithm = document.getElementById('selectAlgorithm');

startButton.addEventListener("click", startSearch);
resetButton.addEventListener("click", clearGrid);

class Coords {

	constructor(row, col) {
		this.row = row;
		this.col = col;
	}

	equals(other) {
		return this.row == other.row && this.col == other.col;
	}

}

class Matrix {

	constructor() {
		this.matrix = new Array(rows);

		for (let i = 0; i < rows; i++) {
			this.matrix[i] = new Array(cols);
		}
	}

	get(coords) {
		return this.matrix[coords.row][coords.col];
	}

	set(coords, value) {
		this.matrix[coords.row][coords.col] = value;
	}

	get2(row, col) {
		return this.matrix[row][col];
	}

	set2(row, col, value) {
		this.matrix[row][col] = value;
	}

}

let delay = 4;
let executing = false;
let needsClear = false;

let rows = 35, cols = 80;
let nodeMatrix = new Matrix(), visitedMatrix = new Matrix(), wallMatrix = new Matrix();

resetMatrixes();

for (let i = 0; i < rows; i++) {
	let row = document.createElement('tr');
	for (let j = 0; j < cols; j++) {
		let node = document.createElement('td');
		node.classList.add("node");
		(i + j) % 2 == 0 ? node.classList.add("even") : node.classList.add("odd");
		node.addEventListener("mousedown", addWallClassToNode);
		node.addEventListener("mouseover", addWallClassToNode);
		row.appendChild(node);
		nodeMatrix.set2(i, j, node);
	}
	grid.appendChild(row);
}

let startCoords = new Coords(10, 10), endCoords = new Coords(rows - 10, cols - 10);
updateStartAndEndNodes();

function mouseIsPressed(e) {
	let flags = e.buttons !== undefined ? e.buttons : e.which;
	return (flags & 1) === 1;
}

function addWallClassToNode(e) {
	if (!mouseIsPressed(e) || event.target.id == "startNode" || event.target.id == "endNode") return;
	event.target.classList.add("wall");
	wallMatrix.set2(event.target.closest("tr").rowIndex, event.target.cellIndex, 0);
}

function updateStartAndEndNodes() {
	nodeMatrix.get(startCoords).setAttribute("id", "startNode");
	nodeMatrix.get(endCoords).setAttribute("id", "endNode");
}

function resetMatrixes() {
	for (let i = 0; i < rows; i++) {
		visitedMatrix.matrix[i].fill(false);
		wallMatrix.matrix[i].fill(1);
	}
}

async function startSearch() {
	if (needsClear) return;

	executing = true;
	visitedMatrix.set(startCoords, true);

	switch (selectAlgorithm.value) {
		case "bfs":
			await bfs();
			break;
		case "dfs":
			await dfs();
			break;
		case "a*":
			await aStar(astar.heuristics.manhattan);
			break;
		case "a*constant":
			await aStar(astar.heuristics.manhattanConstant);
			break;	
		case "a*cross":
			await aStar(astar.heuristics.manhattanCrossProduct);
			break;
		default:
			alert("Somehow no search algorithm was selected.")
	}

	executing = false;
	needsClear = true;
}

async function bfs() {
	let queue = [startCoords], parent = new Map();

	while (queue.length > 0) {
		let currentCoords = queue.shift();
		nodeMatrix.get(currentCoords).classList.add("expanded");

		if (currentCoords.equals(endCoords)) {
			await drawPath(backtrace(parent, currentCoords));
			break;
		}

		for (let neighborCoords of getNeighborsCoords(currentCoords)) {
			if (!visitedMatrix.get(neighborCoords) &&
				!nodeMatrix.get(neighborCoords).classList.contains("wall")) {
				queue.push(neighborCoords);
				visitedMatrix.set(neighborCoords, true);
				parent.set(neighborCoords, currentCoords);
				nodeMatrix.get(neighborCoords).classList.add("frontier");
			}
		}
		await sleep(delay);
	}
}

async function dfs() {
	let stack = [startCoords], parent = new Map();

	while (stack.length > 0) {
		let currentCoords = stack.pop();
		nodeMatrix.get(currentCoords).classList.add("expanded");

		if (currentCoords.equals(endCoords)) {
			await drawPath(backtrace(parent, currentCoords));
			break;
		}

		for (let neighborCoords of getNeighborsCoords(currentCoords)) {
			if (!visitedMatrix.get(neighborCoords) &&
				!nodeMatrix.get(neighborCoords).classList.contains("wall")) {
				stack.push(neighborCoords);
				visitedMatrix.set(neighborCoords, true);
				parent.set(neighborCoords, currentCoords);
				nodeMatrix.get(neighborCoords).classList.add("frontier");
			}
		}
		await sleep(delay);
	}
}

async function aStar(heuristic) {
	let graph = new Graph(wallMatrix.matrix);
	let start = graph.grid[startCoords.row][startCoords.col];
	let end = graph.grid[endCoords.row][endCoords.col];
	let path = await astar.search(graph, start, end, {heuristic});
	path = Array.from(path, gridNode => new Coords(gridNode.x, gridNode.y));
	await drawPath(path);
}

function getNeighborsCoords(currentCoords) {
	let neighborsCoords = [];
	let row = currentCoords.row, col = currentCoords.col;

	if (row > 0) {
		neighborsCoords.push(new Coords(row - 1, col));
	}
	if (row < rows - 1) {
		neighborsCoords.push(new Coords(row + 1, col));
	}
	if (col > 0) {
		neighborsCoords.push(new Coords(row, col - 1));
	}
	if (col < cols - 1) {
		neighborsCoords.push(new Coords(row, col + 1));
	}

	return neighborsCoords;
}

function clearGrid() {
	if (executing) return;

	for (let row of nodeMatrix.matrix) {
		for (let node of row) {
			node.classList.remove("frontier", "expanded", "wall", "path");
		}
	}

	resetMatrixes();
	needsClear = false;
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function backtrace(parent, lastCoords) {
	let path = [lastCoords];

	while (!path[path.length - 1].equals(startCoords)) {
		path.push(parent.get(path[path.length - 1]));
	}

	return path.reverse();
}

async function drawPath(path) {
	for (let node of path) {
		nodeMatrix.get(node).classList.add("path");
		await sleep(10);
	}
}

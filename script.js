import "./astar.js";
import "./wilsons-algorithm.js";

const grid = document.getElementById('nodeTable');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const selectAlgorithm = document.getElementById('selectAlgorithm');
const generateMazeButton = document.getElementById('generateMazeButton');

startButton.addEventListener("click", startSearch);
resetButton.addEventListener("click", resetGrid);
generateMazeButton.addEventListener("click", generateMaze);

const wallSlider = document.getElementById("wallSlider");
const wallSliderValueDisplay = document.getElementById("wallSliderValueDisplay");
wallSliderValueDisplay.innerHTML = wallSlider.value + "%";
wallSlider.addEventListener("input", updateWallSliderValueDisplay);

function updateWallSliderValueDisplay() {
	wallSliderValueDisplay.innerHTML = this.value + "%";
}

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

let rows = 35, cols = 81;
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

let startCoords = new Coords(1, 1), endCoords = new Coords(rows - 2, cols - 2);
updateStartAndEndNodes();

generateMaze();

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
	let vmm = visitedMatrix.matrix, wmm = wallMatrix.matrix;
	for (let i = 0; i < rows; i++) {
		vmm[i].fill(false);
		wmm[i].fill(1);
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
	let path = await astar.search(graph, start, end, { heuristic });
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

function resetGrid() {
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

function generateMaze() {
	if (executing) return;

	resetGrid();
	let maze = wilsonsAlgorithm(rows, cols);
	removeRandomWalls(maze);
	let wmm = wallMatrix.matrix = maze;
	let nmm = nodeMatrix.matrix;

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			if (wmm[row][col] == 0) {
				nmm[row][col].classList.add("wall");
			}
		}
	}
}

function removeRandomWalls(maze) {
	let amount = wallSlider.value * 10;
	for (let i = 0; i < amount; i++) {
		let c = randCoord(rows, cols);
		maze[c[0]][c[1]] = 1;
		maze[c[0]-1][c[1]] = 1;
		maze[c[0]][c[1]+1] = 1;
		maze[c[0]+1][c[1]] = 1;
		maze[c[0]][c[1]-1] = 1;
	}
}

function randCoord(rows, cols) {
    let c = new Array(2);
    c[0] = Math.floor(Math.random() * (rows - 2) + 1);
    c[1] = Math.floor(Math.random() * (cols - 2) + 1);
    return c;
}

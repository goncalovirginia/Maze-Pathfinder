import "./astar.js";
import "./maze-generation-algorithms/wilsons.js";
import "./maze-generation-algorithms/recursive-division.js";
import "./maze-generation-algorithms/sidewinder.js";
import "./maze-generation-algorithms/prims.js";
import "./maze-generation-algorithms/kruskals.js";
import "./maze-generation-algorithms/hunt-and-kill.js";
import "./maze-generation-algorithms/ellers.js";
import "./maze-generation-algorithms/binary-tree.js";
import "./maze-generation-algorithms/backtracking.js";
import "./maze-generation-algorithms/aldous-broder.js";

const grid = document.getElementById('nodeTable');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const selectPathfindingAlgorithm = document.getElementById('selectPathfindingAlgorithm');
const generateMazeButton = document.getElementById('generateMazeButton');
const selectMazeGenerationAlgorithm = document.getElementById('selectMazeGenerationAlgorithm');
//const expandedNodesDisplay = document.getElementById('expandedNodesDisplay');

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

	toKey() {
		return this.row + " " + this.col;
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
let expandedNodes = 0;

const NODE_PX = 20;
let navbarHeight = document.getElementById('navbar').clientHeight;

let rows = toOdd((window.innerHeight - navbarHeight) / NODE_PX), cols = toOdd((window.innerWidth) / NODE_PX);
let nodeMatrix = new Matrix(), visitedMatrix = new Matrix(), wallMatrix = new Matrix();

function toOdd(number) {
	return Math.floor(number / 2) * 2 - 1;
}
/*
function incrementExpandedNodesDisplay() {
	expandedNodesDisplay.innerHTML = ++expandedNodes;
}

function resetExpandedNodesDisplay() {
	expandedNodesDisplay.innerHTML = expandedNodes = 0;
}
*/

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
	let startImg = document.createElement("img");
	startImg.setAttribute("src", "./icons/start.svg");
	startImg.setAttribute("class", "startNode");
	nodeMatrix.get(startCoords).setAttribute("id", "startNode");
	nodeMatrix.get(startCoords).appendChild(startImg);

	let endImg = document.createElement("img");
	endImg.setAttribute("src", "./icons/end.svg");
	endImg.setAttribute("class", "endNode");
	nodeMatrix.get(endCoords).setAttribute("id", "endNode");
	nodeMatrix.get(endCoords).appendChild(endImg);
}

function resetMatrixes() {
	let vmm = visitedMatrix.matrix, wmm = wallMatrix.matrix;
	for (let i = 0; i < rows; i++) {
		vmm[i].fill(false);
		wmm[i].fill(1);
	}
}

function getMazeGenerationAlgorithm() {
	switch (selectMazeGenerationAlgorithm.value) {
		case "wilsons":
			return wilsons;
		case "binary-tree":
			return binaryTree;
		case "aldous-broder":
			return aldousBroder;
		case "backtracking":
			return backtracking;
		case "ellers":
			return ellers;
		case "hunt-and-kill":
			return huntAndKill;
		case "kruskals":
			return kruskals;
		case "prims":
			return prims;
		case "recursive-division":
			return recursiveDivision;
		case "sidewinder":
			return sidewinder;
		default:
			alert("Somehow no maze generation algorithm was selected.")
	}
}

async function startSearch() {
	if (needsClear) return;

	executing = true;
	visitedMatrix.set(startCoords, true);

	switch (selectPathfindingAlgorithm.value) {
		case "bfs":
			await bfs();
			break;
		case "bibfs":
			await bidirectionalBfs();
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
			alert("Somehow no pathfinding algorithm was selected.")
	}

	executing = false;
	needsClear = true;
}

async function bfs() {
	let queue = [startCoords], parent = new Map();

	while (queue.length > 0) {
		let currentCoords = queue.shift();
		nodeMatrix.get(currentCoords).classList.add("expanded");
		incrementExpandedNodesDisplay();

		if (currentCoords.equals(endCoords)) {
			await drawPath(backtrace(parent, currentCoords));
			break;
		}

		for (let neighborCoords of getNeighborsCoords(currentCoords)) {
			if (!visitedMatrix.get(neighborCoords) && wallMatrix.get(neighborCoords) != 0) {
				queue.push(neighborCoords);
				visitedMatrix.set(neighborCoords, true);
				parent.set(neighborCoords.toKey(), currentCoords);
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
		incrementExpandedNodesDisplay();

		if (currentCoords.equals(endCoords)) {
			await drawPath(backtrace(parent, currentCoords));
			break;
		}

		for (let neighborCoords of getNeighborsCoords(currentCoords)) {
			if (!visitedMatrix.get(neighborCoords) && wallMatrix.get(neighborCoords) != 0) {
				stack.push(neighborCoords);
				visitedMatrix.set(neighborCoords, true);
				parent.set(neighborCoords.toKey(), currentCoords);
				nodeMatrix.get(neighborCoords).classList.add("frontier");
			}
		}
		await sleep(delay);
	}
}

async function bidirectionalBfs() {
	let startQueue = [startCoords], endQueue = [endCoords];
	let startParent = new Map(), endParent = new Map();
	let endVisitedMatrix = new Matrix();
	endVisitedMatrix.set(endCoords, true);
	let startQueueTurn = false;

	while (startQueue.length > 0 || endQueue.length > 0) {
		startQueueTurn = !startQueueTurn;

		if ((startQueueTurn && startQueue.length == 0) || 
			(!startQueueTurn && endQueue.length == 0)) {
			continue;
		}

		let currentCoords = startQueueTurn ? startQueue.shift() : endQueue.shift();
		nodeMatrix.get(currentCoords).classList.add("expanded");
		incrementExpandedNodesDisplay();

		if ((startQueueTurn && endVisitedMatrix.get(currentCoords)) ||
			(!startQueueTurn && visitedMatrix.get(currentCoords))) {
			let startToCurrent = backtrace(startParent, currentCoords);
			let currentToEnd = backtrace(endParent, currentCoords).reverse();
			currentToEnd.shift();
			await drawPath(startToCurrent.concat(currentToEnd));
			break;
		}

		let currQueue = startQueue;
		let currVisitedMatrix = visitedMatrix;
		let currParent = startParent;

		if (!startQueueTurn) {
			currQueue = endQueue;
			currVisitedMatrix = endVisitedMatrix;
			currParent = endParent;
		}

		for (let neighborCoords of getNeighborsCoords(currentCoords)) {
			if (!currVisitedMatrix.get(neighborCoords) && wallMatrix.get(neighborCoords) != 0) {
				currQueue.push(neighborCoords);
				currVisitedMatrix.set(neighborCoords, true);
				currParent.set(neighborCoords.toKey(), currentCoords);
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
	if (path.length > 0) path.unshift(startCoords);
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
	//resetExpandedNodesDisplay();
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function backtrace(parent, lastCoords) {
	let path = [lastCoords], p;

	while ((p = parent.get(path[path.length - 1].toKey())) != undefined) {
		path.push(p);
	}

	path.push(startCoords);

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
	let mazeGenerationAlgorithm = getMazeGenerationAlgorithm();
	let maze = mazeGenerationAlgorithm(rows, cols);
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
	let amount = (wallSlider.value * rows * cols) / 200;
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

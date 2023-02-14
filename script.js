const grid = document.getElementById('nodeTable');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');

startButton.addEventListener("click", startSearch);
resetButton.addEventListener("click", clearGrid);

document.addEventListener("mousedown", setMouseIsPressed);
document.addEventListener("mousemove", setMouseIsPressed);
document.addEventListener("mouseup", setMouseIsPressed);

class Coords {

	constructor(row, col) {
		this.row = row;
		this.col = col;
	}

	equals(other) {
		return this.row == other.row && this.col == other.col;
	}

}

let mouseIsPressed = false;

let delay = 4;
let executing = false;

let rows = 20, cols = 40;
let nodeMatrix = new Array(rows), visitedMatrix = new Array(rows);

let selectedAlgorithm = "bfs";

for (let i = 0; i < rows; i++) {
	nodeMatrix[i] = new Array(cols);
	visitedMatrix[i] = new Array(cols);
}

for (let i = 0; i < rows; i++) {
	let row = document.createElement('tr');
	for (let j = 0; j < cols; j++) {
		let node = document.createElement('td');
		node.setAttribute("class", "node");
		node.addEventListener("mouseover", addWallClassToNode);
		row.appendChild(node);
		nodeMatrix[i][j] = node;
	}
	grid.appendChild(row);
}

let startCoords = new Coords(10, 10), endCoords = new Coords(rows-2, cols-2);
updateStartAndEndNodes();

function setMouseIsPressed(e) {
	var flags = e.buttons !== undefined ? e.buttons : e.which;
	mouseIsPressed = (flags & 1) === 1;
}

function addWallClassToNode() {
	if (!mouseIsPressed || event.target.id == "startNode" || event.target.id == "endNode") return;
	event.target.classList.add("wall");
}

function updateStartAndEndNodes() {
	nodeMatrix[startCoords.row][startCoords.col].setAttribute("id", "startNode");
	nodeMatrix[endCoords.row][endCoords.col].setAttribute("id", "endNode");
}

function resetVisitedMatrix() {
	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			visitedMatrix[i][j] = false;
		}
	}
}

function startSearch() {
	executing = true;
	switch (selectedAlgorithm) {
		case "bfs":
			bfs();
			break;
		default:
			alert("Somehow no search algorithm was selected.")
	}
}

async function bfs() {
	resetVisitedMatrix();
	let queue = [startCoords];
	visitedMatrix[startCoords.row][startCoords.col] = true;

	while (queue.length > 0) {
		let currentCoords = queue.shift();

		if (currentCoords.equals(endCoords)) {
			executing = false;
			alert("Found the end node!");
			return;
		}

		for (let neighborCoords of getNeighborsCoords(currentCoords)) {
			if (!visitedMatrix[neighborCoords.row][neighborCoords.col] &&
				!nodeMatrix[neighborCoords.row][neighborCoords.col].classList.contains("wall")) {
				queue.push(neighborCoords);
				nodeMatrix[neighborCoords.row][neighborCoords.col].classList.add("visited");
				visitedMatrix[neighborCoords.row][neighborCoords.col] = true;
			}
		}
		await sleep(delay);
	}
	executing = false;
	alert("Impossible to reach the end node!");
}

function getNeighborsCoords(currentCoords) {
	let neighborsCoords = [];
	let row = currentCoords.row, col = currentCoords.col;

	if (row > 0) {
		neighborsCoords.push(new Coords(row-1, col));
	}
	if (row < rows-1) {
		neighborsCoords.push(new Coords(row+1, col));
	}
	if (col > 0) {
		neighborsCoords.push(new Coords(row, col-1));
	}
	if (col < cols-1) {
		neighborsCoords.push(new Coords(row, col+1));
	}

	return neighborsCoords;
}

function clearGrid() {
	if (executing) return;

	for (let row of nodeMatrix) {
		for (let node of row) {
			node.classList.remove('visited');
			node.classList.remove('wall');
		}
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
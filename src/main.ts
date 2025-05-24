import "./style.css";
import Game from "./Game";

window.onerror = (message, source, lineno, colno, _error) => {
  showErrorOverlay(`Error: ${message}\nFile: ${source}:${lineno}:${colno}`);
};

window.onunhandledrejection = (event) => {
  showErrorOverlay(`Unhandled Promise Rejection: ${event.reason}`);
};

new Game().start();

// Temporary
function showErrorOverlay(message: string) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
  overlay.style.color = "white";
  overlay.style.fontFamily = "monospace";
  overlay.style.padding = "20px";
  overlay.style.zIndex = "10000";
  overlay.style.whiteSpace = "pre-wrap";
  overlay.textContent = message;

  document.body.appendChild(overlay);
}

// function mergePlants() { //TODO
//     const mergeArea = document.getElementById('mergeArea');
//
//     if (gameState.mergePlants.length === 2) {
//         const plant1 = gameState.mergePlants[0];
//         const plant2 = gameState.mergePlants[1];
//
//         if (plant1.type === plant2.type) {
//             gameState.plants.splice(gameState.plants.indexOf(plant1), 1);
//             gameState.plants.splice(gameState.plants.indexOf(plant2), 1);
//
//             let newType;
//             if (plant1.type === 'peashooter') {
//                 newType = 'peashooter2';
//             } else if (plant1.type === 'peashooter2') {
//                 newType = 'peashooter3';
//             } else {
//                 newType = plant1.type;
//             }
//
//             const rect = mergeArea.getBoundingClientRect();
//             const centerX = rect.left + rect.width / 2;
//             const centerY = rect.top + rect.height / 2;
//             const gridPos = getGridPosition(centerX, centerY);
//
//             if (gridPos && !isGridPositionOccupied(gridPos.row, gridPos.col)) {
//                 addPlant(newType, gridPos.row, gridPos.col);
//             } else {
//                 for (let row = 0; row < gameState.grid.rows; row++) {
//                     for (let col = 0; col < gameState.grid.cols; col++) {
//                         if (!isGridPositionOccupied(row, col)) {
//                             addPlant(newType, row, col);
//                             break;
//                         }
//                     }
//                 }
//             }
//         }
//     }
//
//     gameState.mergePlants = [];
//     mergeArea.style.display = 'none';
// }

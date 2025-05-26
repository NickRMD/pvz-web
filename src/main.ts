import "./style.css";
import Game from "./Game";
import ErrorOverlay from "./ErrorOverlay";

const game = new Game();

game.start();
new ErrorOverlay(game);

if (import.meta.env.DEV) {
  const modules = import.meta.glob("./utils/debug/**/*.ts");

  for (const path in modules) {
    await modules[path]();
  }

  console.log("Loaded debug tools");
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

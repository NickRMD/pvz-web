const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const grassWidth = canvas.width * 0.8;
const zombieAreaWidth = canvas.width * 0.2;


const ost1 = new Audio('assets/ost_1.m4a');
const ost2 = new Audio('assets/ost_menu.m4a');

function playStartSound() {
    ost1.play().catch(err => console.error('Erro ao tocar o som:', err));
    if (ost1.ended || ost1.paused || ost1.currentTime === ost1.duration) {
        ost1.currentTime = 0;
        ost2.play();
    }
}

class GameState {
    constructor() {
        this.sun = 50;
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.selectedPlant = null;
        this.draggingPlant = null;
        this.mergePlants = [];
        this.lastZombieTime = 0;
        this.zombieInterval = 5000;
        this.lastSunTime = 0;
        this.sunInterval = 5000;
        this.grid = {
            rows: 5,
            cols: 9,
            cellWidth: grassWidth / 9,
            cellHeight: canvas.height / 5,
            offsetX: 0, 
            offsetY: 0 
        };
        this.assetsLoaded = 0;
        this.totalAssets = Object.keys(sprites).length;
        this.gameOver = false;
        this.paused = false;
        this.level = 1;
        this.waveCount = 0;
    }
    
    reset() {
        this.sun = 50;
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.lastZombieTime = 0;
        this.zombieInterval = 5000;
        this.gameOver = false;
        this.waveCount = 0;
        this.level = 1;
    }
}

class CollisionSystem {
    constructor() {
        this.grid = {};
    }
    
    update(entities) {
        this.grid = {};
        entities.forEach(entity => {
            const gridX = Math.floor(entity.x / 50);
            const gridY = Math.floor(entity.y / 50);
            const key = `${gridX},${gridY}`;
            
            if (!this.grid[key]) this.grid[key] = [];
            this.grid[key].push(entity);
        });
    }
    
    getNearby(x, y, radius) {
        const results = [];
        const gridX = Math.floor(x / 50);
        const gridY = Math.floor(y / 50);
        
        for (let i = gridX - 1; i <= gridX + 1; i++) {
            for (let j = gridY - 1; j <= gridY + 1; j++) {
                const key = `${i},${j}`;
                if (this.grid[key]) {
                    results.push(...this.grid[key]);
                }
            }
        }
        
        return results.filter(entity => {
            const dx = entity.x - x;
            const dy = entity.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= radius;
        });
    }
}

class WaveSystem {
    constructor() {
        this.waves = [];
        this.currentWave = 0;
        this.zombiesSpawned = 0;
        this.zombiesInWave = 0;
        this.waveCooldown = 30000;
        this.lastWaveTime = 0;
        this.waveActive = false;
        this.initializeWaves();
    }
    
    initializeWaves() {
        this.waves = [
            { zombies: 5, types: ['basic'], interval: 3000 },
            { zombies: 8, types: ['basic', 'cone'], interval: 2500 },
            { zombies: 12, types: ['basic', 'cone', 'bucket'], interval: 2000 },
            { zombies: 15, types: ['basic', 'cone', 'bucket'], interval: 1500 },
            { zombies: 20, types: ['basic', 'cone', 'bucket'], interval: 1000 }
        ];
    }
    
    update(timestamp) {
        if (gameState.gameOver || gameState.paused) return;
        
        if (!this.waveActive && timestamp - this.lastWaveTime > this.waveCooldown) {
            this.startNextWave(timestamp);
        }
        
        if (this.waveActive && this.zombiesSpawned < this.zombiesInWave) {
            if (timestamp - this.lastWaveTime > this.waves[this.currentWave].interval) {
                this.spawnZombie();
                this.lastWaveTime = timestamp;
                this.zombiesSpawned++;
                
                if (this.zombiesSpawned >= this.zombiesInWave) {
                    this.endWave();
                }
            }
        }
    }
    
    startNextWave(timestamp) {
        if (this.currentWave >= this.waves.length) {
            this.currentWave = 0;
            gameState.level++;
            this.increaseDifficulty();
        }
        
        this.waveActive = true;
        this.zombiesSpawned = 0;
        this.zombiesInWave = this.waves[this.currentWave].zombies + Math.floor(gameState.level / 2);
        this.lastWaveTime = timestamp;
        
        console.log(`Wave ${this.currentWave + 1} iniciada! Nível ${gameState.level}`);
    }
    
    endWave() {
        this.waveActive = false;
        this.lastWaveTime = performance.now();
        this.currentWave++;
        gameState.waveCount++;
        
        console.log(`Wave completada! Próxima wave em ${this.waveCooldown/1000} segundos.`);
    }
    
    spawnZombie() {
        const wave = this.waves[this.currentWave % this.waves.length];
        const zombieType = wave.types[Math.floor(Math.random() * wave.types.length)];
        const row = Math.floor(Math.random() * gameState.grid.rows);
        addZombie(row, zombieType);
    }
    
    increaseDifficulty() {
        this.waveCooldown = Math.max(10000, this.waveCooldown - 2000);
        this.waves.forEach(wave => {
            wave.interval = Math.max(1000, wave.interval - 200);
        });
    }
}


class Plant {
    constructor(type, row, col) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.health = plantTypes[type].health;
        this.maxHealth = plantTypes[type].health;
        this.lastActionTime = 0;
        Object.assign(this, plantTypes[type]);
        this.x = gameState.grid.offsetX + col * gameState.grid.cellWidth + gameState.grid.cellWidth / 2;
        this.y = gameState.grid.offsetY + row * gameState.grid.cellHeight + gameState.grid.cellHeight / 2;
    }
    
    update(timestamp) {
        
    }
    
    draw(ctx) {
        if (this.sprite.complete) {
            const aspectRatio = this.sprite.width / this.sprite.height;
            const width = this.width;
            const height = this.width / aspectRatio; 
    
            ctx.drawImage(
                this.sprite,
                this.x - width / 2,
                this.y - height / 2,
                width,
                height,
            );
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
            ctx.fill();
        }
    
        // Barra de saúde
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.2 ? '#FFC107' : '#F44336';
        ctx.fillRect(
            this.x - 25, 
            this.y + 35, 
            50 * healthPercent, 
            5
        );
    }
}

class Sunflower extends Plant {
    update(timestamp) {
        if (timestamp - this.lastActionTime > this.sunProductionTime) {
            produceSun(this.x, this.y);
            this.lastActionTime = timestamp;
        }
    }
}

class Shooter extends Plant {
    update(timestamp) {
        if (timestamp - this.lastActionTime > this.attackSpeed) {
            const zombieInRow = gameState.zombies.find(z => 
                z.row === this.row && 
                z.x > this.col * gameState.grid.cellWidth &&
                z.x >= gameState.grid.offsetX &&
                z.x <= gameState.grid.offsetX + gameState.grid.cols * gameState.grid.cellWidth
            );
            
            if (zombieInRow) {
                shootProjectile(this, zombieInRow);
                this.lastActionTime = timestamp;
            }
        }
    }
}

class WallNut extends Plant {
    // Planta defensiva sem ataque
}

class Projectile {
    constructor(x, y, targetX, targetY, damage, speed, type = 'basic') {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.damage = damage;
        this.speed = speed;
        this.type = type;
        this.reached = false;
        this.width = 20;
        this.height = 20;
        this.angle = Math.atan2(targetY - y, targetX - x);
    }
    
    update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.speed) {
            this.reached = true;
            this.hitTarget();
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }
    
    hitTarget() {
        gameState.zombies.forEach(zombie => {
            const dx = this.x - zombie.x;
            const dy = this.y - (gameState.grid.offsetY + zombie.row * gameState.grid.cellHeight + gameState.grid.cellHeight / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.width / 2 + zombie.width / 2) {
                zombie.health -= this.damage;
                if (zombie.health <= 0) {
                    gameState.zombies.splice(gameState.zombies.indexOf(zombie), 1);
                    updateUI();
                }
                this.reached = true; 
            }
        });
    }
    
    draw(ctx) {
        if (sprites.projectile.complete) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.drawImage(
                sprites.projectile,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
            ctx.restore();
        } else {
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Sun {
    constructor(x, y, collected = false) {
        this.x = x;
        this.y = y;
        this.targetY = y;
        this.width = 40;
        this.height = 40;
        this.speed = 1;
        this.collected = collected;
        this.value = 50;
        this.lifetime = 10000;
        this.spawnTime = performance.now();
    }
    
    update() {
        if (!this.collected && this.y < this.targetY) {
            this.y += this.speed;
        }
        
        if (!this.collected && performance.now() - this.spawnTime > this.lifetime) {
            return false;
        }
        
        return true;
    }
    
    draw(ctx) {
        if (sprites.sun.complete) {
            ctx.drawImage(
                sprites.sun,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

const sprites = {
    sunflower: new Image(),
    peashooter: new Image(),
    peashooter2: new Image(),
    peashooter3: new Image(),
    walnut: new Image(),
    zombie: new Image(),
    projectile: new Image(),
    sun: new Image(),
    zombieCone: new Image(),
    zombieBucket: new Image()
};

sprites.sunflower.src = 'assets/sunflower.webp';
sprites.peashooter.src = 'assets/peashooter.webp'; 
sprites.sun.src = '/assets/sun.webp'; 
sprites.projectile.src = '/assets/pea.webp';
sprites.peashooter2.src = '/assets/pea.webp';
sprites.peashooter3.src = '/assets/pea.webp';
sprites.walnut.src = '/assets/wallnut.webp';
sprites.zombie.src = '/assets/zombie_basic.webp';
sprites.zombieCone.src = '/assets/zombie_cone.webp';
sprites.zombieBucket.src = '/assets/zombie_bucket.webp';

const plantTypes = {
    sunflower: {
        sprite: sprites.sunflower,
        cost: 50,
        health: 100,
        recharge: 10,
        sunProduction: 45,
        sunProductionTime: 15000,
        color: '#FFD700',
        width: 50,
        height: 50
    },
    peashooter: {
        sprite: sprites.peashooter,
        cost: 100,
        health: 150,
        recharge: 5,
        damage: 20,
        range: 300,
        attackSpeed: 2000,
        color: '#4CAF50',
        width: 50,
        height: 50
    },
    walnut: {
        sprite: sprites.walnut,
        cost: 50,
        health: 400,
        recharge: 20,
        color: '#8B4513',
        width: 50,
        height: 50
    },
    peashooter2: {
        sprite: sprites.peashooter2,
        cost: 0,
        health: 200,
        recharge: 3,
        damage: 30,
        range: 350,
        attackSpeed: 1500,
        color: '#2E8B57',
        width: 50,
        height: 50
    },
    peashooter3: {
        sprite: sprites.peashooter3,
        cost: 0,
        health: 300,
        recharge: 2,
        damage: 50,
        range: 400,
        attackSpeed: 1000,
        color: '#006400',
        width: 50,
        height: 50
    }
};

const zombieTypes = {
    basic: { 
        health: 100, 
        speed: 0.5, 
        damage: 0.5, 
        sprite: sprites.zombie,
        color: '#607D8B', 
        width: 40, 
        height: 80 
    },
    cone: { 
        health: 200, 
        speed: 0.4, 
        damage: 0.5, 
        sprite: sprites.zombieCone,
        color: '#FF9800', 
        width: 45, 
        height: 85 
    },
    bucket: { 
        health: 300, 
        speed: 0.3, 
        damage: 1, 
        sprite: sprites.zombieBucket,
        color: '#9E9E9E', 
        width: 50, 
        height: 90 
    }
};

const gameState = new GameState();
const collisionSystem = new CollisionSystem();
const waveSystem = new WaveSystem();

function updateUI() {
    document.getElementById('sunCount').textContent = gameState.sun;
    document.getElementById('zombieCount').textContent = gameState.zombies.length;
    document.getElementById('waveCount').textContent = gameState.waveCount;
    document.getElementById('levelCount').textContent = gameState.level;
}

function drawGrid() {
    const { rows, cols, cellWidth, cellHeight, offsetX, offsetY } = gameState.grid;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = offsetX + col * cellWidth;
            const y = offsetY + row * cellHeight;

            ctx.fillStyle = (row + col) % 2 === 0 ? '#8ed04b' : '#7fbf3b'
            ctx.fillRect(x, y, cellWidth, cellHeight);
        }
    }
}

function getGridPosition(x, y) {
    const col = Math.floor((x - gameState.grid.offsetX) / gameState.grid.cellWidth);
    const row = Math.floor((y - gameState.grid.offsetY) / gameState.grid.cellHeight);
    
    if (row >= 0 && row < gameState.grid.rows && col >= 0 && col < gameState.grid.cols) {
        return {
            row,
            col,
            x: gameState.grid.offsetX + col * gameState.grid.cellWidth,
            y: gameState.grid.offsetY + row * gameState.grid.cellHeight
        };
    }
    return null;
}

function isGridPositionOccupied(row, col) {
    return gameState.plants.some(plant => plant.row === row && plant.col === col);
}

function addPlant(type, row, col) {
    let plant;
    
    switch(type) {
        case 'sunflower':
            plant = new Sunflower(type, row, col);
            break;
        case 'peashooter':
        case 'peashooter2':
        case 'peashooter3':
            plant = new Shooter(type, row, col);
            break;
        case 'walnut':
            plant = new WallNut(type, row, col);
            break;
        default:
            plant = new Plant(type, row, col);
    }
    
    gameState.plants.push(plant);
    return plant;
}

function addZombie(row, type = 'basic') {
    const zombie = {
        row,
        x: grassWidth + zombieAreaWidth, 
        type,
        ...zombieTypes[type],
        maxHealth: zombieTypes[type].health
    };

    gameState.zombies.push(zombie);
    updateUI();
    return zombie;
}

function drawZombie(zombie) {
    const y = gameState.grid.offsetY + zombie.row * gameState.grid.cellHeight + gameState.grid.cellHeight / 2;

    if (zombie.sprite && zombie.sprite.complete) {
        const aspectRatio = zombie.sprite.width / zombie.sprite.height;
        const width = zombie.width;
        const height = zombie.width / aspectRatio;

        ctx.drawImage(
            zombie.sprite,
            zombie.x - width / 2,
            y - height / 2,
            width,
            height
        );
    } else {
        ctx.fillStyle = zombie.color;
        ctx.beginPath();
        ctx.arc(zombie.x, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    const healthPercent = zombie.health / zombie.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.2 ? '#FFC107' : '#F44336';
    ctx.fillRect(
        zombie.x - 20, 
        y - zombie.height / 2 - 10, 
        40 * healthPercent, 
        5
    );
}

function shootProjectile(plant, zombie) {
    const projectile = new Projectile(
        plant.x,
        plant.y,
        zombie.x,
        gameState.grid.offsetY + zombie.row * gameState.grid.cellHeight + gameState.grid.cellHeight / 2,
        plant.damage,
        5
    );
    
    gameState.projectiles.push(projectile);
}

function produceSun(x, y) {
    const sun = new Sun(x, y);
    sun.targetY = y + 100;
    gameState.suns.push(sun);
    return sun;
}

function generateRandomSun() {
    const sun = new Sun(
        Math.random() * (canvas.width - 100) + 50,
        0
    );
    sun.targetY = Math.random() * (canvas.height - 200) + 100;
    gameState.suns.push(sun);
    return sun;
}

function gameOver() {
    gameState.gameOver = true;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Você sobreviveu a ${gameState.waveCount} waves`, canvas.width / 2, canvas.height / 2 + 50);
    
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 100, 200, 50);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Jogar Novamente', canvas.width / 2, canvas.height / 2 + 130);
    
    canvas.addEventListener('click', handleRestartClick, { once: true });
}

function handleRestartClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x >= canvas.width / 2 - 100 && x <= canvas.width / 2 + 100 &&
        y >= canvas.height / 2 + 100 && y <= canvas.height / 2 + 150) {
        resetGame();
    }
}

function resetGame() {
    gameState.reset();
    waveSystem.currentWave = 0;
    waveSystem.zombiesSpawned = 0;
    waveSystem.waveActive = false;
    waveSystem.lastWaveTime = 0;
    
    updateUI();
    requestAnimationFrame(gameLoop);
}


function drawBackground() {
    ctx.fillStyle = '#7CFC0000';
    ctx.fillRect(0, 0, grassWidth, canvas.height);

    ctx.fillStyle = '#7CFC0000'; 
    ctx.fillRect(grassWidth, 0, zombieAreaWidth, canvas.height);
}

// Loop principal do jogo
function gameLoop(timestamp) {
    if (gameState.gameOver) return;
    if (gameState.paused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    
    collisionSystem.update([...gameState.zombies, ...gameState.plants]);
    waveSystem.update(timestamp);
    
    drawGrid();
    
    gameState.plants.forEach(plant => plant.update(timestamp));
    gameState.plants.forEach(plant => plant.draw(ctx));
    
    gameState.projectiles = gameState.projectiles.filter(proj => {
        proj.update();
        proj.draw(ctx);
        return !proj.reached;
    });
    
    gameState.zombies.forEach(zombie => {
        zombie.x -= zombie.speed;
        
        const gridPos = getGridPosition(zombie.x, gameState.grid.offsetY + zombie.row * gameState.grid.cellHeight);
        if (gridPos) {
            const plant = gameState.plants.find(p => p.row === gridPos.row && p.col === gridPos.col);
            if(!plant) {
                zombie.speed = 0.5
            }
            if (plant) {
                zombie.speed = 0
                plant.health -= zombie.damage;
                if (plant.health <= 0) {
                    gameState.plants.splice(gameState.plants.indexOf(plant), 1);
                    zombie.speed = 0.5
                }
            }
        }
        
        if (zombie.x < gameState.grid.offsetX) {
            gameOver();
            return;
        }
    });
    
    gameState.zombies.forEach(zombie => drawZombie(zombie));

    if (gameState.suns) {
        gameState.suns = gameState.suns.filter(sun => sun.update());
        gameState.suns.forEach(sun => sun.draw(ctx));
    }

    if (timestamp - gameState.lastSunTime > gameState.sunInterval) {
        generateRandomSun();
        gameState.lastSunTime = timestamp;
    }
    
    requestAnimationFrame(gameLoop);
}

document.querySelectorAll('.plant-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
        if (gameState.gameOver || gameState.paused) return;
        
        const plantType = e.currentTarget.getAttribute('data-plant');
        const cost = parseInt(e.currentTarget.getAttribute('data-cost'));
        
        if (gameState.sun >= cost) {
            gameState.draggingPlant = {
                type: plantType,
                cost: cost,
                element: e.currentTarget
            };
            e.currentTarget.style.opacity = '0.5';

            const preview = document.getElementById('plantPreview');
            preview.style.display = 'block';
            preview.style.backgroundImage = `url('${plantTypes[plantType].sprite.src}')`;
        }
    });
});

document.addEventListener('mousemove', (e) => {
    if (gameState.draggingPlant) {
        const preview = document.getElementById('plantPreview');
        preview.style.left = `${e.clientX - 25}px`;
        preview.style.top = `${e.clientY - 25}px`;
    }
});

document.addEventListener('mouseup', (e) => {
    const preview = document.getElementById('plantPreview');
    preview.style.display = 'none';
    
    if (gameState.draggingPlant) {
        gameState.draggingPlant.element.style.opacity = '1';
        
        const gridPos = getGridPosition(e.clientX, e.clientY);
        if (gridPos && !isGridPositionOccupied(gridPos.row, gridPos.col)) {
            gameState.sun -= gameState.draggingPlant.cost;
            addPlant(gameState.draggingPlant.type, gridPos.row, gridPos.col);
            updateUI();
        }
        
        gameState.draggingPlant = null;
    }
});

canvas.addEventListener('click', (e) => {
    if (gameState.gameOver || gameState.paused) return;
    
    if (gameState.suns) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        for (let i = gameState.suns.length - 1; i >= 0; i--) {
            const sun = gameState.suns[i];
            const distance = Math.sqrt(Math.pow(clickX - sun.x, 2) + Math.pow(clickY - sun.y, 2));
            
            if (distance < 30 && !sun.collected) {
                sun.collected = true;
                gameState.sun += sun.value;
                updateUI();
                
                const sunEffect = document.createElement('div');
                sunEffect.className = 'sun-effect';
                sunEffect.style.left = `${clickX - 15}px`;
                sunEffect.style.top = `${clickY - 15}px`;
                document.body.appendChild(sunEffect);
                
                setTimeout(() => {
                    document.body.removeChild(sunEffect);
                }, 1000);
                
                gameState.suns.splice(i, 1);
                break;
            }
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        gameState.paused = !gameState.paused;
        document.getElementById('pauseMenu').style.display = gameState.paused ? 'flex' : 'none';
    }
    
    // Sistema de fusão de plantas (tecla M) a fazer
    if (e.key === 'm' && !gameState.paused && !gameState.gameOver) {
        document.getElementById('mergeArea').style.display = 'flex';
    }

    if (e.key === 'Enter' && gameState.mergePlants.length === 2) {
        mergePlants();
    }

    if (e.key === '1') {
        const plant = gameState.plants[0];
        const cost = plantTypes[plant.type].cost;


        if (gameState.sun >= cost) {
            gameState.draggingPlant = {
                type: plant.type,
                cost: cost,
                element: document.querySelector(`[data-plant="${plant.type}"]`)
            };
            gameState.draggingPlant.element.style.opacity = '0.5';
            document.getElementById('mergeArea').style.display = 'none';
        }
    } else if (e.key === '2') {
        gameState.mergePlants.push(gameState.plants[1]);
        document.getElementById('mergeArea').style.display = 'none';
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'm') {
        mergePlants();
    }
});

function mergePlants() { //TODO
    const mergeArea = document.getElementById('mergeArea');
    
    if (gameState.mergePlants.length === 2) {
        const plant1 = gameState.mergePlants[0];
        const plant2 = gameState.mergePlants[1];
        
        if (plant1.type === plant2.type) {
            gameState.plants.splice(gameState.plants.indexOf(plant1), 1);
            gameState.plants.splice(gameState.plants.indexOf(plant2), 1);
            
            let newType;
            if (plant1.type === 'peashooter') {
                newType = 'peashooter2';
            } else if (plant1.type === 'peashooter2') {
                newType = 'peashooter3';
            } else {
                newType = plant1.type;
            }
            
            const rect = mergeArea.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const gridPos = getGridPosition(centerX, centerY);
            
            if (gridPos && !isGridPositionOccupied(gridPos.row, gridPos.col)) {
                addPlant(newType, gridPos.row, gridPos.col);
            } else {
                for (let row = 0; row < gameState.grid.rows; row++) {
                    for (let col = 0; col < gameState.grid.cols; col++) {
                        if (!isGridPositionOccupied(row, col)) {
                            addPlant(newType, row, col);
                            break;
                        }
                    }
                }
            }
        }
    }
    
    gameState.mergePlants = [];
    mergeArea.style.display = 'none';
}

function checkAssetsLoaded() {
    gameState.assetsLoaded++;
    if (gameState.assetsLoaded === gameState.totalAssets) {
        document.getElementById('loading').style.display = 'none';
        updateUI();
        playStartSound();
        requestAnimationFrame(gameLoop);
    }
}

Object.values(sprites).forEach(sprite => {
    sprite.onload = checkAssetsLoaded;
    sprite.onerror = () => {
        console.error('Erro ao carregar sprite:', sprite.src);
        checkAssetsLoaded();
    };
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

updateUI();
drawGrid();
// --- THREE.JS 3D Game Setup ---
const container = document.getElementById('gameContainer');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a252f);
scene.fog = new THREE.Fog(0x1a252f, 200, 500);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 40, 50);
camera.lookAt(0, 0, 0);

// Camera rotation control
let cameraAngle = 0;
let cameraDistance = 50;
let cameraHeight = 40;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
renderer.shadowMap.resolution = 2048;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(60, 60, 60);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.far = 200;
scene.add(directionalLight);

// Game Variables
let gameRunning = false;
let lives = 20;
let money = 175;
let wave = 1;
let selectedTowerType = null;
let gameTime = 0;
let clickListener = null;
let mouseX = 0;
let mouseY = 0;
let previewTowerRange = null;

let isWaveActive = false;
let wavePreviewShown = false;
let enemiesToSpawnTotal = 0;
let enemiesSpawnedCount = 0;

let towers = [];
let enemies = [];
let projectiles = [];
let particles = [];

let damageStats = {
    basic: 0,
    ice: 0,
    poison: 0,
    sniper: 0,
    tesla: 0,
    laser: 0,
    rocket: 0,
    support: 0,
    total: 0
};

let spawnTimer = 0;
let waveEnemyCount = 0;
let waveEnemyTotal = 10 + (wave * 2);
let pathLine = null;
let hoveredTower = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isDragging = false;
let dragStartX = 0;

// Grid system
const GRID_SIZE = 2; // 2x2 units per cell
const MAP_WIDTH = 70;
const MAP_HEIGHT = 70;
const GRID_COLS = Math.floor(MAP_WIDTH / GRID_SIZE);
const GRID_ROWS = Math.floor(MAP_HEIGHT / GRID_SIZE);
let placedTiles = {}; // Track which grid cells are occupied

// Path waypoints for enemies
let pathWaypoints = [];

function drawPath() {
    pathWaypoints = [
        new THREE.Vector3(-30, 0.1, 0),
        new THREE.Vector3(-20, 0.1, 0),
        new THREE.Vector3(-20, 0.1, 8),
        new THREE.Vector3(-5, 0.1, 8),
        new THREE.Vector3(-5, 0.1, -8),
        new THREE.Vector3(10, 0.1, -8),
        new THREE.Vector3(10, 0.1, 8),
        new THREE.Vector3(25, 0.1, 8),
        new THREE.Vector3(25, 0.1, -5),
        new THREE.Vector3(30, 0.1, -5)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(pathWaypoints);
    const material = new THREE.LineBasicMaterial({ color: 0xfff900, linewidth: 3 });
    pathLine = new THREE.Line(geometry, material);
    scene.add(pathLine);
}

// Get position on path based on progress (0 to 1)
function getPathPosition(progress) {
    if (pathWaypoints.length === 0) return new THREE.Vector3(-30, 0.1, 0);
    
    const totalDistance = calculatePathLength();
    const targetDistance = totalDistance * Math.min(1, Math.max(0, progress));
    
    let currentDistance = 0;
    for (let i = 0; i < pathWaypoints.length - 1; i++) {
        const p1 = pathWaypoints[i];
        const p2 = pathWaypoints[i + 1];
        const segmentLength = p1.distanceTo(p2);
        
        if (currentDistance + segmentLength >= targetDistance) {
            const ratio = (targetDistance - currentDistance) / segmentLength;
            const pos = new THREE.Vector3();
            pos.lerpVectors(p1, p2, ratio);
            return pos;
        }
        currentDistance += segmentLength;
    }
    
    return pathWaypoints[pathWaypoints.length - 1].clone();
}

// Calculate total path length
function calculatePathLength() {
    let length = 0;
    for (let i = 0; i < pathWaypoints.length - 1; i++) {
        length += pathWaypoints[i].distanceTo(pathWaypoints[i + 1]);
    }
    return length;
}

// --- Particle System ---
class Particle3D {
    constructor(x, y, z, color, velocity) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = velocity;
        this.life = 1.0;
        
        const geometry = new THREE.SphereGeometry(0.08, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
    }
    
    update() {
        this.velocity.y -= 0.002;
        this.position.add(this.velocity);
        this.mesh.position.copy(this.position);
        this.life -= 0.02;
        this.mesh.material.opacity = this.life;
        
        return this.life > 0;
    }
    
    dispose() {
        scene.remove(this.mesh);
    }
}

function createExplosion(x, y, z, color = 0xffa500, count = 20) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 0.1 + Math.random() * 0.1;
        const velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.random() * 0.2,
            Math.sin(angle) * speed
        );
        particles.push(new Particle3D(x, y, z, color, velocity));
    }
}

// --- Create Castle ---
function createCastle(x, z, color) {
    // Base
    const baseGeometry = new THREE.BoxGeometry(2, 1, 2);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: color });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, 0.5, z);
    base.castShadow = true;
    scene.add(base);
    
    // Towers
    const towerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    const towerMaterial = new THREE.MeshStandardMaterial({ color: color });
    
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const offsetX = Math.cos(angle) * 0.8;
        const offsetZ = Math.sin(angle) * 0.8;
        
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(x + offsetX, 1.5, z + offsetZ);
        tower.castShadow = true;
        scene.add(tower);
    }
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(0.8, 1, 8);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: color, emissive: 0x222222 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 1.8, z);
    roof.castShadow = true;
    scene.add(roof);
}

// --- Create Ground ---
function createGround() {
    const geometry = new THREE.PlaneGeometry(70, 70);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x2ecc71,
        roughness: 0.4,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(70, 35, 0x444444, 0x888888);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
    
    // Draw enemy path
    drawPath();
    
    // Draw placement grid
    drawPlacementGrid();
    
    // Start castle (Blue)
    createCastle(-32, 0, 0x3498db);
    
    // End castle (Red)
    createCastle(32, 0, 0xe74c3c);
}

// --- Draw Placement Grid ---
function drawPlacementGrid() {
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    
    // Vertical lines
    for (let i = 0; i <= GRID_COLS; i++) {
        const x = -MAP_WIDTH / 2 + i * GRID_SIZE;
        linePositions.push(x, 0.02, -MAP_HEIGHT / 2);
        linePositions.push(x, 0.02, MAP_HEIGHT / 2);
    }
    
    // Horizontal lines
    for (let i = 0; i <= GRID_ROWS; i++) {
        const z = -MAP_HEIGHT / 2 + i * GRID_SIZE;
        linePositions.push(-MAP_WIDTH / 2, 0.02, z);
        linePositions.push(MAP_WIDTH / 2, 0.02, z);
    }
    
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.3 });
    const gridLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(gridLines);
}

// --- Tower3D Class ---
class Tower3D {
    constructor(x, z, type) {
        this.type = type;
        this.level = 1;
        this.x = x;
        this.z = z;
        this.shootCooldown = 0;
        this.rotationSpeed = 0.03;
        this.isHovered = false;
        
        const config = TOWER_CONFIG[type];
        this.range = config.range / 40;
        this.baseDamage = config.baseDamage;
        this.damagePerLevel = config.damagePerLevel;
        this.fireRate = config.fireRate;
        
        // Determine tower color
        let towerColor = config.color;
        if (type === 'basic') {
            towerColor = 0x9b59b6; // Purple for basic tower
        }
        
        // Create realistic tower based on type
        this.createTowerMesh(x, z, type, towerColor);
        
        const rangeGeometry = new THREE.CylinderGeometry(this.range, this.range, 0.05, 32);
        const rangeMaterial = new THREE.MeshBasicMaterial({ 
            color: towerColor, 
            transparent: true, 
            opacity: 0.15 
        });
        this.rangeIndicator = new THREE.Mesh(rangeGeometry, rangeMaterial);
        this.rangeIndicator.position.set(x, 0.05, z);
        this.rangeIndicator.visible = false;
        scene.add(this.rangeIndicator);
    }
    
    createTowerMesh(x, z, type, color) {
        // Base for all towers
        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x34495e });
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.set(x, 0.2, z);
        baseMesh.castShadow = true;
        scene.add(baseMesh);
        
        if (type === 'basic') {
            // Bow tower - simple box
            const bowGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.3);
            const bowMaterial = new THREE.MeshStandardMaterial({ color: color });
            const bowMesh = new THREE.Mesh(bowGeometry, bowMaterial);
            bowMesh.position.set(x, 1, z);
            bowMesh.castShadow = true;
            scene.add(bowMesh);
            this.topMesh = bowMesh;
        } else if (type === 'ice') {
            // Ice tower - icosahedron
            const iceGeometry = new THREE.IcosahedronGeometry(0.5, 3);
            const iceMaterial = new THREE.MeshStandardMaterial({ color: color });
            const iceMesh = new THREE.Mesh(iceGeometry, iceMaterial);
            iceMesh.position.set(x, 1, z);
            iceMesh.castShadow = true;
            scene.add(iceMesh);
            this.topMesh = iceMesh;
        } else if (type === 'poison') {
            // Poison tower - sphere
            const poisonGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const poisonMaterial = new THREE.MeshStandardMaterial({ color: color });
            const poisonMesh = new THREE.Mesh(poisonGeometry, poisonMaterial);
            poisonMesh.position.set(x, 1, z);
            poisonMesh.castShadow = true;
            scene.add(poisonMesh);
            this.topMesh = poisonMesh;
        } else if (type === 'sniper') {
            // Sniper tower - tall cylinder
            const sniperGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 6);
            const sniperMaterial = new THREE.MeshStandardMaterial({ color: color });
            const sniperMesh = new THREE.Mesh(sniperGeometry, sniperMaterial);
            sniperMesh.position.set(x, 1.2, z);
            sniperMesh.castShadow = true;
            scene.add(sniperMesh);
            this.topMesh = sniperMesh;
        } else if (type === 'tesla') {
            // Tesla tower - glowing box
            const teslaGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
            const teslaMaterial = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3 });
            const teslaMesh = new THREE.Mesh(teslaGeometry, teslaMaterial);
            teslaMesh.position.set(x, 1, z);
            teslaMesh.castShadow = true;
            scene.add(teslaMesh);
            this.topMesh = teslaMesh;
        } else if (type === 'laser') {
            // Laser tower - cannon
            const laserGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
            const laserMaterial = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.2 });
            const laserMesh = new THREE.Mesh(laserGeometry, laserMaterial);
            laserMesh.position.set(x, 1, z);
            laserMesh.castShadow = true;
            scene.add(laserMesh);
            this.topMesh = laserMesh;
        } else if (type === 'rocket') {
            // Rocket tower - cone
            const rocketGeometry = new THREE.ConeGeometry(0.35, 1, 8);
            const rocketMaterial = new THREE.MeshStandardMaterial({ color: color });
            const rocketMesh = new THREE.Mesh(rocketGeometry, rocketMaterial);
            rocketMesh.position.set(x, 1, z);
            rocketMesh.castShadow = true;
            scene.add(rocketMesh);
            this.topMesh = rocketMesh;
        } else if (type === 'support') {
            // Support tower - glowing orb
            const supportGeometry = new THREE.SphereGeometry(0.4, 16, 16);
            const supportMaterial = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 });
            const supportMesh = new THREE.Mesh(supportGeometry, supportMaterial);
            supportMesh.position.set(x, 1, z);
            supportMesh.castShadow = true;
            scene.add(supportMesh);
            this.topMesh = supportMesh;
        }
    }
    
    getDamage() {
        return this.baseDamage + (this.damagePerLevel * (this.level - 1));
    }
    
    upgrade() {
        if (this.level >= 5) return false;
        const cost = TOWER_CONFIG[this.type].upgradeCost(this.level);
        if (money < cost) return false;
        
        money -= cost;
        this.level++;
        this.topMesh.scale.y = 1 + (this.level * 0.2);
        createExplosion(this.x, 2, this.z, 0xf1c40f, 15);
        return true;
    }
    
    update() {
        this.shootCooldown--;
        this.topMesh.rotation.y += this.rotationSpeed;
        
        let nearestEnemy = null;
        let minDist = Infinity;
        
        for (let enemy of enemies) {
            const dx = enemy.x - this.x;
            const dz = enemy.z - this.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < this.range && dist < minDist) {
                minDist = dist;
                nearestEnemy = enemy;
            }
        }
        
        if (nearestEnemy && this.shootCooldown <= 0) {
            const projectile = new Projectile3D(
                this.x, 1.5, this.z, 
                nearestEnemy, 
                this.getDamage(),
                this.type
            );
            projectiles.push(projectile);
            this.shootCooldown = this.fireRate;
            
            this.topMesh.material.emissive.setHex(0xffffff);
            setTimeout(() => {
                this.topMesh.material.emissive.setHex(0x000000);
            }, 50);
        }
    }
    
    dispose() {
        scene.remove(this.baseMesh);
        scene.remove(this.topMesh);
        scene.remove(this.rangeIndicator);
    }
}

// --- Enemy3D Class ---
class Enemy3D {
    constructor(type = 'normal') {
        this.type = type;
        this.speed = 0.08;
        this.maxHealth = 30 + (wave * 15);
        this.health = this.maxHealth;
        this.pathProgress = 0; // Progress along path (0 to 1)
        this.z = 0;
        this.frozen = false;
        this.freezeTime = 0;
        
        const typeConfig = {
            normal: { color: 0xc0392b },
            fast: { color: 0xe74c3c },
            armored: { color: 0x34495e },
            flying: { color: 0x9b59b6 }
        };
        
        const config = typeConfig[type] || typeConfig.normal;
        
        // Create distinct mesh based on enemy type
        if (type === 'normal') {
            // Normal: cube-like blob
            const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            const material = new THREE.MeshStandardMaterial({ 
                color: config.color,
                metalness: 0.2,
                roughness: 0.6
            });
            this.mesh = new THREE.Mesh(geometry, material);
        } else if (type === 'fast') {
            // Fast: streamlined cylinder
            const geometry = new THREE.CylinderGeometry(0.3, 0.25, 0.8, 8);
            const material = new THREE.MeshStandardMaterial({ 
                color: config.color,
                metalness: 0.4,
                roughness: 0.3
            });
            this.mesh = new THREE.Mesh(geometry, material);
        } else if (type === 'armored') {
            // Armored: heavy box with spikes
            const group = new THREE.Group();
            const baseGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            const baseMaterial = new THREE.MeshStandardMaterial({ 
                color: config.color,
                metalness: 0.6,
                roughness: 0.4
            });
            const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
            group.add(baseMesh);
            
            // Add armor spikes
            for (let i = 0; i < 6; i++) {
                const spikeGeometry = new THREE.ConeGeometry(0.15, 0.4, 4);
                const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
                const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
                
                if (i === 0) spike.position.set(0.5, 0, 0);
                else if (i === 1) spike.position.set(-0.5, 0, 0);
                else if (i === 2) spike.position.set(0, 0.5, 0);
                else if (i === 3) spike.position.set(0, -0.5, 0);
                else if (i === 4) spike.position.set(0, 0, 0.5);
                else spike.position.set(0, 0, -0.5);
                
                spike.rotation.z = Math.PI / 2;
                group.add(spike);
            }
            
            this.mesh = group;
        } else if (type === 'flying') {
            // Flying: sphere with wing extensions
            const group = new THREE.Group();
            const bodyGeometry = new THREE.SphereGeometry(0.4, 8, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: config.color,
                metalness: 0.3,
                roughness: 0.5
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            group.add(body);
            
            // Add wings
            const wingGeometry = new THREE.BoxGeometry(0.3, 0.05, 1.0);
            const wingMaterial = new THREE.MeshStandardMaterial({ 
                color: config.color,
                emissive: 0xffffff,
                emissiveIntensity: 0.2
            });
            const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
            leftWing.position.set(-0.5, 0, 0);
            const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
            rightWing.position.set(0.5, 0, 0);
            
            group.add(leftWing);
            group.add(rightWing);
            
            this.mesh = group;
        }
        
        this.mesh.castShadow = true;
        scene.add(this.mesh);
        
        this.createHealthBar();
    }
    
    createHealthBar() {
        const barGeometry = new THREE.PlaneGeometry(1.5, 0.2);
        const barMaterial = new THREE.MeshBasicMaterial({ color: 0x2ecc71 });
        this.healthBar = new THREE.Mesh(barGeometry, barMaterial);
        
        const bgGeometry = new THREE.PlaneGeometry(1.5, 0.2);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarBg.position.z = -0.01;
        
        this.healthBarContainer = new THREE.Group();
        this.healthBarContainer.add(this.healthBarBg);
        this.healthBarContainer.add(this.healthBar);
        this.healthBarContainer.position.y = 1.2;
        this.mesh.add(this.healthBarContainer);
    }
    
    update() {
        // Update progress along path
        if (!this.frozen) {
            this.pathProgress += this.speed / calculatePathLength();
        }
        
        if (this.frozen) {
            this.freezeTime--;
            if (this.freezeTime <= 0) {
                this.frozen = false;
                this.mesh.material.color.setHex(0xc0392b);
            } else {
                this.mesh.material.color.setHex(0x3498db);
            }
        }
        
        // Get current position from path
        const pathPos = getPathPosition(this.pathProgress);
        this.x = pathPos.x;
        this.z = pathPos.z;
        
        this.mesh.rotation.x += 0.02;
        this.mesh.position.set(this.x, 0.5 + Math.sin(gameTime * 0.05) * 0.1, this.z);
        
        const hpPercent = Math.max(0, this.health / this.maxHealth);
        this.healthBar.scale.x = hpPercent;
        
        // Check if reached end
        if (this.pathProgress >= 1) {
            this.removeFromScene();
            lives--;
            return true;
        }
        
        return false;
    }
    
    takeDamage(amount, damageType = 'basic') {
        this.health -= amount;
        
        if (damageType === 'ice' && !this.frozen) {
            this.frozen = true;
            this.freezeTime = 60;
        }
        
        createExplosion(this.x, 1, this.z, 0xff6b6b, 5);
        
        if (this.health <= 0) {
            createExplosion(this.x, 1, this.z, 0xf39c12, 30);
            this.removeFromScene();
            return true;
        }
        return false;
    }
    
    removeFromScene() {
        scene.remove(this.mesh);
        const idx = enemies.indexOf(this);
        if (idx > -1) enemies.splice(idx, 1);
    }
}

// --- Projectile3D Class ---
class Projectile3D {
    constructor(fromX, fromY, fromZ, target, damage, towerType) {
        this.target = target;
        this.damage = damage;
        this.towerType = towerType;
        this.speed = 0.3;
        
        const colors = {
            basic: 0xf39c12,
            ice: 0x3498db,
            poison: 0x9b59b6,
            sniper: 0xf1c40f,
            tesla: 0xffff00,
            laser: 0xe74c3c,
            rocket: 0xff7f00
        };
        
        const geometry = new THREE.SphereGeometry(0.12, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: colors[towerType] || 0xf1c40f });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(fromX, fromY, fromZ);
        scene.add(this.mesh);
    }
    
    update() {
        if (!this.target || !this.target.mesh.parent) {
            scene.remove(this.mesh);
            return true;
        }
        
        const targetX = this.target.x;
        const targetY = 0.5;
        const targetZ = this.target.z;
        
        const dx = targetX - this.mesh.position.x;
        const dy = targetY - this.mesh.position.y;
        const dz = targetZ - this.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < 0.6) {
            if (this.target.takeDamage(this.damage, this.towerType)) {
                damageStats[this.towerType] = (damageStats[this.towerType] || 0) + this.damage;
                damageStats.total += this.damage;
                updateDamageStats();
            }
            createExplosion(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z, 0xff6b6b, 10);
            scene.remove(this.mesh);
            return true;
        }
        
        this.mesh.position.x += (dx / dist) * this.speed;
        this.mesh.position.y += (dy / dist) * this.speed;
        this.mesh.position.z += (dz / dist) * this.speed;
        
        if (Math.random() < 0.5) {
            const trailVel = new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            );
            particles.push(new Particle3D(
                this.mesh.position.x, 
                this.mesh.position.y, 
                this.mesh.position.z, 
                0xffffff, 
                trailVel
            ));
        }
        
        return false;
    }
}

// --- Game Functions ---

// Convert world coordinates to grid cell
function worldToGrid(x, z) {
    const gridX = Math.floor((x + MAP_WIDTH / 2) / GRID_SIZE);
    const gridY = Math.floor((z + MAP_HEIGHT / 2) / GRID_SIZE);
    return { gridX: Math.max(0, Math.min(GRID_COLS - 1, gridX)), gridY: Math.max(0, Math.min(GRID_ROWS - 1, gridY)) };
}

// Convert grid cell to world coordinates (center of cell)
function gridToWorld(gridX, gridY) {
    const x = gridX * GRID_SIZE - MAP_WIDTH / 2 + GRID_SIZE / 2;
    const z = gridY * GRID_SIZE - MAP_HEIGHT / 2 + GRID_SIZE / 2;
    return { x, z };
}

// Get unique key for grid cell
function getGridKey(gridX, gridY) {
    return `${gridX},${gridY}`;
}

function setupClickListener() {
    clickListener = (e) => {
        if (!gameRunning || !selectedTowerType) return;
        
        // Only place tower on double-click
        if (e.detail !== 2) return;
        
        const raycasterClick = new THREE.Raycaster();
        const mouseClick = new THREE.Vector2();
        mouseClick.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseClick.y = -(e.clientY / window.innerHeight) * 2 + 1;
        
        raycasterClick.setFromCamera(mouseClick, camera);
        
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        raycasterClick.ray.intersectPlane(plane, target);
        
        if (!target) return;
        
        // Snap to nearest grid cell
        const grid = worldToGrid(target.x, target.z);
        const gridKey = getGridKey(grid.gridX, grid.gridY);
        const snappedPos = gridToWorld(grid.gridX, grid.gridY);
        
        // Check if cell is already occupied
        if (placedTiles[gridKey]) {
            alert('Ô này đã có tháp rồi!');
            return;
        }
        
        const cost = TOWER_CONFIG[selectedTowerType].cost;
        if (money >= cost && snappedPos.x > -28 && snappedPos.x < 28 && snappedPos.z > -30 && snappedPos.z < 30) {
            money -= cost;
            towers.push(new Tower3D(snappedPos.x, snappedPos.z, selectedTowerType));
            placedTiles[gridKey] = selectedTowerType; // Mark grid cell as occupied
            updateUI();
            
            // Giữ lại preview range sau khi đặt tower
            if (previewTowerRange) {
                previewTowerRange.position.copy(snappedPos);
            }
        } else if (money < cost) {
            alert('Không đủ tiền! Cần ' + cost + '$');
        }
    };
    
    // Setup double-click for tower placement
    document.addEventListener('click', clickListener);
    
    // Setup right-click to deselect tower
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        selectedTowerType = null;
        document.querySelectorAll('.tower-select').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Hide preview range
        if (previewTowerRange) {
            previewTowerRange.visible = false;
        }
    });
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameRunning = true;
    createGround();
    setupClickListener();
    updateWaveButton();
    updateDamageStats();
    gameLoop();
}

function updateWaveButton() {
    const btn = document.getElementById('btn-next-wave');
    
    if (!wavePreviewShown && !isWaveActive) {
        btn.classList.remove('wave-start');
        btn.textContent = `👁️ XEM THÔNG TIN ĐỢT ${wave}`;
    } else if (wavePreviewShown && !isWaveActive) {
        btn.classList.add('wave-start');
        btn.textContent = `⚔️ BẮT ĐẦU ĐỢT ${wave}`;
    } else {
        btn.textContent = '⏳ Chờ...';
    }
}

function handleWaveButtonClick() {
    if (!wavePreviewShown && !isWaveActive) {
        showWaveNotification(wave);
        wavePreviewShown = true;
        updateWaveButton();
        return;
    }
    
    if (wavePreviewShown && !isWaveActive) {
        startNextWave();
    }
}

function startNextWave() {
    if (isWaveActive) return;
    
    isWaveActive = true;
    enemiesSpawnedCount = 0;
    wavePreviewShown = false;
    enemiesToSpawnTotal = 10 + (wave * 2);
    spawnTimer = 0;
    updateWaveButton();
}

function showWaveNotification(waveNumber) {
    const notifDiv = document.getElementById('wave-notification');
    const titleDiv = document.getElementById('wave-notification-title');
    const textDiv = document.getElementById('wave-notification-text');
    
    titleDiv.textContent = `🌊 Đợt ${waveNumber} sắp tới`;
    
    let possibleTypes = [];
    let specialWarning = '';
    
    if (waveNumber <= 2) {
        possibleTypes = ['normal'];
    } else if (waveNumber <= 5) {
        possibleTypes = ['normal', 'fast', 'armored'];
    } else if (waveNumber <= 10) {
        possibleTypes = ['normal', 'fast', 'armored', 'flying'];
        specialWarning = '⚠️ CẢNH BÁO: Quái bay xuất hiện!<br>';
    } else {
        possibleTypes = ['normal', 'fast', 'armored', 'flying'];
        specialWarning = '⚠️ ĐỢT KHÓ: Quái mạnh hơn!<br>';
    }
    
    let notification = specialWarning;
    notification += '🎯 Quái trong đợt này:<br>';
    
    const typeEmojis = {
        'normal': '🟢',
        'fast': '⚡',
        'armored': '🛡️',
        'flying': '🦅'
    };
    
    for (let type of possibleTypes) {
        const emoji = typeEmojis[type] || '⭕';
        let typeName = '';
        switch(type) {
            case 'normal': typeName = 'Quái thường'; break;
            case 'fast': typeName = 'Quái nhanh'; break;
            case 'armored': typeName = 'Quái giáp'; break;
            case 'flying': typeName = 'Quái bay'; break;
        }
        notification += `${emoji} ${typeName}<br>`;
    }
    
    textDiv.innerHTML = notification;
    // Show modal without hidden class
    notifDiv.classList.remove('hidden');
    notifDiv.classList.add('show');
    
    setTimeout(() => {
        notifDiv.classList.remove('show');
        notifDiv.classList.add('hidden');
    }, 4000);
}

function selectTower(type) {
    selectedTowerType = selectedTowerType === type ? null : type;
    
    document.querySelectorAll('.tower-select').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    if (selectedTowerType) {
        document.getElementById('btn-' + type).classList.add('selected');
        
        // Tạo preview range indicator cho tower sắp đặt
        const config = TOWER_CONFIG[type];
        let previewColor = config.color;
        if (type === 'basic') {
            previewColor = 0x9b59b6; // Purple
        }
        
        if (previewTowerRange) {
            scene.remove(previewTowerRange);
        }
        const rangeGeometry = new THREE.CylinderGeometry(config.range / 40, config.range / 40, 0.05, 32);
        const rangeMaterial = new THREE.MeshBasicMaterial({ 
            color: previewColor, 
            transparent: true, 
            opacity: 0.3 
        });
        previewTowerRange = new THREE.Mesh(rangeGeometry, rangeMaterial);
        previewTowerRange.position.y = 0.05;
        scene.add(previewTowerRange);
    } else {
        // Loại bỏ preview range
        if (previewTowerRange) {
            scene.remove(previewTowerRange);
            previewTowerRange = null;
        }
    }
}

function updateDamageStats() {
    const statsDiv = document.getElementById('damage-stats');
    if (!statsDiv) return;
    
    let html = '<h3>📊 THỐNG KÊ SÁT THƯƠNG</h3>';
    
    const towerTypes = ['basic', 'ice', 'poison', 'sniper', 'tesla', 'laser', 'rocket', 'support'];
    
    let hasData = false;
    for (let type of towerTypes) {
        const damage = damageStats[type] || 0;
        if (damage > 0) {
            hasData = true;
            const config = TOWER_CONFIG[type];
            html += `<div class="damage-stat-row">
                <span>${config.name}</span>
                <span style="color: ${config.color};">${damage.toFixed(0)}</span>
            </div>`;
        }
    }
    
    if (hasData) {
        html += `<div class="damage-stat-row" style="border-top: 2px solid #f1c40f; padding-top: 8px;">
            <strong>Tổng</strong>
            <span style="color: #f1c40f;">${damageStats.total.toFixed(0)}</span>
        </div>`;
    } else {
        html += '<p style="text-align: center; color: #bdc3c7; font-size: 0.9rem;">Chưa gây sát thương</p>';
    }
    
    statsDiv.innerHTML = html;
}

function updateUI() {
    document.getElementById('lives').textContent = lives;
    document.getElementById('money').textContent = money;
    document.getElementById('wave').textContent = wave;
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    gameTime++;
    
    if (!gameRunning) return;
    
    // Update preview tower range position
    if (previewTowerRange && selectedTowerType) {
        raycaster.setFromCamera(mouse, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, target);
        if (target) {
            previewTowerRange.position.x = target.x;
            previewTowerRange.position.z = target.z;
        }
    }
    
    // Mouse hover detection for tower range
    raycaster.setFromCamera(mouse, camera);
    
    let hoveredTowerFound = false;
    for (let tower of towers) {
        const distance = raycaster.ray.distanceToPoint(new THREE.Vector3(tower.x, 0.25, tower.z));
        
        if (distance < tower.range + 1 && tower !== hoveredTower) {
            if (hoveredTower) {
                hoveredTower.rangeIndicator.visible = false;
            }
            tower.rangeIndicator.visible = true;
            hoveredTower = tower;
            hoveredTowerFound = true;
            break;
        }
    }
    
    if (!hoveredTowerFound && hoveredTower) {
        hoveredTower.rangeIndicator.visible = false;
        hoveredTower = null;
    }
    
    // Spawn enemies
    if (isWaveActive) {
        spawnTimer++;
        if (spawnTimer > 50 && enemiesSpawnedCount < enemiesToSpawnTotal) {
            const types = ['normal', 'fast', 'armored'];
            
            // Wave-based enemy selection
            if (wave <= 2) {
                types.length = 1;
            } else if (wave <= 5) {
                types.length = 3;
            } else if (wave > 5) {
                types.push('flying');
            }
            
            const randomType = types[Math.floor(Math.random() * types.length)];
            enemies.push(new Enemy3D(randomType));
            enemiesSpawnedCount++;
            spawnTimer = 0;
            updateWaveButton();
        }
        
        if (enemiesSpawnedCount >= enemiesToSpawnTotal && enemies.length === 0) {
            isWaveActive = false;
            wavePreviewShown = false;
            
            let waveReward = 100 + (wave * 20);
            money += waveReward;
            
            wave++;
            enemiesToSpawnTotal = 10 + (wave * 2);
            damageStats = {
                basic: 0, ice: 0, poison: 0, sniper: 0,
                tesla: 0, laser: 0, rocket: 0, support: 0, total: 0
            };
            updateDamageStats();
            updateWaveButton();
        }
    }
    
    towers.forEach(tower => tower.update());
    
    enemies.forEach(enemy => enemy.update());
    
    projectiles = projectiles.filter(p => !p.update());
    
    particles.forEach(p => {
        if (!p.update()) p.dispose();
    });
    particles = particles.filter(p => p.life > 0);
    
    if (lives <= 0) {
        gameRunning = false;
        document.removeEventListener('click', clickListener);
        alert('GAME OVER! Bạn sống được ' + (wave - 1) + ' đợt');
        location.reload();
    }
    
    updateUI();
    renderer.render(scene, camera);
}

// Update camera every frame
(function animateCamera() {
    requestAnimationFrame(animateCamera);
    updateCamera();
})();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mouse move tracking and camera rotation
document.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    // Camera rotation on drag
    if (isDragging) {
        const deltaX = e.clientX - dragStartX;
        cameraAngle += deltaX * 0.005;
        dragStartX = e.clientX;
    }
});

// Camera rotation controls
document.addEventListener('mousedown', (e) => {
    // Don't rotate if clicking on UI elements
    if (e.target.closest('#controls') || e.target.closest('#btn-next-wave') || e.target.closest('.tower-select')) {
        return;
    }
    isDragging = true;
    dragStartX = e.clientX;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Update camera position based on angle
function updateCamera() {
    camera.position.x = Math.sin(cameraAngle) * cameraDistance;
    camera.position.y = cameraHeight;
    camera.position.z = Math.cos(cameraAngle) * cameraDistance;
    camera.lookAt(0, 5, 0);
}

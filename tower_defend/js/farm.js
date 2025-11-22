// --- Farm System Configuration ---

// Farm Configuration
const FARM_CONFIG = {
    // Crop types with different growth times and values (30s to 60s based on value)
    crops: {
        carrot: {
            name: 'Cà Rốt',
            cost: 10,
            growTime: 60000, // 1 phút
            waterInterval: 5000, // Tưới mỗi 5 giây
            baseValue: 25,
            color: '#ff6b35',
            stages: 3
        },
        wheat: {
            name: 'Lúa Mì',
            cost: 15,
            growTime: 90000, // 1 phút 30 giây
            waterInterval: 7000, // Tưới mỗi 7 giây
            baseValue: 40,
            color: '#f4d03f',
            stages: 4
        },
        pumpkin: {
            name: 'Bí Ngô',
            cost: 25,
            growTime: 120000, // 2 phút
            waterInterval: 10000, // Tưới mỗi 10 giây
            baseValue: 70,
            color: '#e67e22',
            stages: 5
        }
    },
    
    // Farm map configuration
    farmMap: {
        name: 'Vườn Cây Bí Mật',
        description: 'Nơi trồng trọt và kiếm tiền',
        rows: 15,
        cols: 20,
        tileSize: 40,
        waterCost: 5, // Cost per water action
        plantCostMultiplier: 1.0,
        plotSize: 3, // 3x3 planting areas
        plotSpacing: 1, // Space between plots
        soilAnimationSpeed: 0.02 // Speed of soil animation
    },
    
    // Warning system
    warnings: {
        waterReminderInterval: 10000, // Remind every 10 seconds
        criticalWaterThreshold: 3000, // 3 seconds without water
        maxWarningsPerWave: 3
    }
};

// Farm State
let farmMode = false;
let farmGrid = [];
let farmCrops = [];
let lastWaterWarning = 0;
let waterWarningCount = 0;
let farmMoneyEarned = 0;
let totalCropsHarvested = 0;
let soilAnimationTime = 0; // For animated soil effects
let farmLayout = { offsetX: 0, offsetY: 0, plotsPerRow: 0, plotsPerCol: 0 };

// Initialize farm grid
function initializeFarm() {
    farmGrid = Array(FARM_CONFIG.farmMap.rows).fill().map(() => Array(FARM_CONFIG.farmMap.cols).fill(null));
    farmCrops = [];
    console.log('🌱 Farm initialized with', FARM_CONFIG.farmMap.rows, 'rows and', FARM_CONFIG.farmMap.cols, 'cols');
}

// Crop class
class Crop {
    constructor(type, row, col, clickX = null, clickY = null) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.stage = 0;
        this.lastWatered = Date.now();
        this.plantedAt = Date.now();
        this.isAlive = true;
        this.waterLevel = 100;
        this.growthProgress = 0;
        this.clickX = clickX;
        this.clickY = clickY;
        this.plantAnimationTime = 0;
        this.isPlanting = true;
        this.lastUpdateTime = Date.now();
        
        const cropConfig = FARM_CONFIG.crops[type];
        this.maxStage = cropConfig.stages;
        this.growTime = cropConfig.growTime;
        this.waterInterval = cropConfig.waterInterval;
        this.baseValue = cropConfig.baseValue;
        this.color = cropConfig.color;
        
        console.log(`🌱 Planted ${cropConfig.name} at (${row}, ${col})`);
    }
    
    getStageIcon() {
        if (this.stage <= 0) return '🌱';
        if (this.type === 'carrot') return '🥕';
        if (this.type === 'wheat') return '🌾';
        if (this.type === 'pumpkin') return '🎃';
        return '🌿';
    }
    
    update() {
        if (!this.isAlive) return false;
        
        // Handle planting animation
        if (this.isPlanting) {
            this.plantAnimationTime += 0.1;
            if (this.plantAnimationTime >= 1) {
                this.isPlanting = false;
            }
        }
        
        const now = Date.now();
        const dt = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        const timeSinceWater = now - this.lastWatered;
        
        // Check if crop needs water
        if (timeSinceWater > this.waterInterval) {
            // Decrease water level gradually based on elapsed time
            const decreasePerSecond = 2; // 2 units per second after overdue
            this.waterLevel = Math.max(0, this.waterLevel - (dt / 1000) * decreasePerSecond);
            
            // Crop dies if not watered for too long
            const criticalThreshold = this.waterInterval * 3; // dynamic threshold
            if (timeSinceWater > criticalThreshold && this.waterLevel <= 0) {
                this.die('Không được tưới nước');
                return false;
            }
        }
        
        // Grow if healthy
        if (this.waterLevel > 50) {
            // Calculate growth based on actual time passed (milliseconds)
            const growthRate = 1000 / 60; // Assuming 60 FPS, this is ~16.67ms per frame
            this.growthProgress += growthRate;
            
            // Advance stage
            if (this.growthProgress >= this.growTime / this.maxStage) {
                this.growthProgress = 0;
                this.stage++;
                
                if (this.stage >= this.maxStage) {
                    this.harvest();
                    return true; // Ready for harvest
                }
            }
        }
        
        return false;
    }
    
    water() {
        if (!this.isAlive) return false;
        
        this.lastWatered = Date.now();
        this.waterLevel = Math.min(100, this.waterLevel + 30);
        
        console.log(`💧 Watered ${this.type} at (${this.row}, ${this.col}), water level: ${this.waterLevel}%`);
        
        // Visual feedback
        createFarmParticles(this.col * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           this.row * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           '#3498db', 5);
        
        return true;
    }
    
    harvest() {
        if (!this.isAlive || this.stage < this.maxStage) return 0;
        
        const cropConfig = FARM_CONFIG.crops[this.type];
        const value = cropConfig.baseValue + Math.floor(this.waterLevel / 10); // Bonus for good care
        
        console.log(`🌾 Harvested ${cropConfig.name} for ${value}$`);
        
        // Visual feedback
        createFarmParticles(this.col * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           this.row * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           this.color, 10);
        
        return value;
    }
    
    die(reason) {
        this.isAlive = false;
        console.log(`💀 Crop at (${this.row}, ${this.col}) died: ${reason}`);
        
        // Visual feedback
        createFarmParticles(this.col * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           this.row * FARM_CONFIG.farmMap.tileSize + FARM_CONFIG.farmMap.tileSize/2, 
                           '#e74c3c', 8);
    }
    
    draw(ctx) {
        if (!this.isAlive) return;
        
        const x = this.col * FARM_CONFIG.farmMap.tileSize;
        const y = this.row * FARM_CONFIG.farmMap.tileSize;
        this.drawAtPosition(ctx, x, y);
    }
    
    drawAtPosition(ctx, x, y) {
        if (!this.isAlive) return;
        
        const size = FARM_CONFIG.farmMap.tileSize;
        
        // Draw planting animation if just planted
        if (this.isPlanting) {
            const plantScale = 1 + Math.sin(this.plantAnimationTime * Math.PI * 4) * 0.3;
            const plantAlpha = 0.5 + Math.sin(this.plantAnimationTime * Math.PI * 2) * 0.5;
            
            ctx.save();
            ctx.globalAlpha = plantAlpha;
            ctx.translate(x + size/2, y + size/2);
            ctx.scale(plantScale, plantScale);
            ctx.translate(-(x + size/2), -(y + size/2));
        }
        
        // Draw soil
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 5, y + size - 8, size - 10, 6);
        
        // Clear, explicit growth icon overlay
        const icon = this.getStageIcon();
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = Math.floor(size * 0.6) + 'px Segoe UI Emoji, Arial';
        const bounceY = this.stage <= 0 ? Math.sin(Date.now() * 0.005) * 3 : 0;
        ctx.fillText(icon, x + size / 2, y + size / 2 + bounceY);
        ctx.restore();
        
        // Growth progress ring around the tile
        const progress = Math.min((Date.now() - this.plantedAt) / this.growTime, 1);
        ctx.save();
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const cx = x + size / 2;
        const cy = y + size / 2;
        const radius = (size / 2) - 3;
        ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        
        if (this.stage > 0) {
            // Calculate growth animation based on time and stage
            const timeProgress = (Date.now() - this.plantedAt) / this.growTime;
            const stageProgress = this.stage / this.maxStage;
            const overallProgress = Math.min(timeProgress, stageProgress);
            
            // Add subtle growth animation
            const growthScale = 0.3 + (overallProgress * 0.7);
            const growthBounce = Math.sin(timeProgress * Math.PI * 8) * 0.02 * (1 - overallProgress);
            
            // Draw crop based on stage with growth animation
            const height = size * growthScale * (this.stage / this.maxStage);
            const width = size * growthScale * 0.8 * (this.stage / this.maxStage);
            
            ctx.save();
            ctx.translate(x + size/2, y + size - 8);
            ctx.scale(1 + growthBounce, 1 + growthBounce);
            ctx.translate(-(x + size/2), -(y + size - 8));
            
            ctx.fillStyle = this.color;
            
            if (this.type === 'carrot') {
                // Carrot leaves with growth stages
                const leafCount = Math.min(this.stage, 3);
                for (let i = 0; i < leafCount; i++) {
                    const leafX = x + size/2 + (i - leafCount/2) * 4;
                    const leafHeight = height * (0.8 + i * 0.1);
                    ctx.fillRect(leafX - width/4, y + size - 8 - leafHeight, width/2, leafHeight);
                }
                // Carrot top
                ctx.fillStyle = '#228B22';
                ctx.fillRect(x + size/2 - 2, y + size - 8 - height - 3, 4, 6);
            } else if (this.type === 'wheat') {
                // Wheat stalks with swaying animation
                const stalkCount = this.stage;
                const swayOffset = Math.sin((Date.now() - this.plantedAt) * 0.001) * 2;
                
                for (let i = 0; i < stalkCount; i++) {
                    const stalkX = x + size/2 + (i - stalkCount/2) * 3 + swayOffset;
                    const stalkHeight = height * (0.7 + Math.random() * 0.3);
                    
                    // Stalk
                    ctx.fillStyle = '#DAA520';
                    ctx.fillRect(stalkX, y + size - 8 - stalkHeight, 2, stalkHeight);
                    
                    // Wheat head
                    ctx.fillStyle = this.color;
                    ctx.fillRect(stalkX - 1, y + size - 8 - stalkHeight - 2, 4, 4);
                }
            } else if (this.type === 'pumpkin') {
                // Pumpkin with size animation
                const pumpkinSize = width * (0.8 + Math.sin((Date.now() - this.plantedAt) * 0.002) * 0.1);
                
                ctx.beginPath();
                ctx.arc(x + size/2, y + size - 8 - height/2, pumpkinSize/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Pumpkin stem
                ctx.fillStyle = '#228B22';
                ctx.fillRect(x + size/2 - 1, y + size - 8 - height - 2, 2, 4);
                
                // Pumpkin stripes for mature stages
                if (this.stage >= this.maxStage - 1) {
                    ctx.strokeStyle = '#D2691E';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(x + size/2, y + size - 8 - height/2, pumpkinSize/2 - i * 3, 
                               -Math.PI/3, Math.PI/3);
                        ctx.stroke();
                    }
                }
            }
            
            ctx.restore();
        }
        
        // Early growth animation while stage == 0 (sprout growing)
        if (this.stage === 0) {
            const firstStageTime = this.growTime / this.maxStage;
            const p = Math.min((Date.now() - this.plantedAt) / firstStageTime, 1);
            const sproutHeight = size * 0.15 * p;
            const sproutWidth = size * 0.1 * p;
            ctx.save();
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.ellipse(x + size/2 - 5, y + size - 10 - sproutHeight, sproutWidth, sproutHeight, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + size/2 + 5, y + size - 10 - sproutHeight*0.9, sproutWidth*0.9, sproutHeight*0.9, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }
        
        // Show water level indicator with pulsing effect
        if (this.waterLevel < 30) {
            const pulseSize = 4 + Math.sin(Date.now() * 0.01) * 2;
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x + size/2 - pulseSize/2, y + 2, pulseSize, pulseSize);
        }
        
        const now = Date.now();
        const needsWater = now - this.lastWatered > this.waterInterval;
        drawWateringCanIcon(ctx, x + size - 14, y + 10, 10, needsWater);
        
        // Restore from planting animation
        if (this.isPlanting) {
            ctx.restore();
        }
    }
}

function drawWateringCanIcon(ctx, x, y, s, highlight=false) {
    ctx.save();
    ctx.fillStyle = highlight ? '#1f8bd6' : '#3498db';
    ctx.strokeStyle = highlight ? '#ffcc00' : '#2980b9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + s);
    ctx.lineTo(x + s, y + s);
    ctx.lineTo(x + s, y + s/2);
    ctx.lineTo(x + s/2, y + s/2);
    ctx.lineTo(x + s/2, y);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s/2, y + s/2);
    ctx.lineTo(x + s + 4, y + s/2 - 2);
    ctx.stroke();
    ctx.fillStyle = highlight ? 'rgba(255,200,0,0.9)' : 'rgba(52,152,219,0.8)';
    ctx.beginPath();
    const dropY = y + s/2 + Math.sin(Date.now()*0.01) * 2;
    ctx.arc(x + s + 6, dropY, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
}

// Farm functions
function switchToFarm() {
    if (farmMode) return;
    
    farmMode = true;
    console.log('🌱 Switching to FARM mode');
    
    // Hide farm portal immediately when switching to farm mode
    hideFarmPortal();
    
    // Initialize farm if not exists
    if (farmGrid.length === 0) {
        initializeFarm();
    }
    
    // Add transition effect
    canvas.style.transition = 'opacity 0.5s ease';
    canvas.style.opacity = '0.3';
    
    setTimeout(() => {
        // Hide combat UI elements
        hideCombatUI();
        
        // Show farm UI
        showFarmUI();
        showReturnPortal();
        hideFarmPortal();
        
        // Fade back in
        canvas.style.opacity = '1';
        
        // Start farm game loop
        if (!farmLoopRunning) {
            farmLoop();
        }
    }, 500);
}

function switchToTower() {
    if (!farmMode) return;
    
    farmMode = false;
    console.log('🏰 Switching to TOWER mode');
    
    // Add transition effect
    canvas.style.transition = 'opacity 0.5s ease';
    canvas.style.opacity = '0.3';
    
    setTimeout(() => {
        // Hide farm UI
        hideFarmUI();
        hideReturnPortal();
        
        // Show combat UI elements
        showCombatUI();
        
        // Show farm portal when returning to tower mode
        showFarmPortal();
        
        // Fade back in
        canvas.style.opacity = '1';
    }, 500);
}

function plantCrop(type, row, col, clickX = null, clickY = null) {
    if (!farmMode) return false;
    
    // Check bounds
    if (row < 0 || row >= FARM_CONFIG.farmMap.rows || col < 0 || col >= FARM_CONFIG.farmMap.cols) {
        return false;
    }
    
    // Check if spot is empty
    if (farmGrid[row][col] !== null) {
        return false;
    }
    
    const cropConfig = FARM_CONFIG.crops[type];
    const plantCost = Math.floor(cropConfig.cost * FARM_CONFIG.farmMap.plantCostMultiplier);
    
    // Check money
    if (money < plantCost) {
        console.log('💰 Not enough money to plant');
        return false;
    }
    
    // Plant the crop
    money -= plantCost;
    const crop = new Crop(type, row, col, clickX, clickY);
    farmGrid[row][col] = crop;
    farmCrops.push(crop);
    
    // Create planting animation at click position
    if (clickX !== null && clickY !== null) {
        createPlantingAnimation(clickX, clickY);
    }
    
    updateUI();
    return true;
}

function waterCrop(row, col) {
    if (!farmMode) return false;
    
    // Check bounds
    if (row < 0 || row >= FARM_CONFIG.farmMap.rows || col < 0 || col >= FARM_CONFIG.farmMap.cols) {
        return false;
    }
    
    const crop = farmGrid[row][col];
    if (!crop || !crop.isAlive) {
        return false;
    }
    
    // Check money for watering
    if (money < FARM_CONFIG.farmMap.waterCost) {
        console.log('💰 Not enough money to water');
        return false;
    }
    
    money -= FARM_CONFIG.farmMap.waterCost;
    crop.water();
    
    updateUI();
    return true;
}

function harvestCrop(row, col) {
    if (!farmMode) return 0;
    
    // Check bounds
    if (row < 0 || row >= FARM_CONFIG.farmMap.rows || col < 0 || col >= FARM_CONFIG.farmMap.cols) {
        return 0;
    }
    
    const crop = farmGrid[row][col];
    if (!crop || !crop.isAlive) {
        return 0;
    }
    
    const value = crop.harvest();
    if (value > 0) {
        money += value;
        farmMoneyEarned += value;
        totalCropsHarvested++;
        
        // Remove crop
        farmGrid[row][col] = null;
        const index = farmCrops.indexOf(crop);
        if (index > -1) {
            farmCrops.splice(index, 1);
        }
        
        updateUI();
    }
    
    return value;
}

function checkWaterNeeds() {
    const now = Date.now();
    
    // Only check every 10 seconds and max 3 warnings per wave
    if (now - lastWaterWarning < FARM_CONFIG.warnings.waterReminderInterval || 
        waterWarningCount >= FARM_CONFIG.warnings.maxWarningsPerWave) {
        return;
    }
    
    let needsWater = false;
    let criticalCrops = [];
    
    for (let crop of farmCrops) {
        if (!crop.isAlive) continue;
        
        const timeSinceWater = now - crop.lastWatered;
        if (timeSinceWater > crop.waterInterval) {
            needsWater = true;
            
            const dynamicThreshold = crop.waterInterval * 3;
            if (timeSinceWater > dynamicThreshold) {
                criticalCrops.push(crop);
            }
        }
    }
    
    if (needsWater && criticalCrops.length > 0) {
        lastWaterWarning = now;
        waterWarningCount++;
        
        showWaterWarning(criticalCrops.length);
    }
}

function showWaterWarning(criticalCount) {
    const message = `⚠️ ${criticalCount} cây cần tưới nước ngay! Nhấn TAB để chuyển sang vườn.`;
    
    // Create notification
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(231, 76, 60, 0.95);
            border: 2px solid #c0392b;
            border-radius: 10px;
            padding: 15px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: pulse 1s infinite;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 5000);
}

function drawFarm(ctx) {
    // Update soil animation
    soilAnimationTime += FARM_CONFIG.farmMap.soilAnimationSpeed;
    
    // Draw animated farm background with gradient grass
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#90EE90'); // Light green at top
    gradient.addColorStop(0.5, '#32CD32'); // Medium green in middle
    gradient.addColorStop(1, '#228B22'); // Dark green at bottom
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add animated grass texture
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 50; i++) {
        const x = (i * 37 + soilAnimationTime * 50) % canvas.width;
        const y = Math.sin(soilAnimationTime * 2 + i) * 20 + canvas.height * 0.7;
        const height = 15 + Math.sin(soilAnimationTime * 3 + i * 0.5) * 5;
        
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(soilAnimationTime * 4 + i) * 3, y - height);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    const plotSize = FARM_CONFIG.farmMap.plotSize;
    const plotSpacing = FARM_CONFIG.farmMap.plotSpacing;
    const tileSize = FARM_CONFIG.farmMap.tileSize;
    
    // Calculate plot dimensions
    const plotTileSize = plotSize * tileSize;
    const totalPlotSize = plotTileSize + (plotSpacing * tileSize);
    
    // Calculate centering offset
    const plotsPerRow = Math.floor(FARM_CONFIG.farmMap.cols / (plotSize + plotSpacing));
    const plotsPerCol = Math.floor(FARM_CONFIG.farmMap.rows / (plotSize + plotSpacing));
    const totalFarmWidth = plotsPerRow * totalPlotSize;
    const totalFarmHeight = plotsPerCol * totalPlotSize;
    const offsetX = (canvas.width - totalFarmWidth) / 2;
    const offsetY = (canvas.height - totalFarmHeight) / 2;
    farmLayout.offsetX = offsetX;
    farmLayout.offsetY = offsetY;
    farmLayout.plotsPerRow = plotsPerRow;
    farmLayout.plotsPerCol = plotsPerCol;
    
    // Draw 3x3 planting plots with animated soil
    for (let plotRow = 0; plotRow < plotsPerCol; plotRow++) {
        for (let plotCol = 0; plotCol < plotsPerRow; plotCol++) {
            const plotX = offsetX + plotCol * totalPlotSize;
            const plotY = offsetY + plotRow * totalPlotSize;
            
            // Draw plot border with wood texture
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(plotX, plotY, totalPlotSize, totalPlotSize);
            
            // Draw inner plot area with animated soil
            const innerX = plotX + plotSpacing * tileSize / 2;
            const innerY = plotY + plotSpacing * tileSize / 2;
            const innerSize = plotTileSize;
            
            // Create animated soil pattern
            for (let r = 0; r < plotSize; r++) {
                for (let c = 0; c < plotSize; c++) {
                    const tileX = innerX + c * tileSize;
                    const tileY = innerY + r * tileSize;
                    
                    // Animated soil with subtle wave effect
                    const waveOffset = Math.sin(soilAnimationTime + (r + c) * 0.5) * 2;
                    const soilBrightness = 0.6 + Math.sin(soilAnimationTime * 2 + (r * plotSize + c) * 0.3) * 0.1;
                    
                    // Base soil color
                    const baseR = Math.floor(139 * soilBrightness);
                    const baseG = Math.floor(69 * soilBrightness);
                    const baseB = Math.floor(19 * soilBrightness);
                    
                    ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
                    ctx.fillRect(tileX, tileY, tileSize, tileSize);
                    
                    // Add soil texture dots
                    ctx.fillStyle = `rgba(${baseR - 20}, ${baseG - 10}, ${baseB - 5}, 0.3)`;
                    for (let i = 0; i < 3; i++) {
                        const dotX = tileX + Math.random() * tileSize;
                        const dotY = tileY + Math.random() * tileSize;
                        ctx.beginPath();
                        ctx.arc(dotX, dotY, 1 + Math.random() * 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    // Add tile border
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(tileX, tileY, tileSize, tileSize);
                    
                    // Global grid coordinates for this tile
                    const globalRow = plotRow * (plotSize + plotSpacing) + r;
                    const globalCol = plotCol * (plotSize + plotSpacing) + c;
                    
                    // Draw crop if exists (only if within bounds)
                    if (globalRow < FARM_CONFIG.farmMap.rows && globalCol < FARM_CONFIG.farmMap.cols && farmGrid[globalRow][globalCol]) {
                        farmGrid[globalRow][globalCol].drawAtPosition(ctx, tileX, tileY);
                    }
                }
            }
            
            // Draw plot label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Khu ${plotRow * plotsPerRow + plotCol + 1}`, 
                        plotX + totalPlotSize / 2, plotY + totalPlotSize - 5);
        }
    }
    
    // Draw farm UI overlay
    drawFarmUI(ctx);
}

function pixelToFarmCell(x, y) {
    const plotSize = FARM_CONFIG.farmMap.plotSize;
    const plotSpacing = FARM_CONFIG.farmMap.plotSpacing;
    const tileSize = FARM_CONFIG.farmMap.tileSize;
    const totalPlotSize = plotSize * tileSize + (plotSpacing * tileSize);
    const relX = x - farmLayout.offsetX;
    const relY = y - farmLayout.offsetY;
    if (relX < 0 || relY < 0) return null;
    const plotCol = Math.floor(relX / totalPlotSize);
    const plotRow = Math.floor(relY / totalPlotSize);
    if (plotCol < 0 || plotCol >= farmLayout.plotsPerRow || plotRow < 0 || plotRow >= farmLayout.plotsPerCol) return null;
    const innerX = plotCol * totalPlotSize + plotSpacing * tileSize / 2;
    const innerY = plotRow * totalPlotSize + plotSpacing * tileSize / 2;
    const localX = relX - innerX;
    const localY = relY - innerY;
    if (localX < 0 || localY < 0) return null;
    const c = Math.floor(localX / tileSize);
    const r = Math.floor(localY / tileSize);
    if (c < 0 || c >= plotSize || r < 0 || r >= plotSize) return null;
    const globalRow = plotRow * (plotSize + plotSpacing) + r;
    const globalCol = plotCol * (plotSize + plotSpacing) + c;
    if (globalRow < 0 || globalRow >= FARM_CONFIG.farmMap.rows || globalCol < 0 || globalCol >= FARM_CONFIG.farmMap.cols) return null;
    return { row: globalRow, col: globalCol };
}

// Farm game loop
let farmLoopRunning = false;

function farmLoop() {
    if (!farmMode) {
        farmLoopRunning = false;
        return;
    }
    
    farmLoopRunning = true;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update crops
    for (let i = farmCrops.length - 1; i >= 0; i--) {
        const crop = farmCrops[i];
        if (crop.update()) {
            // Crop is ready for harvest
            console.log(`🌾 Crop at (${crop.row}, ${crop.col}) is ready for harvest!`);
        }
    }
    
    // Update farm particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    
    // Check water needs
    checkWaterNeeds();
    
    // Draw farm
    drawFarm(ctx);
    
    // Draw particles
    for (let part of particles) {
        part.draw(ctx);
    }
    
    requestAnimationFrame(farmLoop);
}

// Farm particle system
function createFarmParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 30,
            maxLife: 30,
            color: color,
            size: Math.random() * 3 + 2,
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.1; // Gravity
                this.life--;
            },
            draw: function(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
    }
}

// Planting animation function
function createPlantingAnimation(x, y) {
    // Create seed planting particles
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * -4 - 2,
            life: 40,
            maxLife: 40,
            color: '#8B4513',
            size: Math.random() * 4 + 2,
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.2; // Gravity
                this.vx *= 0.98; // Air resistance
                this.life--;
            },
            draw: function(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
    }
    
    // Create green growth sparkles
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2 - 1,
            life: 25,
            maxLife: 25,
            color: '#00FF00',
            size: Math.random() * 3 + 1,
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy -= 0.1; // Float upward
                this.life--;
            },
            draw: function(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
    }
}
// --- Farm UI System ---

// Farm UI Elements
let farmUIElements = {};

function showFarmUI() {
    // Create farm UI container
    const farmUI = document.createElement('div');
    farmUI.id = 'farm-ui';
    farmUI.innerHTML = `
        <div id="farm-header" style="
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            border: 2px solid #27ae60;
        ">
            🌱 VƯỜN CÂY BÍ MẬT 🌱
        </div>
        
        <div id="farm-instructions" style="
            position: absolute;
            top: 60px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            max-width: 200px;
            border: 1px solid #27ae60;
        ">
            <strong>Hướng dẫn:</strong><br>
            🌱 Click đất để trồng cây<br>
            💧 Click cây để tưới nước<br>
            🌾 Click cây trưởng thành để thu hoạch<br>
            ⚠️ Cây sẽ chết nếu không tưới nước!<br>
            📦 Cây trồng trong khu 3x3<br>
            ⏱️ Tưới nước mỗi 5-10 giây
            🪣 Biểu tượng bình tưới sẽ hiện khi cần tưới
        </div>
        
        <div id="farm-stats" style="
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            border: 1px solid #27ae60;
            min-width: 150px;
        ">
            <div>💰 Kiếm được: <span id="farm-earnings">0</span>$</div>
            <div>🌾 Đã thu hoạch: <span id="farm-harvested">0</span></div>
            <div>💧 Giá tưới: <span id="water-cost">5</span>$</div>
        </div>
        
        <div id="crop-selector" style="
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 10px;
            border-radius: 10px;
            display: flex;
            gap: 10px;
            border: 2px solid #27ae60;
        ">
            <button class="crop-btn" data-crop="carrot" style="
                background: #ff6b35;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 11px;
                font-weight: bold;
            ">
                🥕 Cà Rốt<br>10$ → 25$<br>60s
            </button>
            <button class="crop-btn" data-crop="wheat" style="
                background: #f4d03f;
                color: black;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 11px;
                font-weight: bold;
            ">
                🌾 Lúa Mì<br>15$ → 40$<br>90s
            </button>
            <button class="crop-btn" data-crop="pumpkin" style="
                background: #e67e22;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 11px;
                font-weight: bold;
            ">
                🎃 Bí Ngô<br>25$ → 70$<br>120s
            </button>
        </div>
    `;
    
    document.body.appendChild(farmUI);
    
    // Add event listeners
    setTimeout(() => {
        document.querySelectorAll('.crop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cropType = btn.getAttribute('data-crop');
                selectedCropType = cropType;
                
                // Visual feedback
                document.querySelectorAll('.crop-btn').forEach(b => b.style.border = 'none');
                btn.style.border = '2px solid #f1c40f';
                
                console.log(`🌱 Selected crop: ${cropType}`);
            });
        });
        
        // Update farm stats
        updateFarmStats();
    }, 100);
}

function hideFarmUI() {
    const farmUI = document.getElementById('farm-ui');
    if (farmUI) {
        farmUI.remove();
    }
    selectedCropType = null;
}

function hideCombatUI() {
    // Hide header stats
    const header = document.querySelector('header');
    if (header) {
        header.style.display = 'none';
    }
    
    // Hide tower controls
    const controls = document.getElementById('controls');
    if (controls) {
        controls.style.display = 'none';
    }
    
    // Hide towers panel
    const towersPanel = document.getElementById('towers-panel');
    if (towersPanel) {
        towersPanel.style.display = 'none';
    }
    
    // Hide damage stats
    const damageStats = document.getElementById('damage-stats');
    if (damageStats) {
        damageStats.style.display = 'none';
    }
    
    // Hide next wave button
    const nextWaveContainer = document.getElementById('next-wave-container');
    if (nextWaveContainer) {
        nextWaveContainer.style.display = 'none';
    }
}

function showCombatUI() {
    // Show header stats
    const header = document.querySelector('header');
    if (header) {
        header.style.display = 'flex';
    }
    
    // Show tower controls
    const controls = document.getElementById('controls');
    if (controls) {
        controls.style.display = 'flex';
    }
    
    // Show towers panel if it was open
    const towersPanel = document.getElementById('towers-panel');
    if (towersPanel && !towersPanel.classList.contains('hidden')) {
        towersPanel.style.display = 'block';
    }
    
    // Show damage stats
    const damageStats = document.getElementById('damage-stats');
    if (damageStats) {
        damageStats.style.display = 'block';
    }
    
    // Show next wave button
    const nextWaveContainer = document.getElementById('next-wave-container');
    if (nextWaveContainer) {
        nextWaveContainer.style.display = 'block';
    }
}

function drawFarmUI(ctx) {
    // This function is called from the farm loop to draw any additional UI elements
    // Currently handled by HTML/CSS, but can add canvas-drawn elements here if needed
}

function updateFarmStats() {
    const earningsEl = document.getElementById('farm-earnings');
    const harvestedEl = document.getElementById('farm-harvested');
    const waterCostEl = document.getElementById('water-cost');
    
    if (earningsEl) earningsEl.textContent = farmMoneyEarned;
    if (harvestedEl) harvestedEl.textContent = totalCropsHarvested;
    if (waterCostEl) waterCostEl.textContent = FARM_CONFIG.farmMap.waterCost;
}

function showFarmPortal() {
    // Don't show portal if already in farm mode
    if (farmMode) {
        console.log('🚫 Not showing farm portal - already in farm mode');
        return;
    }
    
    // Create portal element for switching to farm
    const portal = document.createElement('div');
    portal.id = 'farm-portal';
    portal.innerHTML = `
        <div style="
            position: absolute;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            background: linear-gradient(135deg, #2ecc71, #27ae60);
            color: white;
            padding: 20px;
            border-radius: 15px;
            cursor: pointer;
            border: 3px solid #27ae60;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 0 20px rgba(46, 204, 113, 0.5);
            transition: all 0.3s ease;
            animation: portalGlow 3s infinite alternate;
        ">
            <div style="font-size: 24px; margin-bottom: 5px;">🌱</div>
            <div>VÀO</div>
            <div>VƯỜN</div>
            <div style="font-size: 24px; margin-top: 5px;">🌱</div>
        </div>
    `;
    
    document.body.appendChild(portal);
    
    portal.addEventListener('click', () => {
        switchToFarm();
    });
    
    // Add hover effects
    const portalDiv = portal.querySelector('div');
    portalDiv.addEventListener('mouseenter', () => {
        portalDiv.style.transform = 'translateY(-50%) scale(1.1)';
        portalDiv.style.boxShadow = '0 0 30px rgba(46, 204, 113, 0.8)';
    });
    
    portalDiv.addEventListener('mouseleave', () => {
        portalDiv.style.transform = 'translateY(-50%) scale(1)';
        portalDiv.style.boxShadow = '0 0 20px rgba(46, 204, 113, 0.5)';
    });
    
    console.log('✅ Farm portal shown');
}

function hideFarmPortal() {
    const portal = document.getElementById('farm-portal');
    if (portal) {
        portal.remove();
        console.log('🚫 Farm portal hidden');
    }
}

function showReturnPortal() {
    // Create portal for returning to tower mode
    const portal = document.createElement('div');
    portal.id = 'return-portal';
    portal.innerHTML = `
        <div style="
            position: absolute;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 20px;
            border-radius: 15px;
            cursor: pointer;
            border: 3px solid #c0392b;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 0 20px rgba(231, 76, 60, 0.5);
            transition: all 0.3s ease;
            animation: portalGlow 3s infinite alternate-reverse;
        ">
            <div style="font-size: 24px; margin-bottom: 5px;">🏰</div>
            <div>QUAY</div>
            <div>LẠI</div>
            <div style="font-size: 24px; margin-top: 5px;">🏰</div>
        </div>
    `;
    
    document.body.appendChild(portal);
    
    portal.addEventListener('click', () => {
        switchToTower();
    });
    
    // Add hover effects
    const portalDiv = portal.querySelector('div');
    portalDiv.addEventListener('mouseenter', () => {
        portalDiv.style.transform = 'translateY(-50%) scale(1.1)';
        portalDiv.style.boxShadow = '0 0 30px rgba(231, 76, 60, 0.8)';
    });
    
    portalDiv.addEventListener('mouseleave', () => {
        portalDiv.style.transform = 'translateY(-50%) scale(1)';
        portalDiv.style.boxShadow = '0 0 20px rgba(231, 76, 60, 0.5)';
    });
}

function hideReturnPortal() {
    const portal = document.getElementById('return-portal');
    if (portal) {
        portal.remove();
    }
}

// Add CSS animations
const farmStyles = document.createElement('style');
farmStyles.textContent = `
    @keyframes pulse {
        0% { transform: translateY(-50%) scale(1); }
        50% { transform: translateY(-50%) scale(1.05); }
        100% { transform: translateY(-50%) scale(1); }
    }
    
    @keyframes portalGlow {
        0% { 
            box-shadow: 0 0 20px rgba(46, 204, 113, 0.5);
            border-color: #27ae60;
        }
        100% { 
            box-shadow: 0 0 40px rgba(46, 204, 113, 0.8), 0 0 60px rgba(46, 204, 113, 0.4);
            border-color: #2ecc71;
        }
    }
    
    .crop-btn:hover {
        transform: scale(1.05);
        transition: transform 0.2s;
    }
    
    .crop-btn:active {
        transform: scale(0.95);
    }
`;
document.head.appendChild(farmStyles);

// Global variable for selected crop type
let selectedCropType = null;
// --- Input Handling ---

document.addEventListener('keydown', (e) => {
    // Tab key to switch between farm and tower modes
    if (e.key === 'Tab') {
        e.preventDefault();
        if (farmMode) {
            switchToTower();
        } else {
            switchToFarm();
        }
        return;
    }
    
    // Number keys for tower selection (only in tower mode)
    if (!farmMode) {
        if (e.key === '1') selectTower('basic');
        if (e.key === '2') selectTower('ice');
        if (e.key === '3') selectTower('poison');
        if (e.key === '4') selectTower('sniper');
        if (e.key === '5') selectTower('tesla');
        if (e.key === '6') selectTower('laser');
        if (e.key === '7') selectTower('rocket');
        if (e.key === '8') selectTower('support');
    }
});

document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

document.addEventListener('click', (e) => {
    if (!gameRunning) {
        console.log('Game chưa chạy');
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Kiểm tra xem click có nằm trong canvas không
    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
        console.log(`Click ngoài canvas: x=${x}, y=${y}`);
        return;
    }
    
    // Farm mode handling
    if (farmMode) {
        handleFarmClick(x, y);
        return;
    }
    
    // Tower mode handling (original logic)
    const c = Math.floor(x / TILE_SIZE);
    const r = Math.floor(y / TILE_SIZE);

    // Kiểm tra click vào tháp hiện có để nâng cấp
    for (let tower of towers) {
        if (tower.c === c && tower.r === r) {
            const config = TOWER_CONFIG[tower.type];
            if (tower.level >= config.maxLevel) {
                alert('Tháp này đã ở mức tối đa!');
                return;
            }
            const baseCost = config.upgradeCost(tower.level);
            const multiplier = getCurrentUpgradeCostMultiplier();
            const cost = Math.floor(baseCost * multiplier);
            if (money < cost) {
                alert(`Cần ${cost}$ để nâng cấp, bạn có ${money}$`);
                return;
            }
            if (tower.upgrade()) {
                updateUI();
                console.log(`Nâng cấp ${tower.type} lên level ${tower.level}`);
            }
            return;
        }
    }
    
    // Nếu không phải click vào tháp hiện có, thì xây dựng tháp mới
    if (!selectedTowerType) {
        console.log('Chưa chọn loại tháp');
        return;
    }

    console.log(`Click tại: x=${x}, y=${y}, col=${c}, row=${r}`);
    console.log(`Grid value: ${mapGrid[r]?.[c]}, gameRunning=${gameRunning}, selectedTower=${selectedTowerType}`);

    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        if (mapGrid[r][c] === 0) {
            let hasTower = towers.some(t => t.c === c && t.r === r);
            if (!hasTower) {
                buildTower(c, r);
            } else {
                console.log('Ô này đã có tháp rồi');
            }
        } else {
            console.log('Ô này là đường đi, không thể xây dựng');
        }
    }
});

function handleFarmClick(x, y) {
    const cell = pixelToFarmCell(x, y);
    if (!cell) return;
    const r = cell.row;
    const c = cell.col;
    console.log(`Farm click at: x=${x}, y=${y}, col=${c}, row=${r}`);
    const crop = farmGrid[r][c];
    
    if (crop && crop.isAlive) {
        // Click on existing crop
        if (crop.stage >= crop.maxStage) {
            // Harvest if ready
            const value = harvestCrop(r, c);
            if (value > 0) {
                console.log(`🌾 Harvested crop for ${value}$`);
            }
        } else {
            // Water the crop
            const watered = waterCrop(r, c);
            if (watered) {
                console.log(`💧 Watered crop at (${r}, ${c})`);
            }
        }
    } else if (selectedCropType) {
        // Plant new crop with exact click coordinates for animation
        const planted = plantCrop(selectedCropType, r, c, x, y);
        if (planted) {
            console.log(`🌱 Planted ${selectedCropType} at (${r}, ${c}) with animation at (${x}, ${y})`);
        }
    } else {
        console.log('No crop selected to plant');
    }
}

function selectTower(type) {
    const config = TOWER_CONFIG[type];
    const multiplier = getCurrentTowerCostMultiplier();
    const actualCost = Math.floor(config.cost * multiplier);
    console.log(`Chọn tháp: ${type}, chi phí gốc: ${config.cost}, chi phí thực: ${actualCost}, tiền: ${money}`);
    if (money >= actualCost) {
        selectedTowerType = type;
        console.log(`✓ Đã chọn ${type}`);
        document.querySelectorAll('.tower-select').forEach(el => el.classList.remove('selected'));
        document.getElementById('btn-' + type).classList.add('selected');
    } else {
        console.log(`✗ Không đủ tiền để chọn ${type}`);
        alert(`Cần ${actualCost}$ để mua ${config.name}, bạn chỉ có ${money}$`);
    }
}

function buildTower(c, r) {
    const config = TOWER_CONFIG[selectedTowerType];
    const multiplier = getCurrentTowerCostMultiplier();
    const actualCost = Math.floor(config.cost * multiplier);
    console.log(`Xây dựng tháp: ${selectedTowerType} tại (${c}, ${r}), chi phí gốc: ${config.cost}, chi phí thực: ${actualCost}, tiền: ${money}`);
    if (money >= actualCost) {
        money -= actualCost;
        towers.push(new Tower(c, r, selectedTowerType));
        createParticles(c*TILE_SIZE + TILE_SIZE/2, r*TILE_SIZE + TILE_SIZE/2, '#fff', 10);
        updateUI();
        console.log(`✓ Xây dựng thành công, tiền còn lại: ${money}`);
    } else {
        console.log(`✗ Không đủ tiền để xây dựng`);
    }
}

// Thêm sự kiện chuột phải để hủy chọn súng
document.addEventListener('contextmenu', (e) => {
    // Kiểm tra xem click có phải trên canvas không
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Chỉ xử lý nếu click trong phạm vi canvas
    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
        return;
    }
    
    e.preventDefault(); // Ngăn menu context mặc định
    console.log('🖱️ Chuột phải detected trên canvas');
    
    if (!gameRunning) {
        console.log('Game chưa chạy - không thể hủy chọn');
        return;
    }
    
    if (selectedTowerType) {
        // Hủy chọn súng hiện tại
        selectedTowerType = null;
        
        // Bỏ chọn tất cả các nút tháp
        document.querySelectorAll('.tower-select').forEach(el => {
            el.classList.remove('selected');
        });
        
        console.log('✓ Đã hủy chọn súng');
        
        // Có thể thêm hiệu ứng âm thanh hoặc hình ảnh nhỏ ở đây
        createParticles(mouseX, mouseY, '#ffffff', 5);
    } else {
        console.log('Không có súng nào được chọn để hủy');
    }
});

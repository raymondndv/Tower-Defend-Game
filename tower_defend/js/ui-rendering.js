// --- UI Rendering & Updates ---

function updateUI() {
    document.getElementById('lives').innerText = lives;
    document.getElementById('money').innerText = money;
    document.getElementById('wave').innerText = wave;
    
    // Cập nhật thông tin map
    updateMapInfo();
    
    // Cập nhật giá tháp thực tế và trạng thái nút
    for (let towerType in TOWER_CONFIG) {
        updateTowerButtonDisplay('btn-' + towerType, towerType);
    }
    
    // Cập nhật panel tháp
    updateTowersPanel();
}

function updateMapInfo() {
    const currentMap = getCurrentMap();
    if (currentMap) {
        document.getElementById('map-name').innerText = currentMap.name;
        
        // Ẩn text độ khó - chỉ hiển thị sao và thanh progress
        const difficultyText = document.getElementById('map-difficulty');
        difficultyText.style.display = 'none';
        
        // Cập nhật difficulty classes
        const container = document.getElementById('map-difficulty-container');
        const difficultyClasses = {
            1: 'difficulty-easy',
            2: 'difficulty-medium', 
            3: 'difficulty-hard',
            4: 'difficulty-very-hard',
            5: 'difficulty-extreme',
            6: 'difficulty-nightmare',
            7: 'difficulty-disaster',
            8: 'difficulty-impossible'
        };
        
        // Xóa tất cả classes cũ
        container.className = 'difficulty-indicator';
        
        // Thêm class mới
        const newClass = difficultyClasses[currentMap.difficulty] || 'difficulty-medium';
        container.classList.add(newClass);
        
        // Cập nhật thanh progress
        const fill = document.getElementById('difficulty-fill');
        const progress = (currentMap.difficulty / 8) * 100;
        fill.style.width = progress + '%';
        
        // Cập nhật sao
        updateDifficultyStars(currentMap.difficulty);
        
        // Thêm hiệu ứng pulse khi thay đổi độ khó
        container.style.animation = 'none';
        setTimeout(() => {
            container.style.animation = 'difficulty-pulse 0.6s ease-out';
        }, 10);
    }
}

function updateDifficultyStars(difficulty) {
    const starsContainer = document.getElementById('difficulty-stars');
    const maxStars = 5;
    const filledStars = Math.min(Math.ceil(difficulty / 1.6), maxStars);
    
    let starsHTML = '';
    for (let i = 0; i < maxStars; i++) {
        if (i < filledStars) {
            starsHTML += '<span class="difficulty-star">⭐</span>';
        } else {
            starsHTML += '<span class="difficulty-star" style="opacity: 0.3;">☆</span>';
        }
    }
    starsContainer.innerHTML = starsHTML;
}

function updateDamageStats() {
    const statsDiv = document.getElementById('damage-stats');
    if (!statsDiv) return;
    
    let html = '<h3>📊 THỐNG KÊ SÁT THƯƠNG</h3>';
    html += '<div class="damage-stat-row"><strong>Loại súng</strong><span>Sát thương</span></div>';
    
    const towerTypes = ['basic', 'ice', 'poison', 'sniper', 'tesla', 'laser', 'rocket', 'support'];
    
    for (let type of towerTypes) {
        const config = TOWER_CONFIG[type];
        const damage = damageStats[type] || 0;
        const icon = {
            'basic': '🏹',
            'ice': '❄️',
            'poison': '🧪',
            'sniper': '🔭',
            'tesla': '⚡',
            'laser': '🔴',
            'rocket': '🚀',
            'support': '✨'
        }[type];
        
        if (damage > 0) {
            html += `<div class="damage-stat-row">
                <span>${icon} ${config.name}</span>
                <span style="color: ${config.color}; font-weight: bold;">${damage.toFixed(0)}</span>
            </div>`;
        }
    }
    
    html += `<div class="damage-stat-row" style="border-top: 2px solid #f1c40f; padding-top: 8px; margin-top: 8px;">
        <strong>Tổng sát thương</strong>
        <span style="color: #f1c40f; font-weight: bold;">${damageStats.total.toFixed(0)}</span>
    </div>`;
    
    statsDiv.innerHTML = html;
}

function updateTowerButtonDisplay(id, towerType) {
    const btn = document.getElementById(id);
    if (!btn) {
        console.warn(`Không tìm thấy button với id: ${id}`);
        return;
    }
    
    const config = TOWER_CONFIG[towerType];
    const multiplier = getCurrentTowerCostMultiplier();
    const actualCost = Math.floor(config.cost * multiplier);
    
    console.log(`Cập nhật ${towerType}: giá gốc ${config.cost}$, multiplier ${multiplier}, giá thực ${actualCost}$`);
    
    // Cập nhật giá hiển thị
    const costElement = btn.querySelector('.tower-cost');
    if (costElement) {
        costElement.innerText = actualCost + '$';
        console.log(`Đã cập nhật giá cho ${towerType}: ${actualCost}$`);
    } else {
        console.warn(`Không tìm thấy cost element trong ${id}`);
    }
    
    // Cập nhật tooltip với giá mới
    const tooltipText = `${config.name} (${actualCost}$): ${config.description}`;
    btn.setAttribute('onmouseover', `showTooltip(event, '${tooltipText}')`);
    
    // Cập nhật trạng thái nút
    if (money < actualCost) {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    } else {
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
}

function updateTowerButtonState(id, cost) {
    const btn = document.getElementById(id);
    const multiplier = getCurrentTowerCostMultiplier();
    const actualCost = Math.floor(cost * multiplier);
    if (money < actualCost) {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    } else {
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
}

function drawPlacementPreview() {
    if (!selectedTowerType) return;
    
    const c = Math.floor(mouseX / TILE_SIZE);
    const r = Math.floor(mouseY / TILE_SIZE);

    if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
        let x = c * TILE_SIZE;
        let y = r * TILE_SIZE;
        
        let valid = mapGrid[r][c] === 0 && !towers.some(t => t.c === c && t.r === r);
        
        ctx.fillStyle = valid ? UI_COLORS.validPlacement : UI_COLORS.invalidPlacement;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        
        if (valid) {
            const range = TOWER_CONFIG[selectedTowerType].range;
            
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, range, 0, Math.PI*2);
            ctx.fillStyle = UI_COLORS.rangePreview;
            ctx.fill();
            ctx.strokeStyle = UI_COLORS.rangeStroke;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

function drawSynergyLines() {
    // Vẽ các đường kết nối giữa tháp có cộng hưởng
    for (let tower of towers) {
        for (let other of towers) {
            if (tower === other) continue;
            let dist = Math.hypot(other.x - tower.x, other.y - tower.y);
            if (dist > 150) continue; // Phạm vi cộng hưởng
            
            // Vẽ đường kết nối
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(tower.x, tower.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

function showTooltip(e, text) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerText = text;
    tooltip.style.display = 'block';
    
    // Hiển thị phía trên con trỏ
    const top = e.clientY - 40;
    const left = e.clientX - (tooltip.offsetWidth / 2);
    
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
}

function hideTooltip() {
    document.getElementById('tooltip').style.display = 'none';
}

function toggleTowersPanel() {
    const panel = document.getElementById('towers-panel');
    panel.classList.toggle('hidden');
}

function updateTowersPanel() {
    const list = document.getElementById('towers-list');
    
    // Tính số lượng tháp theo loại và level
    const towerStats = {};
    
    for (let tower of towers) {
        const key = `${tower.type}_level${tower.level}`;
        if (!towerStats[key]) {
            towerStats[key] = {
                type: tower.type,
                level: tower.level,
                count: 0
            };
        }
        towerStats[key].count++;
    }
    
    // Sắp xếp theo loại tháp
    const towerTypes = Object.keys(TOWER_CONFIG);
    let html = '';
    
    for (let type of towerTypes) {
        const entries = Object.values(towerStats).filter(t => t.type === type);
        
        if (entries.length === 0) continue;
        
        // Sắp xếp theo level giảm dần
        entries.sort((a, b) => b.level - a.level);
        
        const config = TOWER_CONFIG[type];
        const icon = {
            basic: '🏹',
            ice: '❄️',
            poison: '🧪',
            sniper: '🔭',
            tesla: '⚡',
            laser: '🔴',
            rocket: '🚀',
            support: '✨'
        }[type];
        
        for (let entry of entries) {
            html += `
                <div class="tower-item" style="border-left: 4px solid ${config.color};">
                    <div class="tower-item-info">
                        <div class="tower-item-name">${icon} ${config.name}</div>
                        <div class="tower-item-level">Cấp độ: <span style="color: ${config.color}; font-weight: bold;">${entry.level}</span></div>
                    </div>
                    <div class="tower-item-count">x${entry.count}</div>
                </div>
            `;
        }
    }
    
    if (html === '') {
        html = '<div class="tower-empty">Chưa xây dựng tháp nào</div>';
    }
    
    list.innerHTML = html;
}

function updateWaveButton() {
    const btn = document.getElementById('btn-next-wave');
    if (isWaveActive) {
        btn.innerText = `ĐANG ĐÁNH QUÁI... (${enemies.length + (enemiesToSpawnTotal - enemiesSpawnedCount)})`;
        btn.disabled = true;
        btn.style.backgroundColor = "#95a5a6";
        btn.style.animation = "none";
    } else {
        const baseReward = WAVE_CONFIG.baseReward + (wave * WAVE_CONFIG.rewardPerWave);
        const rewardMultiplier = getCurrentRewardMultiplier();
        const reward = Math.floor(baseReward * rewardMultiplier);
        btn.innerText = `⚔️ GỌI ĐỢT ${wave} (Thưởng: ${reward}$)`;
        btn.disabled = false;
        btn.style.backgroundColor = "#e74c3c";
        btn.style.animation = "pulse 2s infinite";
    }
}

function showGameOverScreen() {
    gameRunning = false;
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Bạn đã sống sót qua ${wave - 1} đợt tấn công!`;
}

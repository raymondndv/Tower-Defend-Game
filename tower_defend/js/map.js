// Map System - Quản lý nhiều bản đồ với độ khó tăng dần
let currentMapIndex = 0;
let currentMap = null;
let mapRotationCounter = 0; // Đếm số wave đã chơi trên map hiện tại

// Map Generation
// Tạo mảng 2 chiều toàn số 0
let mapGrid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let pathTiles = [];
let allPaths = []; // Lưu tất cả các đường đi có thể

// Hệ thống Map Management - Quản lý rotation và difficulty scaling
function getCurrentMap() {
    const mapIndex = Math.floor(wave / 5) % MAP_CONFIG.maps.length;
    return MAP_CONFIG.maps[mapIndex];
}

// Economy scaling functions
function getCurrentTowerCostMultiplier() {
    return currentMap ? currentMap.towerCostMultiplier : 1.0;
}

function getCurrentUpgradeCostMultiplier() {
    return currentMap ? currentMap.upgradeCostMultiplier : 1.0;
}

function getCurrentRewardMultiplier() {
    return currentMap ? currentMap.rewardMultiplier : 1.0;
}

function getCurrentMoneyMultiplier() {
    return currentMap ? currentMap.moneyMultiplier : 1.0;
}

function shouldChangeMap() {
    return wave > 0 && wave % 5 === 0;
}

function generateMapForWave(waveNumber) {
    const mapIndex = Math.floor((waveNumber - 1) / 5) % MAP_CONFIG.maps.length;
    const mapConfig = MAP_CONFIG.maps[mapIndex];
    currentMap = mapConfig;
    
    console.log(`🗺️  Generating Map: ${mapConfig.name} (Difficulty: ${mapConfig.difficulty})`);
    console.log(`📍 Map Index: ${mapIndex}, Wave: ${waveNumber}, Multi-path: ${Array.isArray(mapConfig.waypoints[0]) ? 'YES' : 'NO'}`);
    
    if (Array.isArray(mapConfig.waypoints[0])) {
        console.log(`🛤️  Multi-path detected: ${mapConfig.waypoints.length} paths`);
        for (let i = 0; i < mapConfig.waypoints.length; i++) {
            const path = mapConfig.waypoints[i];
            console.log(`   Path ${i + 1}: start (${path[0].x}, ${path[0].y}) → end (${path[path.length - 1].x}, ${path[path.length - 1].y})`);
        }
    } else {
        console.log(`🛤️  Single path detected`);
        const path = mapConfig.waypoints;
        console.log(`   Path: start (${path[0].x}, ${path[0].y}) → end (${path[path.length - 1].x}, ${path[path.length - 1].y})`);
    }
    
    pathTiles = [];
    mapGrid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    allPaths = [];
    
    // Sinh đường đi dựa trên waypoints của map
    if (mapConfig.waypoints) {
        if (Array.isArray(mapConfig.waypoints[0])) {
            // Nhiều đường đi (multi-path)
            allPaths = [];
            for (let pathWaypoints of mapConfig.waypoints) {
                let fullPath = [];
                for (let i = 0; i < pathWaypoints.length - 1; i++) {
                    const segment = findPathNodiagonal(pathWaypoints[i], pathWaypoints[i + 1]);
                    if (segment) {
                        fullPath = fullPath.concat(segment.slice(0, -1));
                    }
                }
                fullPath.push(pathWaypoints[pathWaypoints.length - 1]);
                allPaths.push(fullPath);
            }
            // Gộp tất cả path vào pathTiles để vẽ
            pathTiles = allPaths.flat();
        } else {
            // Một đường đi đơn
            let fullPath = [];
            for (let i = 0; i < mapConfig.waypoints.length - 1; i++) {
                const segment = findPathNodiagonal(mapConfig.waypoints[i], mapConfig.waypoints[i + 1]);
                if (segment) {
                    fullPath = fullPath.concat(segment.slice(0, -1));
                }
            }
            fullPath.push(mapConfig.waypoints[mapConfig.waypoints.length - 1]);
            
            allPaths = [fullPath];
            pathTiles = fullPath;
        }
    }
    
    // Đánh dấu tất cả các ô đường đi vào grid
    mapGrid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    pathTiles.forEach(tile => {
        if (tile && tile.x >= 0 && tile.x < COLS && tile.y >= 0 && tile.y < ROWS) {
            mapGrid[tile.y][tile.x] = 1;
        }
    });
    
    return mapConfig;
}

// Hàm cũ để tương thích - redirect sang hệ thống mới
function generateRandomMap() {
    return generateMapForWave(wave);
}

function generateSinglePath() {
    // Sinh đường đi với nhiều điểm giao nhau và rẽ cua
    const path = [];
    const startX = 0;
    const startY = Math.floor(Math.random() * (ROWS - 4)) + 2;
    const endX = COLS - 1;
    const endY = Math.floor(Math.random() * (ROWS - 4)) + 2;
    
    // Tạo waypoints trung gian để tạo đường phức tạp
    const waypoints = [
        {x: startX, y: startY},
        {x: Math.floor(COLS * 0.25), y: Math.floor(Math.random() * (ROWS - 4)) + 2},
        {x: Math.floor(COLS * 0.5), y: Math.floor(Math.random() * (ROWS - 4)) + 2},
        {x: Math.floor(COLS * 0.75), y: Math.floor(Math.random() * (ROWS - 4)) + 2},
        {x: endX, y: endY}
    ];
    
    // Kết nối các waypoint bằng A*
    let fullPath = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
        const segment = findPath(waypoints[i], waypoints[i + 1]);
        if (segment) {
            fullPath = fullPath.concat(segment.slice(0, -1)); // Tránh trùng điểm cuối
        }
    }
    fullPath.push(waypoints[waypoints.length - 1]); // Thêm điểm cuối
    
    return fullPath;
}

function generateSinglePathFromPoint(startPoint) {
    const endX = COLS - 1;
    const endY = Math.floor(Math.random() * (ROWS - 2)) + 1;
    return findPath(startPoint, {x: endX, y: endY});
}

// A* Pathfinding algorithm với heuristic điều chỉnh
function findPath(start, end) {
    const openSet = [start];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const key = (p) => `${p.x},${p.y}`;
    // Heuristic có độ lệch để tạo đường đi không quá thẳng
    const h = (p) => {
        const dx = Math.abs(p.x - end.x);
        const dy = Math.abs(p.y - end.y);
        // Thêm nhiễu để tạo đường cong hơn
        const noise = Math.sin(p.x * 0.3) * Math.sin(p.y * 0.3) * 3;
        return dx + dy * 1.5 + noise; // dy có weight cao hơn để tạo nhiều rẽ dọc
    };
    
    gScore.set(key(start), 0);
    fScore.set(key(start), h(start));
    
    let iterations = 0;
    const maxIterations = COLS * ROWS * 2;
    
    while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;
        
        // Tìm nút với f score thấp nhất
        let current = openSet[0];
        let currentIdx = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (fScore.get(key(openSet[i])) < fScore.get(key(current))) {
                current = openSet[i];
                currentIdx = i;
            }
        }
        
        if (current.x === end.x && current.y === end.y) {
            // Tái cấu trúc đường đi
            const path = [current];
            while (cameFrom.has(key(current))) {
                current = cameFrom.get(key(current));
                path.unshift(current);
            }
            return path;
        }
        
        openSet.splice(currentIdx, 1);
        
        // Kiểm tra láng giềng (8 hướng để tạo đường mượt hơn)
        const neighbors = [
            {x: current.x + 1, y: current.y},      // Phải
            {x: current.x - 1, y: current.y},      // Trái
            {x: current.x, y: current.y + 1},      // Dưới
            {x: current.x, y: current.y - 1},      // Trên
            {x: current.x + 1, y: current.y + 1},  // Chéo
            {x: current.x + 1, y: current.y - 1},  // Chéo
            {x: current.x - 1, y: current.y + 1},  // Chéo
            {x: current.x - 1, y: current.y - 1}   // Chéo
        ].filter(p => p.x >= 0 && p.x < COLS && p.y >= 0 && p.y < ROWS);
        
        for (let neighbor of neighbors) {
            // Chi phí di chuyển (đường chéo khó hơn)
            const isDiagonal = neighbor.x !== current.x && neighbor.y !== current.y;
            const moveCost = isDiagonal ? 1.4 : 1;
            const tentativeGScore = gScore.get(key(current)) + moveCost;
            const neighborKey = key(neighbor);
            
            if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + h(neighbor));
                
                if (!openSet.some(p => p.x === neighbor.x && p.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    
    // Nếu không tìm được đường, tạo đường thẳng
    return generateFallbackPath(start, end);
}

function generateFallbackPath(start, end) {
    const path = [];
    let x = start.x;
    let y = start.y;
    
    while (x !== end.x || y !== end.y) {
        path.push({x, y});
        if (x < end.x) x++;
        else if (x > end.x) x--;
        else if (y < end.y) y++;
        else if (y > end.y) y--;
    }
    path.push({x: end.x, y: end.y});
    return path;
}

// A* Pathfinding KHÔNG CÓ ĐƯỜNG CHÉO (chỉ lên/xuống/trái/phải)
function findPathNodiagonal(start, end) {
    const openSet = [start];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const key = (p) => `${p.x},${p.y}`;
    const h = (p) => {
        // Manhattan distance - không đường chéo
        return Math.abs(p.x - end.x) + Math.abs(p.y - end.y);
    };
    
    gScore.set(key(start), 0);
    fScore.set(key(start), h(start));
    
    let iterations = 0;
    const maxIterations = COLS * ROWS * 2;
    
    while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;
        
        // Tìm nút với f score thấp nhất
        let current = openSet[0];
        let currentIdx = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (fScore.get(key(openSet[i])) < fScore.get(key(current))) {
                current = openSet[i];
                currentIdx = i;
            }
        }
        
        if (current.x === end.x && current.y === end.y) {
            // Tái cấu trúc đường đi
            const path = [current];
            while (cameFrom.has(key(current))) {
                current = cameFrom.get(key(current));
                path.unshift(current);
            }
            return path;
        }
        
        openSet.splice(currentIdx, 1);
        
        // CHỈ 4 hướng: LÊN/XUỐNG/TRÁI/PHẢI (không chéo)
        const neighbors = [
            {x: current.x + 1, y: current.y},      // Phải
            {x: current.x - 1, y: current.y},      // Trái
            {x: current.x, y: current.y + 1},      // Dưới
            {x: current.x, y: current.y - 1}       // Trên
        ].filter(p => p.x >= 0 && p.x < COLS && p.y >= 0 && p.y < ROWS);
        
        for (let neighbor of neighbors) {
            const moveCost = 1; // Tất cả di chuyển đều bằng nhau
            const tentativeGScore = gScore.get(key(current)) + moveCost;
            const neighborKey = key(neighbor);
            
            if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + h(neighbor));
                
                if (!openSet.some(p => p.x === neighbor.x && p.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    
    return generateFallbackPath(start, end);
}

function drawMap() {
    // Vẽ nền cỏ
    ctx.fillStyle = '#2c3e50'; // Nền tối
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let x = c * TILE_SIZE;
            let y = r * TILE_SIZE;
            
            if (mapGrid[r][c] === 1) {
                // Đường đi
                ctx.fillStyle = UI_COLORS.pathColor;
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = UI_COLORS.pathStroke;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            } else {
                // Ô xây dựng
                ctx.strokeStyle = UI_COLORS.gridStroke;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
                
                // Chấm nhỏ
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 1, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }
    
    // Vẽ điểm bắt đầu (hang động) và điểm kết thúc (lâu đài)
    if (allPaths && allPaths.length > 0) {
        // Lấy tất cả điểm bắt đầu và kết thúc từ các đường đi
        const startPoints = [];
        const endPoints = [];
        
        console.log(`🗺️  Đang vẽ ${allPaths.length} đường đi`);
        
        for (let i = 0; i < allPaths.length; i++) {
            let path = allPaths[i];
            if (path && path.length > 0) {
                // Điểm bắt đầu
                const start = path[0];
                console.log(`   Đường ${i + 1}: Bắt đầu tại (${start.x}, ${start.y})`);
                if (start && start.x >= 0 && start.x < COLS && start.y >= 0 && start.y < ROWS) {
                    // Kiểm tra xem điểm này đã được thêm chưa để tránh trùng lặp
                    const isDuplicateStart = startPoints.some(point => point.x === start.x && point.y === start.y);
                    if (!isDuplicateStart) {
                        startPoints.push(start);
                        console.log(`   ✓ Thêm điểm bắt đầu mới: (${start.x}, ${start.y})`);
                    } else {
                        console.log(`   ➜ Bỏ qua điểm bắt đầu trùng lặp: (${start.x}, ${start.y})`);
                    }
                }
                
                // Điểm kết thúc
                const end = path[path.length - 1];
                console.log(`   Đường ${i + 1}: Kết thúc tại (${end.x}, ${end.y})`);
                if (end && end.x >= 0 && end.x < COLS && end.y >= 0 && end.y < ROWS) {
                    // Kiểm tra xem điểm này đã được thêm chưa để tránh trùng lặp
                    const isDuplicateEnd = endPoints.some(point => point.x === end.x && point.y === end.y);
                    if (!isDuplicateEnd) {
                        endPoints.push(end);
                        console.log(`   ✓ Thêm điểm kết thúc mới: (${end.x}, ${end.y})`);
                    } else {
                        console.log(`   ➜ Bỏ qua điểm kết thúc trùng lặp: (${end.x}, ${end.y})`);
                    }
                }
            }
        }
        
        console.log(`📊 Tổng cộng: ${startPoints.length} điểm bắt đầu, ${endPoints.length} điểm kết thúc`);
        
        // Vẽ tất cả điểm bắt đầu (hang động)
        for (let start of startPoints) {
            drawCaveEntrance(start.x * TILE_SIZE, start.y * TILE_SIZE);
        }
        
        // Vẽ tất cả điểm kết thúc (lâu đài)
        for (let end of endPoints) {
            drawCastle(end.x * TILE_SIZE, end.y * TILE_SIZE);
        }
    } else if (pathTiles && pathTiles.length > 0) {
        // Fallback cho trường hợp single path
        let start = pathTiles[0];
        let end = pathTiles[pathTiles.length - 1];
        
        if (start && start.x >= 0 && start.x < COLS && start.y >= 0 && start.y < ROWS) {
            drawCaveEntrance(start.x * TILE_SIZE, start.y * TILE_SIZE);
        }

        if (end && end.x >= 0 && end.x < COLS && end.y >= 0 && end.y < ROWS) {
            drawCastle(end.x * TILE_SIZE, end.y * TILE_SIZE);
        }
    }
}

// Vẽ hang động - điểm bắt đầu
function drawCaveEntrance(x, y) {
    const centerX = x + TILE_SIZE / 2;
    const centerY = y + TILE_SIZE / 2;
    
    // Hiệu ứng glow nhấp nháy cho hang động
    const glowIntensity = 0.3 + Math.sin(Date.now() * 0.003) * 0.2;
    
    // Vẽ glow ngoài cùng
    ctx.shadowColor = 'rgba(100, 150, 200, ' + glowIntensity + ')';
    ctx.shadowBlur = 15;
    
    // Nền đá tối
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    
    // Viền hang động
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    
    // Vẽ miệng hang (hình bán nguyệt)
    ctx.fillStyle = '#0d0d0d';
    ctx.beginPath();
    ctx.arc(centerX, centerY + 5, 12, 0, Math.PI, true);
    ctx.fill();
    
    // Viền miệng hang
    ctx.strokeStyle = '#666666';
    ctx.beginPath();
    ctx.arc(centerX, centerY + 5, 12, 0, Math.PI, true);
    ctx.stroke();
    
    // Vẽ đá nhọn trên đầu hang
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.moveTo(centerX - 8, centerY - 8);
    ctx.lineTo(centerX, centerY - 15);
    ctx.lineTo(centerX + 8, centerY - 8);
    ctx.closePath();
    ctx.fill();
    
    // Vẽ đá nhọn nhỏ
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY - 5);
    ctx.lineTo(centerX - 8, centerY - 10);
    ctx.lineTo(centerX - 4, centerY - 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 4, centerY - 5);
    ctx.lineTo(centerX + 8, centerY - 10);
    ctx.lineTo(centerX + 12, centerY - 5);
    ctx.closePath();
    ctx.fill();
    
    // Vẽ ánh sáng lờ mờ từ trong hang với hiệu ứng nhấp nháy
    ctx.fillStyle = 'rgba(100, 150, 200, ' + (0.2 + glowIntensity * 0.5) + ')';
    ctx.beginPath();
    ctx.arc(centerX, centerY + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Reset line width
    ctx.lineWidth = 1;
}

// Vẽ lâu đài - điểm kết thúc
function drawCastle(x, y) {
    const centerX = x + TILE_SIZE / 2;
    const centerY = y + TILE_SIZE / 2;
    
    // Hiệu ứng glow cho lâu đài
    const glowIntensity = 0.4 + Math.sin(Date.now() * 0.002) * 0.3;
    
    // Vẽ glow ngoài cùng
    ctx.shadowColor = 'rgba(255, 215, 0, ' + glowIntensity + ')';
    ctx.shadowBlur = 20;
    
    // Nền lâu đài
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    
    // Vẽ thân lâu đài
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(x + 4, y + 8, TILE_SIZE - 8, TILE_SIZE - 8);
    
    // Vẽ tháp chính
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(x + 10, y + 2, 20, 26);
    
    // Vẽ mái tháp chính
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 2);
    ctx.lineTo(centerX, y - 2);
    ctx.lineTo(x + 30, y + 2);
    ctx.closePath();
    ctx.fill();
    
    // Vẽ tháp phụ bên trái
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(x + 2, y + 6, 8, 20);
    
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 6);
    ctx.lineTo(x + 6, y + 2);
    ctx.lineTo(x + 10, y + 6);
    ctx.closePath();
    ctx.fill();
    
    // Vẽ tháp phụ bên phải
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(x + 30, y + 6, 8, 20);
    
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 6);
    ctx.lineTo(x + 34, y + 2);
    ctx.lineTo(x + 38, y + 6);
    ctx.closePath();
    ctx.fill();
    
    // Vẽ cổng chính
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(centerX - 3, y + 18, 6, 10);
    
    // Vẽ cửa sổ với hiệu ứng sáng
    ctx.fillStyle = 'rgba(65, 105, 225, ' + (0.6 + glowIntensity * 0.4) + ')';
    ctx.fillRect(x + 12, y + 8, 3, 3);
    ctx.fillRect(x + 25, y + 8, 3, 3);
    ctx.fillRect(x + 18, y + 15, 4, 4);
    
    // Vẽ lá cờ với hiệu ứng động
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(centerX - 1, y - 2, 2, 8);
    
    ctx.fillStyle = 'rgba(255, 0, 0, ' + (0.7 + glowIntensity * 0.3) + ')';
    ctx.beginPath();
    ctx.moveTo(centerX + 1, y);
    ctx.lineTo(centerX + 6, y + 2);
    ctx.lineTo(centerX + 1, y + 4);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Viền chi tiết
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 8, TILE_SIZE - 8, TILE_SIZE - 8);
}

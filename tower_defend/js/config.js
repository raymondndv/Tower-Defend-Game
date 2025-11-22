// --- Game Configuration & Constants ---

// Map Settings
const TILE_SIZE = 40;
const COLS = 30; // 1200px
const ROWS = 20; // 800px

// Tower Configuration
const TOWER_CONFIG = {
    basic: {
        cost: 50,
        range: 140,
        baseDamage: 25,
        damagePerLevel: 5,
        fireRate: 30,
        color: '#27ae60',
        name: 'Cung Thủ',
        description: 'Rẻ, tốc độ trung bình',
        maxLevel: 5,
        upgradeCost: (level) => 50 * level
    },
    ice: {
        cost: 75,
        range: 120,
        baseDamage: 0,
        damagePerLevel: 0,
        fireRate: 60,
        color: '#3498db',
        name: 'Băng Giá',
        description: 'Làm chậm, KHÔNG sát thương',
        maxLevel: 5,
        upgradeCost: (level) => 75 * level
    },
    poison: {
        cost: 100,
        range: 150,
        baseDamage: 15,
        damagePerLevel: 4,
        fireRate: 45,
        color: '#8e44ad',
        name: 'Độc Dược',
        description: 'Rút máu theo thời gian',
        maxLevel: 5,
        upgradeCost: (level) => 100 * level
    },
    sniper: {
        cost: 150,
        range: 350,
        baseDamage: 180,
        damagePerLevel: 25,
        fireRate: 100,
        color: '#34495e',
        name: 'Bắn Tỉa',
        description: 'Bắn chậm, sát thương CỰC LỚN',
        maxLevel: 5,
        upgradeCost: (level) => 150 * level
    },
    tesla: {
        cost: 120,
        range: 100,
        baseDamage: 20,
        damagePerLevel: 4,
        fireRate: 25,
        color: '#f1c40f',
        name: 'Tesla',
        description: 'Bắn xích điện, ăn cơm từng nhân',
        maxLevel: 5,
        upgradeCost: (level) => 120 * level
    },
    laser: {
        cost: 180,
        range: 250,
        baseDamage: 45,
        damagePerLevel: 7,
        fireRate: 50,
        color: '#e74c3c',
        name: 'Laser',
        description: 'Xuyên qua quái, bắn chậm',
        maxLevel: 5,
        upgradeCost: (level) => 180 * level
    },
    rocket: {
        cost: 200,
        range: 180,
        baseDamage: 60,
        damagePerLevel: 10,
        fireRate: 70,
        color: '#e67e22',
        name: 'Rocket',
        description: 'Nổ diện rộng, làm chậm',
        maxLevel: 5,
        upgradeCost: (level) => 200 * level
    },
    support: {
        cost: 160,
        range: 150,
        baseDamage: 0,
        damagePerLevel: 0,
        fireRate: 0,
        color: '#9b59b6',
        name: 'Support',
        description: 'Tăng cộng hưởng tháp gần đó',
        maxLevel: 5,
        upgradeCost: (level) => 160 * level
    }
};

// Enemy Configuration
const ENEMY_CONFIG = {
    baseHealth: 30,
    healthPerWave: 25,
    baseSpeed: 1.2,
    speedPerWave: 0.1,
    bossHealthMultiplier: 2.2,
    bossSpeedMultiplier: 0.7,
    bossWaveInterval: 5,
    poisonDamagePerTick: 3,
    poisonDamagePerWave: 0.5,
    freezeDuration: 60,
    poisonDuration: 180,
    // Enemy types
    types: {
        normal: { healthMult: 1, speedMult: 1, armorMult: 1, name: 'Bình thường', requiredWeapon: null },
        fast: { healthMult: 0.6, speedMult: 1.8, armorMult: 0.5, name: 'Nhanh nhẹn', requiredWeapon: null },
        armored: { healthMult: 1.8, speedMult: 0.6, armorMult: 0.7, name: 'Giáp dày', requiredWeapon: null },
        flying: { healthMult: 1.2, speedMult: 1.4, armorMult: 0.8, name: 'Bay', immuneToEffect: ['freeze'], requiredWeapon: null },
        resilient: { healthMult: 1.5, speedMult: 1, armorMult: 0.9, name: 'Miễn độc', immuneToEffect: ['poison'], requiredWeapon: null },
        // Quái chỉ chịu sát thương từ loại súng cố định
        basicImmune: { healthMult: 1.3, speedMult: 1, armorMult: 1, name: 'Kháng năng lượng', onlyDamageType: 'basic', immuneToEffect: [], requiredWeapon: 'basic' },
        laserImmune: { healthMult: 1.4, speedMult: 0.9, armorMult: 1, name: 'Phản xạ', onlyDamageType: 'laser', immuneToEffect: ['freeze', 'poison'], requiredWeapon: 'laser' },
        
        // Quái đặc biệt mới - yêu cầu chiến thuật cụ thể
        ghost: { healthMult: 0.8, speedMult: 1.2, armorMult: 1, name: 'Ma ảo', onlyDamageType: 'sniper', immuneToEffect: ['freeze', 'poison'], requiredWeapon: 'sniper' },
        mirror: { healthMult: 1.5, speedMult: 0.8, armorMult: 0.6, name: 'Gương phản chiếu', immuneToLaser: true, onlyDamageType: null, immuneToEffect: ['freeze', 'poison'], requiredWeapon: null },
        timebender: { healthMult: 2.0, speedMult: 1.5, armorMult: 1, name: 'Thời gian', requiresFreeze: true, onlyDamageType: null, immuneToEffect: [], requiredWeapon: null },
        virus: { healthMult: 1.6, speedMult: 1.1, armorMult: 1, name: 'Virus', onlyDamageType: 'poison', immuneToEffect: ['freeze'], requiredWeapon: 'poison' },
        chainbreaker: { healthMult: 1.8, speedMult: 0.9, armorMult: 0.8, name: 'Phá vỡ chuỗi', onlyDamageType: 'tesla', immuneToEffect: [], requiredWeapon: 'tesla' }
    }
};

// Map Configuration - 6 maps với độ khó tăng dần
const MAP_CONFIG = {
    maps: [
        {
            id: 1,
            name: 'Thung Lũng Khó Khăn',
            difficulty: 3,
            description: 'Đường đi uốn lượn qua thung lũng - thách thức ngay từ đầu',
            // Economy scaling - khó ngay từ đầu
            moneyMultiplier: 0.8,
            rewardMultiplier: 1.1,
            towerCostMultiplier: 1.15,
            upgradeCostMultiplier: 1.2,
            // Map characteristics - phức tạp ngay từ map đầu
            pathComplexity: 'complex',
            optimalTowerSpots: 15, // Ít chỗ đặt tháp tối ưu
            pathLength: 'long',
            // Waypoints cho đường đi uốn lượn phức tạp
            waypoints: [
                {x: 0, y: 8}, {x: 6, y: 8}, {x: 6, y: 4}, {x: 12, y: 4}, {x: 12, y: 12}, 
                {x: 18, y: 12}, {x: 18, y: 6}, {x: 24, y: 6}, {x: 24, y: 14}, {x: 29, y: 14}
            ]
        },
        {
            id: 2,
            name: 'Song Song Đôi',
            difficulty: 4,
            description: 'Hai đường đi song song - chia lực lượng phòng thủ ngay từ sớm',
            moneyMultiplier: 0.75,
            rewardMultiplier: 1.2,
            towerCostMultiplier: 1.2,
            upgradeCostMultiplier: 1.3,
            pathComplexity: 'complex',
            optimalTowerSpots: 12, // Ít chỗ hơn, phải chọn lọc kỹ
            pathLength: 'long',
            waypoints: [
                // Đường 1
                [{x: 0, y: 6}, {x: 8, y: 6}, {x: 8, y: 12}, {x: 16, y: 12}, {x: 16, y: 6}, {x: 24, y: 6}, {x: 24, y: 12}, {x: 29, y: 12}],
                // Đường 2  
                [{x: 0, y: 14}, {x: 8, y: 14}, {x: 8, y: 8}, {x: 16, y: 8}, {x: 16, y: 14}, {x: 24, y: 14}, {x: 24, y: 8}, {x: 29, y: 8}]
            ]
        },
        {
            id: 3,
            name: 'Xoáy Tornado',
            difficulty: 5,
            description: 'Đường xoáy ốc cực kỳ phức tạp - tháp phải bắn được mọi góc độ',
            moneyMultiplier: 0.7,
            rewardMultiplier: 1.3,
            towerCostMultiplier: 1.25,
            upgradeCostMultiplier: 1.4,
            pathComplexity: 'maze',
            optimalTowerSpots: 8, // Rất ít chỗ, phải tính toán cực kỳ kỹ
            pathLength: 'very_long',
            waypoints: [
                {x: 0, y: 10}, {x: 6, y: 10}, {x: 6, y: 4}, {x: 18, y: 4}, {x: 18, y: 16}, 
                {x: 10, y: 16}, {x: 10, y: 6}, {x: 22, y: 6}, {x: 22, y: 14}, {x: 14, y: 14}, 
                {x: 14, y: 8}, {x: 26, y: 8}, {x: 26, y: 12}, {x: 29, y: 12}
            ]
        },
        {
            id: 4,
            name: 'Mê Cung Tử Thần',
            difficulty: 6,
            description: 'Mê cung cực kỳ phức tạp - chỉ có 5 chỗ đặt tháp tốt',
            moneyMultiplier: 0.65,
            rewardMultiplier: 1.5,
            towerCostMultiplier: 1.3,
            upgradeCostMultiplier: 1.6,
            pathComplexity: 'nightmare',
            optimalTowerSpots: 5, // Cực kỳ ít chỗ, phải tính toán kỹ lưỡng
            pathLength: 'very_long',
            waypoints: [
                // 4 đường đi với độ dài khác nhau
                [{x: 0, y: 4}, {x: 5, y: 4}, {x: 5, y: 16}, {x: 12, y: 16}, {x: 12, y: 6}, {x: 18, y: 6}, {x: 18, y: 12}, {x: 25, y: 12}, {x: 25, y: 8}, {x: 29, y: 8}],
                [{x: 0, y: 8}, {x: 8, y: 8}, {x: 8, y: 18}, {x: 15, y: 18}, {x: 15, y: 2}, {x: 22, y: 2}, {x: 22, y: 16}, {x: 29, y: 16}],
                [{x: 0, y: 12}, {x: 10, y: 12}, {x: 10, y: 5}, {x: 20, y: 5}, {x: 20, y: 18}, {x: 26, y: 18}, {x: 26, y: 10}, {x: 29, y: 10}],
                [{x: 0, y: 16}, {x: 7, y: 16}, {x: 7, y: 8}, {x: 14, y: 8}, {x: 14, y: 14}, {x: 21, y: 14}, {x: 21, y: 4}, {x: 28, y: 4}, {x: 28, y: 12}, {x: 29, y: 12}]
            ]
        },
        {
            id: 5,
            name: 'Ác Mộng Vô Tận',
            difficulty: 7,
            description: 'Đường đi cực ngắn nhưng cực kỳ khó - chỉ có 3 chỗ đặt tháp tốt',
            moneyMultiplier: 0.5,
            rewardMultiplier: 1.8,
            towerCostMultiplier: 1.4,
            upgradeCostMultiplier: 2.0,
            pathComplexity: 'nightmare',
            optimalTowerSpots: 3, // Cực kỳ ít chỗ, phải tính toán hoàn hảo
            pathLength: 'short',
            waypoints: [
                {x: 0, y: 10}, {x: 4, y: 10}, {x: 4, y: 6}, {x: 12, y: 6}, 
                {x: 12, y: 14}, {x: 20, y: 14}, {x: 20, y: 8}, {x: 26, y: 8}, {x: 26, y: 12}, {x: 29, y: 12}
            ]
        },
        {
            id: 6,
            name: 'Tháp Quỷ Dữ',
            difficulty: 8,
            description: 'Boss Finale - Đường đi cực ngắn, chỉ có 1 chỗ đặt tháp duy nhất',
            moneyMultiplier: 0.4,
            rewardMultiplier: 2.0,
            towerCostMultiplier: 1.5,
            upgradeCostMultiplier: 2.5,
            pathComplexity: 'nightmare',
            optimalTowerSpots: 1, // Chỉ có 1 chỗ duy nhất để đặt tháp
            pathLength: 'very_short',
            waypoints: [
                {x: 0, y: 10}, {x: 3, y: 10}, {x: 3, y: 7}, {x: 8, y: 7}, 
                {x: 8, y: 13}, {x: 15, y: 13}, {x: 15, y: 5}, {x: 22, y: 5}, 
                {x: 22, y: 15}, {x: 27, y: 15}, {x: 27, y: 10}, {x: 29, y: 10}
            ]
        }
    ]
};

// Wave Configuration - Điều chỉnh cho độ khó cao hơn
const WAVE_CONFIG = {
    initialLives: 20,
    initialMoney: 50, // Giảm từ 250 xuống 50 để buộc người chơi phải trồng cây kiếm tiền
    baseEnemyCount: 10,
    enemyCountPerWave: 2,
    baseReward: 200, // Tăng từ 175 lên 200
    rewardPerWave: 25, // Tăng từ 20 lên 25
    baseSpawnInterval: 60,
    spawnIntervalDecreasePerWave: 2,
    minSpawnInterval: 20,
    waveNotificationDuration: 3000 // Thời gian hiển thị thông báo wave (ms)
};

// Projectile Configuration
const PROJECTILE_CONFIG = {
    default: {
        speed: 8,
        radius: 4,
        color: '#f39c12'
    },
    sniper: {
        speed: 20,
        radius: 4,
        color: '#f1c40f'
    },
    ice: {
        speed: 8,
        radius: 4,
        color: '#a9dfbf'
    },
    poison: {
        speed: 8,
        radius: 4,
        color: '#9b59b6'
    },
    tesla: {
        speed: 15,
        radius: 3,
        color: '#f1c40f'
    },
    laser: {
        speed: 25,
        radius: 2,
        color: '#e74c3c'
    },
    rocket: {
        speed: 10,
        radius: 6,
        color: '#e67e22'
    }
};

// UI Colors & Styles
const UI_COLORS = {
    background: '#1a252f',
    gridStroke: '#34495e',
    pathColor: '#bdc3c7',
    pathStroke: '#95a5a6',
    startColor: 'rgba(46, 204, 113, 0.8)',
    endColor: 'rgba(231, 76, 60, 0.8)',
    validPlacement: 'rgba(46, 204, 113, 0.3)',
    invalidPlacement: 'rgba(231, 76, 60, 0.3)',
    rangePreview: 'rgba(255, 255, 255, 0.1)',
    rangeStroke: 'rgba(255, 255, 255, 0.5)'
};

// Particle Configuration
const PARTICLE_CONFIG = {
    default: {
        decay: 0.05,
        maxSpeed: 2
    }
};

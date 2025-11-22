// --- Enemy Class ---
class Enemy {
    constructor(wave) {
        this.pathIndex = 0;
        this.wave = wave;
        
        // Đảm bảo có đường đi
        if (!pathTiles || pathTiles.length === 0) {
            console.error("Không có đường đi!");
            return;
        }
        
        // Chọn đường đi thông minh - ưu tiên đường ngắn nhất
        if (allPaths && allPaths.length > 0) {
            // Sắp xếp đường theo độ dài
            const sortedPaths = [...allPaths].sort((a, b) => a.length - b.length);
            
            // 60% chọn đường ngắn nhất, 40% chọn random
            if (Math.random() > 0.4) {
                this.currentPath = sortedPaths[0]; // Đường ngắn nhất
            } else {
                this.currentPath = allPaths[Math.floor(Math.random() * allPaths.length)];
            }
        } else {
            // Fallback: sử dụng pathTiles nhưng chỉ lấy từ cổng S
            // Tìm tất cả tiles có x=0, sau đó lấy những tiles sau nó từ pathTiles
            const startTiles = pathTiles.filter(t => t.x === 0);
            if (startTiles.length === 0) {
                console.error("Không tìm thấy cổng S!");
                return;
            }
            this.currentPath = pathTiles;
        }
        
        // QUAN TRỌNG: Đảm bảo quái chỉ xuất hiện ở cổng S (x = 0)
        // Tất cả paths đã được tạo bắt đầu từ x=0, nên pathIndex luôn = 0
        this.pathIndex = 0;
        let startTile = this.currentPath[0];
        
        this.x = startTile.x * TILE_SIZE + TILE_SIZE/2;
        this.y = startTile.y * TILE_SIZE + TILE_SIZE/2;
        
        this.radius = 12;
        
        // Chọn loại quái dựa vào sóng
        this.enemyType = this.selectEnemyType(wave);
        const typeConfig = ENEMY_CONFIG.types[this.enemyType];
        this.armor = typeConfig.armorMult;
        this.immuneEffects = typeConfig.immuneToEffect || [];
        
        // HARDCORE ECONOMY BALANCING
        let baseSpeed = ENEMY_CONFIG.baseSpeed + (wave * ENEMY_CONFIG.speedPerWave);
        this.speed = baseSpeed * typeConfig.speedMult;
        
        let baseHealth = ENEMY_CONFIG.baseHealth + (wave * ENEMY_CONFIG.healthPerWave);
        this.maxHealth = baseHealth * typeConfig.healthMult;
        
        this.health = this.maxHealth;
        
        this.frozen = false;
        this.freezeTimer = 0;
        this.originalSpeed = this.speed;
        
        this.poisoned = false;
        this.poisonTimer = 0;
        this.poisonTickTimer = 0;
        
        // Màu sắc dựa vào loại quái
        const colors = {
            normal: '#c0392b',
            fast: '#e74c3c',
            armored: '#34495e',
            flying: '#9b59b6',
            resilient: '#f39c12',
            basicImmune: '#27ae60',
            iceImmune: '#3498db',
            laserImmune: '#e74c3c',
            // Màu cho quái mới
            ghost: '#bdc3c7',
            mirror: '#ecf0f1',
            timebender: '#9b59b6',
            virus: '#27ae60',
            chainbreaker: '#e67e22'
        };
        this.color = colors[this.enemyType];
        
        // Boss mỗi 5 sóng
        if (wave % ENEMY_CONFIG.bossWaveInterval === 0) {
            this.maxHealth *= ENEMY_CONFIG.bossHealthMultiplier;
            this.health = this.maxHealth;
            this.radius = 16;
            this.speed *= ENEMY_CONFIG.bossSpeedMultiplier;
            this.originalSpeed = this.speed;
            this.isBoss = true;
        }
    }

    selectEnemyType(wave) {
        const types = Object.keys(ENEMY_CONFIG.types);
        const chance = Math.random();
        
        if (wave <= 2) return 'normal';
        if (wave <= 5) {
            if (chance < 0.6) return 'normal';
            return chance < 0.8 ? 'fast' : 'armored';
        }
        if (wave <= 10) {
            // Từ wave 5: thêm basicImmune và ghost
            if (chance < 0.35) return 'normal';
            if (chance < 0.5) return 'fast';
            if (chance < 0.7) return 'armored';
            if (chance < 0.85) return 'flying';
            if (chance < 0.92) return 'basicImmune';
            return 'ghost'; // Quái Ghost từ wave 8
        }
        if (wave <= 15) {
            // Từ wave 10-15: thêm laserImmune và mirror
            if (chance < 0.2) return 'normal';
            if (chance < 0.35) return 'fast';
            if (chance < 0.5) return 'armored';
            if (chance < 0.65) return 'flying';
            if (chance < 0.75) return 'resilient';
            if (chance < 0.82) return 'basicImmune';
            if (chance < 0.89) return 'laserImmune';
            if (chance < 0.94) return 'ghost';
            return 'mirror'; // Quái Mirror từ wave 12
        }
        if (wave <= 20) {
            // Từ wave 15-20: thêm timebender và virus
            if (chance < 0.15) return 'normal';
            if (chance < 0.3) return 'fast';
            if (chance < 0.45) return 'armored';
            if (chance < 0.6) return 'flying';
            if (chance < 0.7) return 'resilient';
            if (chance < 0.77) return 'basicImmune';
            if (chance < 0.84) return 'laserImmune';
            if (chance < 0.89) return 'ghost';
            if (chance < 0.93) return 'mirror';
            if (chance < 0.96) return 'timebender'; // Quái TimeBender từ wave 17
            return 'virus'; // Quái Virus từ wave 17
        }
        // Wave 20+: tất cả loại quái, bao gồm chainbreaker
        if (chance < 0.12) return 'normal';
        if (chance < 0.24) return 'fast';
        if (chance < 0.36) return 'armored';
        if (chance < 0.48) return 'flying';
        if (chance < 0.58) return 'resilient';
        if (chance < 0.65) return 'basicImmune';
        if (chance < 0.72) return 'laserImmune';
        if (chance < 0.78) return 'ghost';
        if (chance < 0.83) return 'mirror';
        if (chance < 0.87) return 'timebender';
        if (chance < 0.91) return 'virus';
        if (chance < 0.95) return 'chainbreaker'; // Quái ChainBreaker từ wave 20
        // 5% còn lại: random một trong các loại đặc biệt
        const specialTypes = ['basicImmune', 'laserImmune', 'ghost', 'mirror', 'timebender', 'virus', 'chainbreaker'];
        return specialTypes[Math.floor(Math.random() * specialTypes.length)];
    }

    update() {
        if (this.frozen) {
            this.speed = 0;
            this.freezeTimer--;
            if (this.freezeTimer <= 0) {
                this.frozen = false;
                this.speed = this.originalSpeed;
            }
        }

        if (this.poisoned) {
            this.poisonTimer--;
            if (this.poisonTimer <= 0) this.poisoned = false;

            this.poisonTickTimer++;
            if (this.poisonTickTimer >= 20) { 
                this.health -= (ENEMY_CONFIG.poisonDamagePerTick + Math.floor(this.wave * ENEMY_CONFIG.poisonDamagePerWave)) * this.armor;
                createParticles(this.x, this.y, '#8e44ad', 1);
                this.poisonTickTimer = 0;
            }
        }

        if (this.speed > 0) {
            let targetTile = this.currentPath[this.pathIndex + 1];
            if (!targetTile) return true; 

            let tx = targetTile.x * TILE_SIZE + TILE_SIZE/2;
            let ty = targetTile.y * TILE_SIZE + TILE_SIZE/2;

            let dx = tx - this.x;
            let dy = ty - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < this.speed) {
                this.x = tx;
                this.y = ty;
                this.pathIndex++;
                if (this.pathIndex >= this.currentPath.length - 1) {
                    takeDamage();
                    return true; 
                }
            } else {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }
        return false;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        if (this.frozen) ctx.fillStyle = '#3498db';
        else if (this.poisoned) ctx.fillStyle = '#9b59b6';
        else ctx.fillStyle = this.color;
        
        ctx.fill();
        ctx.strokeStyle = '#1a252f';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Vẽ biểu tượng loại quái
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        let icon = '';
        if (this.enemyType === 'fast') icon = '⚡';
        else if (this.enemyType === 'armored') icon = '🛡️';
        else if (this.enemyType === 'flying') icon = '✈️';
        else if (this.enemyType === 'resilient') icon = '☠️';
        else if (this.enemyType === 'ghost') icon = '👻';
        else if (this.enemyType === 'mirror') icon = '🪞';
        else if (this.enemyType === 'timebender') icon = '⏰';
        else if (this.enemyType === 'virus') icon = '🦠';
        else if (this.enemyType === 'chainbreaker') icon = '⛓️';
        if (icon) ctx.fillText(icon, this.x - 4, this.y + 3);
        
        if (this.frozen) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText("❄️", this.x - 6, this.y + 4);
        }

        // Vẽ thanh máu
        let hpPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 10, this.y - this.radius - 8, 20, 4);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(this.x - 10, this.y - this.radius - 8, 20 * hpPercent, 4);
        
        // Vẽ số máu cụ thể
        ctx.fillStyle = 'white';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        let hpText = Math.ceil(this.health) + '/' + Math.ceil(this.maxHealth);
        ctx.fillText(hpText, this.x, this.y - this.radius - 12);
        ctx.textAlign = 'left';
    }
}

// --- Tower Class ---
class Tower {
    constructor(c, r, type) {
        this.c = c;
        this.r = r;
        this.x = c * TILE_SIZE + TILE_SIZE/2;
        this.y = r * TILE_SIZE + TILE_SIZE/2;
        this.type = type;
        this.level = 1;
        this.cooldown = 0;
        this.angle = 0;
        this.energy = 0;
        this.maxEnergy = 100;
        
        const config = TOWER_CONFIG[type];
        this.range = config.range;
        this.baseDamage = config.baseDamage;
        this.damagePerLevel = config.damagePerLevel;
        this.fireRate = config.fireRate;
        this.color = config.color;
    }
    
    getDamage() {
        // Sát thương = baseDamage + (damagePerLevel * (level - 1))
        return this.baseDamage + (this.damagePerLevel * (this.level - 1));
    }

    upgrade() {
        const config = TOWER_CONFIG[this.type];
        if (this.level >= config.maxLevel) return false;
        
        const baseCost = config.upgradeCost(this.level);
        const multiplier = getCurrentUpgradeCostMultiplier();
        const cost = Math.floor(baseCost * multiplier);
        
        if (money < cost) return false;
        
        money -= cost;
        this.level++;
        
        // Tăng range và fireRate theo level
        this.range += 20;
        this.fireRate = Math.max(10, this.fireRate - 5);
        
        createParticles(this.x, this.y, this.color, 20);
        return true;
    }

    getSynergyBonus() {
        let bonus = { damageMult: 1, rangeBonus: 0, fireRateBonus: 0 };
        
        for (let other of towers) {
            if (other === this) continue;
            let dist = Math.hypot(other.x - this.x, other.y - this.y);
            if (dist > 150) continue; // Phạm vi cộng hưởng
            
            // Cộng hưởng cùng loại
            if (other.type === this.type) {
                bonus.damageMult += 0.15;
            }
            // Support tháp tăng cộng hưởng
            if (other.type === 'support') {
                bonus.damageMult += 0.1;
                bonus.rangeBonus += 30;
            }
        }
        return bonus;
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;
        
        // Tích lũy năng lượng
        if (this.energy < this.maxEnergy) {
            this.energy += 1;
        }

        let target = null;
        
        if (this.type === 'sniper') {
            let maxHP = -1;
            for (let enemy of enemies) {
                let dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.range && enemy.health > maxHP) {
                    maxHP = enemy.health;
                    target = enemy;
                }
            }
        } else if (this.type === 'support') {
            // Support không bắn
            return;
        } else {
            let minDist = Infinity;
            for (let enemy of enemies) {
                let dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.range && dist < minDist) {
                    minDist = dist;
                    target = enemy;
                }
            }
        }

        if (target) {
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            if (this.cooldown <= 0) {
                this.shoot(target);
                this.cooldown = this.fireRate;
            }
        }
    }

    shoot(target) {
        const synergy = this.getSynergyBonus();
        const damage = this.getDamage() * synergy.damageMult;
        projectiles.push(new Projectile(this.x, this.y, target, this.type, damage));
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-16, -16, 32, 32);

        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        
        if (this.type === 'basic') {
            ctx.fillRect(-10, -10, 20, 20);
            ctx.fillRect(0, -4, 26, 8); 
        } else if (this.type === 'ice') {
            ctx.beginPath();
            ctx.rect(-12, -12, 24, 24);
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(-12, -12, 24, 24);
        } else if (this.type === 'poison') {
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.arc(0, 0, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "#2ecc71";
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI*2);
            ctx.fill();
        } else if (this.type === 'sniper') {
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#2c3e50'; 
            ctx.fillRect(0, -3, 40, 6); 
        } else if (this.type === 'tesla') {
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI*2);
            ctx.stroke();
        } else if (this.type === 'laser') {
            ctx.fillRect(-8, -8, 16, 16);
            ctx.fillStyle = '#fff';
            ctx.fillRect(5, -3, 25, 6);
        } else if (this.type === 'rocket') {
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI*2);
            ctx.fill();
        } else if (this.type === 'support') {
            // Hình tròn với dấu cộng
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI*2);
            ctx.stroke();
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(0, 8);
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
        }

        ctx.restore();
        
        // Vẽ level
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(this.level, this.x - 5, this.y + 5);
    }
}

// --- Projectile Class ---
class Projectile {
    constructor(x, y, target, type, damage) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.type = type;
        this.damage = damage;
        this.active = true;
        
        const config = PROJECTILE_CONFIG[type] || PROJECTILE_CONFIG.default;
        this.radius = config.radius;
        this.speed = config.speed; 
        
        let angle = Math.atan2(target.y - y, target.x - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update() {
        if (this.target && this.target.health > 0) {
            let angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        }

        this.x += this.vx;
        this.y += this.vy;

        for (let enemy of enemies) {
            let dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < enemy.radius + this.radius) {
                this.hit(enemy);
                return;
            }
        }
        
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.active = false;
        }
    }

    hit(enemy) {
        this.active = false;
        
        // Kiểm tra nếu quái chỉ nhận sát thương từ loại súng cố định
        const enemyType = ENEMY_CONFIG.types[enemy.enemyType];
        
        // Xử lý các cơ chế đặc biệt mới
        if (enemyType.immuneToLaser && this.type === 'laser') {
            // Mirror: phản lại laser
            createParticles(this.x, this.y, '#fff', 5);
            return;
        }
        
        if (enemyType.requiresFreeze) {
            // TimeBender: chỉ nhận damage khi bị đóng băng
            if (!enemy.frozen) {
                createParticles(this.x, this.y, '#555', 3);
                return;
            }
        }
        
        if (enemyType.onlyDamageType && enemyType.onlyDamageType !== this.type) {
            // Quái này không nhận sát thương từ loại súng này
            createParticles(this.x, this.y, '#555', 3);
            return;
        }
        
        // ChainBreaker: chỉ nhận damage từ chain (Tesla)
        if (enemy.enemyType === 'chainbreaker' && this.type !== 'tesla') {
            createParticles(this.x, this.y, '#555', 3);
            return;
        }
        
        // Theo dõi sát thương thống kê
        damageStats[this.type] = (damageStats[this.type] || 0) + this.damage;
        damageStats.total += this.damage;
        updateDamageStats();
        
        if (this.type === 'ice') {
            if (!enemy.immuneEffects.includes('freeze')) {
                enemy.health -= this.damage; 
                enemy.frozen = true;
                enemy.freezeTimer = ENEMY_CONFIG.freezeDuration;
            }
            createParticles(this.x, this.y, '#3498db', 8);
        } else if (this.type === 'poison') {
            if (!enemy.immuneEffects.includes('poison')) {
                enemy.health -= this.damage;
                enemy.poisoned = true;
                enemy.poisonTimer = ENEMY_CONFIG.poisonDuration;
            }
            createParticles(this.x, this.y, '#8e44ad', 5);
        } else if (this.type === 'sniper') {
            enemy.health -= this.damage; 
            createParticles(this.x, this.y, '#c0392b', 15); 
            
            // Đẩy lùi quái trên đường đi của nó
            enemy.pathIndex = Math.max(0, enemy.pathIndex - 2);
            if(enemy.currentPath && enemy.currentPath[enemy.pathIndex]) {
                enemy.x = enemy.currentPath[enemy.pathIndex].x * TILE_SIZE + TILE_SIZE/2;
                enemy.y = enemy.currentPath[enemy.pathIndex].y * TILE_SIZE + TILE_SIZE/2;
            }
        } else if (this.type === 'tesla') {
            // Tesla bắn xích
            enemy.health -= this.damage;
            createParticles(this.x, this.y, '#f1c40f', 6);
            
            // Bắn xích sang các quái gần đó
            let nearby = enemies.filter(e => 
                Math.hypot(e.x - enemy.x, e.y - enemy.y) < 150 && e !== enemy
            );
            for (let i = 0; i < Math.min(2, nearby.length); i++) {
                let chainDamage = this.damage * 0.6;
                nearby[i].health -= chainDamage;
                damageStats[this.type] += chainDamage;
                damageStats.total += chainDamage;
                createParticles(nearby[i].x, nearby[i].y, '#f1c40f', 3);
            }
        } else if (this.type === 'laser') {
            // Laser xuyên qua quái
            enemy.health -= this.damage;
            createParticles(this.x, this.y, '#e74c3c', 5);
            this.active = true; // Laser xuyên qua
        } else if (this.type === 'rocket') {
            // Rocket nổ diện rộng
            enemy.health -= this.damage;
            createParticles(this.x, this.y, '#e67e22', 20);
            
            // Nổ ảnh hưởng tới quái gần đó
            for (let other of enemies) {
                let dist = Math.hypot(other.x - this.x, other.y - this.y);
                if (dist < 100) {
                    let splashDamage = this.damage * 0.5;
                    other.health -= splashDamage;
                    damageStats[this.type] += splashDamage;
                    damageStats.total += splashDamage;
                    if (!other.immuneEffects.includes('freeze')) {
                        other.frozen = true;
                        other.freezeTimer = 30;
                    }
                }
            }
        } else {
            enemy.health -= this.damage;
            createParticles(this.x, this.y, '#f1c40f', 3);
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        const config = PROJECTILE_CONFIG[this.type] || PROJECTILE_CONFIG.default;
        ctx.fillStyle = config.color;
        
        ctx.fill();
    }
}

// --- Particle Class ---
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * PARTICLE_CONFIG.default.maxSpeed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = PARTICLE_CONFIG.default.decay;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 3, 3);
        ctx.globalAlpha = 1.0;
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

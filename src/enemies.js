
const Rectangle = require('Rectangle');
const { drawImage } = require('draw');

const {
    WIDTH, GAME_HEIGHT, FRAME_LENGTH, OFFSCREEN_PADDING,
    ENEMY_FLY, ENEMY_MONK,
    ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER,
    ENEMY_HORNET, ENEMY_HORNET_SOLDIER,
    ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE, ENEMY_EXPLOSIVE_BEETLE,
    ATTACK_BULLET, ATTACK_DEFEATED_ENEMY, ATTACK_EXPLOSION,
    EFFECT_EXPLOSION, EFFECT_DAMAGE, EFFECT_DUST,
    LOOT_COIN,
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const {
    getFrame,
    getAnimationLength,
    getHitBox,
    flyAnimation, flyDeathAnimation,
    hornetAnimation, hornetDeathAnimation,
    hornetSoldierAnimation, hornetSoldierDeathAnimation,
    locustAnimation, locustDeathAnimation,
    locustSoldierAnimation, locustSoldierDeathAnimation,
    flyingAntAnimation, flyingAntDeathAnimation,
    flyingAntSoldierAnimation, flyingAntSoldierDeathAnimation,
    monkAnimation, monkDeathAnimation, monkAttackAnimation,
    cargoBeetleAnimation, cargoBeetleDeathAnimation,
    explosiveBeetleAnimation, explosiveBeetleDeathAnimation,
} = require('animations');

let uniqueIdCounter = 0;

const spawnMonkOnGround = (state, enemyIndex) => {
    const enemy = state.enemies[enemyIndex];
    const fallDamage = Math.floor(enemy.vy / 13);
    const monk = createEnemy(ENEMY_MONK, {
        left: enemy.left,
        top: getGroundHeight(state),
        animationTime: 20,
        pendingDamage: fallDamage,
    });
    monk.top -= monk.height;
    // Add the new enemy to the state.
    state = addEnemyToState(state, monk);
    // Remove the current enemy from the state.
    return updateEnemy(state, enemyIndex, {done: true});
};

const enemyData = {
    [ENEMY_FLY]: {
        animation: flyAnimation,
        deathAnimation: flyDeathAnimation,
        deathSound: 'sfx/flydeath.mp3',
        props: {
            life: 1,
            score: 20,
        },
    },
    [ENEMY_HORNET]: {
        animation: hornetAnimation,
        deathAnimation: hornetDeathAnimation,
        deathSound: 'sfx/hornetdeath.mp3',
        accelerate: (state, enemy) => {
            let {vx, vy, seed, targetX, targetY, mode, modeTime} = enemy;
            const theta = Math.PI / 2 + Math.PI * 4 * modeTime / 2000;
            const radius = seed * 2 + 2;
            switch (mode) {
                case 'enter':
                    // Advance circling until almost fully in frame, then circle in place.
                    vx = radius * Math.cos(theta);
                    vy = radius * Math.sin(theta);
                    if (vx < 0) vx *= 2;
                    if (vx > 0) vx *= .5;
                    if (modeTime > 2000) {
                        mode = 'circle';
                        modeTime = 0;
                    }
                    break;
                case 'circle':
                    // Advance circling until almost fully in frame, then circle in place.
                    vx = radius * Math.cos(theta);
                    vy = radius * Math.sin(theta);
                    if (vy > 0 && enemy.top < 50) vy *= (1 + (50 - enemy.top) / 100);
                    if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 50) {
                        vy *= (1 + (enemy.top + enemy.height - (GAME_HEIGHT - 50)) / 100);
                    }
                    if (modeTime > 2000) {
                        mode = 'attack';
                        modeTime = 0;
                    }
                    break;
                case 'attack':
                    if (modeTime === FRAME_LENGTH) {
                        const target = state.players[0].sprite;
                        targetX = target.left + target.width / 2;
                        targetY = target.top + target.height / 2;
                        const {dx, dy} = getTargetVector(enemy, target);
                        const theta = Math.atan2(dy, dx);
                        vx = enemy.speed * Math.cos(theta);
                        vy = enemy.speed * Math.sin(theta);
                    } else {
                        const {dx} = getTargetVector(enemy, {left: targetX, top: targetY});
                        if (dx * vx < 0) {
                            mode = 'retreat';
                            modeTime = 0;
                        }
                    }
                    break;
                case 'retreat':
                    if (modeTime === FRAME_LENGTH) {
                        vx = 0;
                        vy = 0;//-vy;
                    } else if (modeTime === 200) {
                        vx = enemy.speed * 1.5;
                    } else if (enemy.left + enemy.width / 2 > WIDTH - 100){
                        mode = 'circle';
                        modeTime = 0;
                    }
            }
            modeTime += FRAME_LENGTH;
            return {...enemy, targetX, targetY, vx, vy, mode, modeTime};
        },
        props: {
            life: 30,
            score: 500,
            speed: 10,
            mode: 'enter',
            modeTime: 0,
            permanent: true,
            doNotFlip: true,
        }
    },
    [ENEMY_HORNET_SOLDIER]: {
        animation: hornetSoldierAnimation,
        deathAnimation: hornetSoldierDeathAnimation,
        deathSound: 'sfx/hit.mp3',
        accelerate: (state, enemy) => {
            let {vx, vy, targetX, targetY, mode, modeTime} = enemy;
            const theta = Math.PI / 2 + Math.PI * 4 * modeTime / 8000;
            const radius = 1;
            switch (mode) {
                case 'enter':
                    // Advance circling until almost fully in frame, then circle in place.
                    vx = radius * Math.cos(theta);
                    vy = radius * Math.sin(theta);
                    if (vx < 0) vx *= 2;
                    if (vx > 0) vx *= .5;
                    if (modeTime > 4000) {
                        mode = 'circle';
                        modeTime = 0;
                    }
                    break;
                case 'circle':
                    // Advance circling until almost fully in frame, then circle in place.
                    vx = radius * Math.cos(theta);
                    vy = radius * Math.sin(theta);
                    if (vy > 0 && enemy.top < 100) vy *= (1 + (100 - enemy.top) / 100);
                    if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 100) {
                        vy *= (1 + (enemy.top + enemy.height - (GAME_HEIGHT - 100)) / 100);
                    }
                    if (modeTime > 4000) {
                        mode = 'attack';
                        modeTime = 0;
                    }
                    break;
                case 'attack':
                    if (modeTime === FRAME_LENGTH) {
                        const target = state.players[0].sprite;
                        targetX = target.left + target.width / 2;
                        targetY = target.top + target.height / 2;
                        const {dx, dy} = getTargetVector(enemy, target);
                        const theta = Math.atan2(dy, dx);
                        vx = enemy.speed * Math.cos(theta);
                        vy = enemy.speed * Math.sin(theta);
                    } else {
                        const {dx} = getTargetVector(enemy, {left: targetX, top: targetY});
                        if (dx * vx < 0) {
                            mode = 'retreat';
                            modeTime = 0;
                        }
                    }
                    break;
                case 'retreat':
                    if (modeTime === FRAME_LENGTH) {
                        vx = 0;
                        vy = 0;//-vy;
                    } else if (modeTime === 200) {
                        vx = enemy.speed * 1.5;
                    } else if (enemy.left + enemy.width / 2 > WIDTH - 100){
                        mode = 'circle';
                        modeTime = 0;
                    }
            }
            modeTime += FRAME_LENGTH;
            return {...enemy, targetX, targetY, vx, vy, mode, modeTime};
        },
        shoot(state, enemyIndex) {
            const enemies = [...state.enemies];
            let enemy = enemies[enemyIndex];
            if (enemy.mode !== 'circle' && enemy.mode !== 'retreat') return state;
            if (enemy.shotCooldown > 0) {
                enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldown - 1 };
                return { ...state, enemies };
            }
            const {dx, dy} = getTargetVector(enemy, state.players[0].sprite);
            const theta = Math.atan2(dy, dx);
            enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldownFrames };
            const bullet = createAttack(ATTACK_BULLET, {
                vx: enemy.bulletSpeed * Math.cos(theta),
                vy: enemy.bulletSpeed * Math.sin(theta),
                top: enemy.top + enemy.vy + enemy.height / 2,
                left: enemy.left + enemy.vx,
            });
            bullet.top -= bullet.height / 2;
            return addEnemyAttackToState({...state, enemies}, bullet);
        },
        onDeathEffect(state, enemyIndex) {
            const enemy = state.enemies[enemyIndex];
            const hornet = createEnemy(ENEMY_HORNET, {
                life: 20,
                score: enemyData[ENEMY_HORNET].props.score / 2,
                left: enemy.left,
                top: enemy.top,
                vx: 0,
                vy: 0,
                mode: 'retreat',
            })
            // Delete the current enemy from the state so it can be
            // added on top of the mount enemy.
            state = updateEnemy(state, enemyIndex, {done: true});
            state = addEnemyToState(state, hornet);
            return addEnemyToState(state, enemy);
        },
        onHitGroundEffect: spawnMonkOnGround,
        props: {
            life: 40,
            score: 500,
            speed: 10,
            bulletSpeed: 10,
            mode: 'enter',
            modeTime: 0,
            permanent: true,
            doNotFlip: true,
            shotCooldownFrames: 50,
        }
    },
    [ENEMY_LOCUST]: {
        animation: locustAnimation,
        deathAnimation: locustDeathAnimation,
        deathSound: 'sfx/hornetdeath.mp3',
        accelerate: (state, enemy) => {
            let {vx, vy, targetX, targetY, animationTime} = enemy;
            const theta = Math.PI / 2 + Math.PI * 2 * animationTime / 2000;
            vy = 2 * enemy.speed * Math.sin(theta);
            vx = -enemy.speed;
            if (vy > 0 && enemy.top < 50) vy *= (1 + (50 - enemy.top) / 100);
            if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 50) {
                vy *= (1 + (enemy.top + enemy.height - (GAME_HEIGHT - 50)) / 100);
            }
            return {...enemy, targetX, targetY, vx, vy};
        },
        props: {
            life: 8,
            score: 100,
            speed: 3,
            doNotFlip: true,
        }
    },
    [ENEMY_LOCUST_SOLDIER]: {
        animation: locustSoldierAnimation,
        deathAnimation: locustSoldierDeathAnimation,
        deathSound: 'sfx/hit.mp3',
        accelerate: (state, enemy) => {
            let {vx, vy, targetX, targetY, animationTime} = enemy;
            const theta = Math.PI / 2 + Math.PI * 2 * animationTime / 2000;
            vy = 2 * enemy.speed * Math.sin(theta);
            vx = -enemy.speed;
            if (vy > 0 && enemy.top < 100) vy *= (1 + (100 - enemy.top) / 100);
            if (vy < 0 && enemy.top + enemy.height > GAME_HEIGHT - 100) {
                vy *= (1 + (enemy.top + enemy.height - (GAME_HEIGHT - 100)) / 100);
            }
            return {...enemy, targetX, targetY, vx, vy};
        },
        shoot(state, enemyIndex) {
            const enemies = [...state.enemies];
            let enemy = enemies[enemyIndex];
            if (enemy.shotCooldown > 0) {
                enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldown - 1 };
                return { ...state, enemies };
            }
            const {dx, dy} = getTargetVector(enemy, state.players[0].sprite);
            const theta = Math.atan2(dy, dx);
            enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldownFrames };
            const bullet = createAttack(ATTACK_BULLET, {
                vx: enemy.bulletSpeed * Math.cos(theta),
                vy: enemy.bulletSpeed * Math.sin(theta),
                top: enemy.top + enemy.vy + enemy.height / 2,
                left: enemy.left + enemy.vx,
            });
            bullet.top -= bullet.height / 2;
            return addEnemyAttackToState({...state, enemies}, bullet);
        },
        onDeathEffect(state, enemyIndex) {
            const enemy = state.enemies[enemyIndex];
            const locust = createEnemy(ENEMY_LOCUST, {
                life: 6,
                score: enemyData[ENEMY_LOCUST].props.score / 2,
                left: enemy.left,
                top: enemy.top,
                vx: enemy.vx,
                vy: enemy.vy,
                animationTime: enemy.animationTime, // This helps keep acceleration in sync.
                speed: 3,
                mode: 'retreat',
            })
            // Delete the current enemy from the state so it can be
            // added on top of the mount enemy.
            state = updateEnemy(state, enemyIndex, {done: true});
            state = addEnemyToState(state, locust);
            return addEnemyToState(state, enemy);
        },
        onHitGroundEffect: spawnMonkOnGround,
        props: {
            life: 12,
            score: 500,
            speed: 1,
            bulletSpeed: 10,
            doNotFlip: true,
            shotCooldownFrames: 80,
        }
    },
    [ENEMY_FLYING_ANT]: {
        animation: flyingAntAnimation,
        deathAnimation: flyingAntDeathAnimation,
        deathSound: 'sfx/flydeath.mp3',
        accelerate: (state, enemy) => {
            let {vx, vy} = enemy;
            const target = state.players[0].sprite;
            const speed = enemy.speed;
            const dx = target.left + target.width / 2 - (enemy.left + enemy.width / 2)
            const dy = target.top + target.height / 2 - (enemy.top + enemy.height / 2)
            const theta = Math.atan2(dy, dx);
            if (enemy.animationTime === 0) {
                vx = speed * Math.cos(theta);
                vy = speed * Math.sin(theta);
            } else if (enemy.animationTime < 3000) {
                vx = (vx * 20 + speed * Math.cos(theta)) / 21;
                vy = (vy * 20 + speed * Math.sin(theta)) / 21;
            } else {
                const tvx = 6 * Math.abs(vx) / vx;
                vx = (vx * 20 + tvx) / 21;
                vy = (vy * 20 + 0) / 21;
            }
            return {...enemy, vx, vy};
        },
        props: {
            life: 1,
            score: 30,
            speed: 6,
        }
    },
    [ENEMY_FLYING_ANT_SOLDIER]: {
        animation: flyingAntSoldierAnimation,
        deathAnimation: flyingAntSoldierDeathAnimation,
        deathSound: 'sfx/hit.mp3',
        accelerate(state, enemy) {
            let {vx, vy} = enemy;
            const speed = enemy.speed;
            const {dx, dy} = getTargetVector(enemy, state.players[0].sprite);
            const theta = Math.atan2(dy, dx);
            if (enemy.animationTime === 0) {
                vx = speed * Math.cos(theta);
                vy = speed * Math.sin(theta);
            } else if (enemy.animationTime < 5000) {
                vx = (vx * 20 + speed * Math.cos(theta)) / 21;
                vy = (vy * 20 + speed * Math.sin(theta)) / 21;
            } else {
                const tvx = 6 * Math.abs(vx) / vx;
                vx = (vx * 20 + tvx) / 21;
                vy = (vy * 20 + 0) / 21;
            }
            return {...enemy, vx, vy};
        },
        shoot(state, enemyIndex) {
            const enemies = [...state.enemies];
            let enemy = enemies[enemyIndex];
            if (enemy.shotCooldown === undefined) {
                enemy.shotCooldown = 20 + Math.floor(50 * Math.random());
            }
            if (enemy.shotCooldown > 0) {
                enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldown - 1 };
                return { ...state, enemies };
            }
            // const {dx, dy} = getTargetVector(enemy, state.players[0].sprite);
            // Don't shoot unless aiming approximately towards the player.
            //if (dx * enemy.vx < 0 || dy * enemy.vy < 0) return state;
            enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldownFrames };
            const theta = Math.atan2(enemy.vy, enemy.vx);
            const bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left - enemy.vx,
                vx: enemy.bulletSpeed * Math.cos(theta),
                vy: enemy.bulletSpeed * Math.sin(theta),
            });
            bullet.top = enemy.top + enemy.vy + Math.round((enemy.height - bullet.height) / 2);
            return addEnemyAttackToState({...state, enemies}, bullet);
        },
        onDeathEffect(state, enemyIndex) {
            const enemy = state.enemies[enemyIndex];
            const flyingAnt = createEnemy(ENEMY_FLYING_ANT, {
                left: enemy.left,
                top: enemy.top,
                speed: 9,
                vx: 10,
                vy: Math.random() < .5 ? -5 : 5,
                animationTime: 20,
            });
            // Delete the current enemy from the state so it can be
            // added on top of the mount enemy.
            state = updateEnemy(state, enemyIndex, {done: true});
            state = addEnemyToState(state, flyingAnt);
            return addEnemyToState(state, enemy);
        },
        onHitGroundEffect: spawnMonkOnGround,
        props: {
            bulletSpeed: 8,
            life: 2,
            score: 20,
            speed: 5,
            shotCooldownFrames: 100,
        },
    },
    [ENEMY_MONK]: {
        animation: monkAnimation,
        deathAnimation: monkDeathAnimation,
        attackAnimation: monkAttackAnimation,
        deathSound: 'sfx/robedeath1.mp3',
        accelerate(state, enemy) {
            // Stop moving while attacking.
            const vx = (enemy.attackCooldownFramesLeft > 0) ? 0.001 : enemy.speed;
            return {...enemy, vx};
        },
        shoot(state, enemyIndex) {
            const enemies = [...state.enemies];
            let enemy = enemies[enemyIndex];
            if (enemy.shotCooldown === undefined) {
                enemy.shotCooldown = 20 + Math.floor(enemy.shotCooldownFrames * Math.random());
            }
            if (enemy.shotCooldown > 0) {
                enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldown - 1 };
                return { ...state, enemies };
            } else {
                enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldownFrames };
            }
            let target = state.players[0].sprite;
            target = {...target, left: target.left + state.world.vx * 40};
            const {dx, dy} = getTargetVector(enemy, target);
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (!mag) {
                return state;
            }

            const bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left - enemy.vx + enemy.width / 2,
                top: enemy.top + enemy.vy,
                vx: enemy.bulletSpeed * dx / mag - state.world.vx,
                vy: enemy.bulletSpeed * dy / mag,
            });
            bullet.left -= bullet.width / 2;
            bullet.top -= bullet.height;
            enemies[enemyIndex] = {...enemies[enemyIndex], attackCooldownFramesLeft: enemy.attackCooldownFrames };
            return addEnemyAttackToState({...state, enemies}, bullet);
        },
        onDeathEffect(state, enemyIndex) {
            return updateEnemy(state, enemyIndex, {ttl: 600});
        },
        props: {
            life: 2,
            score: 30,
            speed: 2,
            grounded: true,
            bulletSpeed: 5,
            attackCooldownFrames: 15,
            shotCooldownFrames: 80,
        },
    },
    [ENEMY_CARGO_BEETLE]: {
        animation: cargoBeetleAnimation,
        deathAnimation: cargoBeetleDeathAnimation,
        accelerate(state, enemy) {
            // Move up and down in a sin wave.
            const theta = Math.PI / 2 + Math.PI * 4 * enemy.animationTime / 2000;
            const vy = 2 * Math.sin(theta);
            return {...enemy, vy};
        },
        deathSound: 'sfx/flydeath.mp3',
        onDeathEffect(state, enemyIndex) {
            const enemy = state.enemies[enemyIndex];
            const loot = createLoot(enemy.lootType || getAdaptivePowerupType(state));
            // These offsets are chosen to match the position of the bucket.
            loot.left = enemy.left + 50 - loot.width / 2;
            loot.top = enemy.top + 85 - loot.height / 2;
            return addLootToState(state, loot);
        },
        props: {
            life: 3,
            score: 0,
            speed: 1,
            vx: -3,
        },
    },
    [ENEMY_EXPLOSIVE_BEETLE]: {
        animation: explosiveBeetleAnimation,
        deathAnimation: explosiveBeetleDeathAnimation,
        accelerate(state, enemy) {
            // Move up and down in a sin wave.
            const theta = Math.PI / 2 + Math.PI * 4 * enemy.animationTime / 2000;
            const vy = 2 * Math.sin(theta);
            return {...enemy, vy};
        },
        // deathSound: 'sfx/flydeath.mp3',
        onDeathEffect(state, enemyIndex, playerIndex = 0) {
            const enemy = state.enemies[enemyIndex];
            // The bucket explodes on death.
            const explosion = createAttack(ATTACK_EXPLOSION, {
                // These offsets are chosen to match the position of the bucket.
                left: enemy.left + 30 + enemy.vx,
                top: enemy.top + 90 + enemy.vy,
                playerIndex,
                delay: 10,
                vx: enemy.vx, vy: enemy.vy,
            });
            explosion.width *= 4;
            explosion.height *= 4;
            explosion.left -= explosion.width / 2;
            explosion.top -= explosion.height / 2;
            return addNeutralAttackToState(state, explosion);
        },
        props: {
            life: 3,
            score: 0,
            speed: 1,
            vx: -3,
        },
    }
};

const createEnemy = (type, props) => {
    const frame = enemyData[type].animation.frames[0];
    return getNewSpriteState({
        ...frame,
        ...enemyData[type].props,
        type,
        seed: Math.random(),
        ...props,
        id: `enemy${uniqueIdCounter++}`,
    });
};

const updateEnemy = (state, enemyIndex, props) => {
    const enemies = [...state.enemies];
    enemies[enemyIndex] = {...enemies[enemyIndex], ...props};
    return {...state, enemies};
};

const addEnemyToState = (state, enemy) => {
    return {...state, newEnemies: [...(state.newEnemies || []), enemy] };
}

const getEnemyAnimation = (enemy) => {
    let animation = enemyData[enemy.type].animation;
    if (enemy.dead) return enemyData[enemy.type].deathAnimation || animation;
    if (enemy.attackCooldownFramesLeft > 0) return enemyData[enemy.type].attackAnimation || animation;
    if (!enemy.spawned) return enemyData[enemy.type].spawnAnimation || animation;
    return animation;
};

const getEnemyHitBox = (enemy) => {
    let animation = getEnemyAnimation(enemy);
    return new Rectangle(getHitBox(animation, enemy.animationTime)).translate(enemy.left, enemy.top);
};

const damageEnemy = (state, enemyIndex, attack = {}) => {
    let updatedState = {...state};
    updatedState.enemies = [...updatedState.enemies];
    updatedState.players = [...updatedState.players];
    updatedState.newEffects = [...updatedState.newEffects];
    let enemy = updatedState.enemies[enemyIndex];
    const damage = attack.damage || 1;
    const enemyIsInvulnerable =
        enemyData[enemy.type].isInvulnerable && enemyData[enemy.type].isInvulnerable(state, enemyIndex);
    if (!enemyIsInvulnerable) {
            updatedState.enemies[enemyIndex] = {
            ...enemy,
            life: enemy.life - damage,
            dead: enemy.life <= damage,
            animationTime: enemy.life <= damage ? 0 : enemy.animationTime,
        };
    }
    if (updatedState.enemies[enemyIndex].dead) {
        if (attack.playerIndex >= 0) {
            let hits = attack.hitIds ? 1 + Object.keys(attack.hitIds).length : 1;
            let comboScore = Math.min(1000, updatedState.players[attack.playerIndex].comboScore + 10 * hits);
            updatedState = updatePlayer(updatedState, attack.playerIndex, { comboScore });
        }
        updatedState = gainPoints(updatedState, attack.playerIndex, enemy.score);
        const explosion = createEffect(EFFECT_EXPLOSION, {
            sfx: enemyData[enemy.type].deathSound,
        });
        explosion.left = enemy.left + (enemy.width - explosion.width ) / 2;
        explosion.top = enemy.top + (enemy.height - explosion.height ) / 2;
        updatedState = addEffectToState(updatedState, explosion);

        if (attack.melee) {
            const playerSprite = updatedState.players[attack.playerIndex].sprite;
            const {dx, dy} = getTargetVector(playerSprite, enemy);
            const theta = Math.atan2(dy, dx);
            const defeatedEnemyAttack = createAttack(ATTACK_DEFEATED_ENEMY, {
                animation: enemyData[enemy.type].deathAnimation || enemyData[enemy.type].animation,
                damage: 1,
                top: enemy.top,
                left: enemy.left,
                vx: 10 * Math.cos(theta),
                vy: 10 * Math.sin(theta),
                playerIndex: attack.playerIndex,
                hitIds: {[enemy.id]: true},
            });
            // Remove the enemy, it is replaced by the defeatedEnemyAttack.
            updatedState.enemies[enemyIndex] = {...enemy, done: true};
            updatedState = addPlayerAttackToState(updatedState, defeatedEnemyAttack);
        }

        // Knock grounded enemies back when killed by an attack (but not if they died from other damage).
        if (enemy.grounded && attack.type !== 'fall') {
            updatedState = updateEnemy(updatedState, enemyIndex, {vx: 6, vy: -6});
            enemy = updatedState.enemies[enemyIndex];
        }
        if (Math.random() < enemy.score / 200) {
            const loot = createLoot(LOOT_COIN);
            loot.left = enemy.left + (enemy.width - loot.width ) / 2;
            loot.top = enemy.top + (enemy.height - loot.height ) / 2;
            updatedState = addLootToState(updatedState, loot);
        }
        if (enemyData[enemy.type].onDeathEffect) {
            // This actuall changes the enemy index, so we do it last. In the long term it is probably
            // better to use the unique enemy id instead of the index.
            updatedState = enemyData[enemy.type].onDeathEffect(updatedState, enemyIndex);
        }
    } else {
        if (enemyIsInvulnerable) {
            updatedState = {...updatedState, sfx: {...updatedState.sfx, 'reflect': true}};
        } else {

            if (enemyData[enemy.type].onDamageEffect) {
                // This actuall changes the enemy index, so we do it last. In the long term it is probably
                // better to use the unique enemy id instead of the index.
                updatedState = enemyData[enemy.type].onDamageEffect(updatedState, enemyIndex);
            }
            if (attack.left) {
                const damage = createEffect(EFFECT_DAMAGE, {
                    sfx: 'sfx/hit.mp3',
                });
                damage.left = attack.left + attack.vx + (attack.width - damage.width ) / 2;
                damage.top = attack.top + attack.vy + (attack.height - damage.height ) / 2;
                updatedState = addEffectToState(updatedState, damage);
            }
        }
    }
    if (attack.type && attacks[attack.type] && attacks[attack.type].hitSfx) {
        updatedState = {...updatedState, sfx: {...updatedState.sfx, [attacks[attack.type].hitSfx]: true}};
    }
    return updatedState;
}

const renderEnemy = (context, enemy) => {
    let animation = getEnemyAnimation(enemy);
    const frame = getFrame(animation, enemy.animationTime);
    context.save();
    if (enemy.dead) {
        context.globalAlpha = .6;
    }
    if (enemy.vx > 0 && !enemy.doNotFlip) {
        let hitBox = getEnemyHitBox(enemy).moveTo(0, 0);
        // This moves the origin to where we want the center of the enemies hitBox to be.
        context.save();
        context.translate(enemy.left + hitBox.left + hitBox.width / 2, enemy.top + hitBox.top + hitBox.height / 2);
        context.scale(-1, 1);
        // This draws the image frame so that the center is exactly at the origin.
        const target = new Rectangle(frame).moveTo(
            -(hitBox.left + hitBox.width / 2),
            -(hitBox.top + hitBox.height / 2),
        );
        drawImage(context, frame.image, frame, target);
        context.restore();
    } else {
        let hitBox = getEnemyHitBox(enemy).moveTo(0, 0);
        context.save();
        context.translate(enemy.left + hitBox.left + hitBox.width / 2, enemy.top + hitBox.top + hitBox.height / 2);
        const target = new Rectangle(frame).moveTo(
            -(hitBox.left + hitBox.width / 2),
            -(hitBox.top + hitBox.height / 2),
        );
        drawImage(context, frame.image, frame, target);
        context.restore();
    }
   // context.translate(x, y - hitBox.height * yScale / 2);
   // if (rotation) context.rotate(rotation * Math.PI/180);
   // if (xScale !== 1 || yScale !== 1) context.scale(xScale, yScale);

    if (isKeyDown(KEY_SHIFT)) {
        let hitBox = getEnemyHitBox(enemy);
        context.globalAlpha = .6;
        context.fillStyle = 'red';
        context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
    }
    context.restore();
};

const advanceEnemy = (state, enemyIndex) => {
    let enemy = state.enemies[enemyIndex];
    if (enemy.delay > 0) {
        return updateEnemy(state, enemyIndex, {delay: enemy.delay - 1});
    }
    // This is kind of a hack to support fall damage being applied to newly created enemies.
    if (enemy.pendingDamage) {
        state = damageEnemy(state, enemyIndex, {playerIndex: 0, damage: enemy.pendingDamage, type: 'fall'});
        enemy = state.enemies[enemyIndex];
    }

    if (enemy.stationary) {
        // Stationary enemies are fixed to the nearground (so they move with the nearground).
        state = updateEnemy(state, enemyIndex, {
            top: enemy.top - state.world.nearground.yFactor * state.world.vy,
            left: enemy.left - state.world.nearground.xFactor * state.world.vx,
        });
        enemy = state.enemies[enemyIndex];
    } else if (enemy.grounded) {
        // Grounded enemies should move relative to the ground.
        state = updateEnemy(state, enemyIndex, {
            left: enemy.left - state.world.nearground.xFactor * state.world.vx,
        });
        enemy = state.enemies[enemyIndex];
    }

    let {left, top, animationTime, spawned} = enemy;
    animationTime += FRAME_LENGTH;
    if (enemyData[enemy.type].spawnAnimation && !spawned && !enemy.dead) {
        if (enemy.animationTime >= getAnimationLength(enemyData[enemy.type].spawnAnimation)) {
            animationTime = 0;
            spawned = true;
        } else {
            // Only update the enemies animation time while spawning.
            return updateEnemy(state, enemyIndex, {animationTime});
        }
    }
    left += enemy.vx;
    top += enemy.vy;
    state = updateEnemy(state, enemyIndex, {left, top, animationTime, spawned});
    enemy = state.enemies[enemyIndex];
    const hitBox = getEnemyHitBox(enemy).moveTo(0, 0);
    if (!enemy.dead) {
        top = Math.min(top, getGroundHeight(state) - (hitBox.top + hitBox.height));
    }
    state = updateEnemy(state, enemyIndex, {left, top, animationTime, spawned});
    enemy = state.enemies[enemyIndex];

    if ((!enemy.stationary && enemy.dead) || enemy.grounded) {
        // Flying enemies fall when they are dead, grounded enemies always fall unless they are on the ground.
        const touchingGround = (enemy.vy >= 0) && (enemy.top + hitBox.top + hitBox.height >= getGroundHeight(state));
        state = updateEnemy(state, enemyIndex, {
            vy: (!touchingGround || !enemy.grounded) ? enemy.vy + 1 : 0,
            // Dead bodies shouldn't slide along the ground
            vx: touchingGround && enemy.dead ? enemy.vx * .5 : enemy.vx,
        });
        enemy = state.enemies[enemyIndex];
        if (!enemy.grounded) {
            const onHitGroundEffect = enemyData[enemy.type].onHitGroundEffect;
            if (onHitGroundEffect) {
                if (enemy.top + hitBox.top + hitBox.height > getGroundHeight(state)) {
                    state = onHitGroundEffect(state, enemyIndex);
                    enemy = state.enemies[enemyIndex];

                    // Add a dust cloud to signify something happened when the enemy hit the ground.
                    const dust = createEffect(EFFECT_DUST, {
                        sfx: 'sfx/hit.mp3',
                    });
                    dust.left = enemy.left + (enemy.width - dust.width ) / 2;
                    // Add dust at the bottom of the enemy frame.
                    dust.top = Math.min(enemy.top + hitBox.top + hitBox.height, getGroundHeight(state)) - dust.height;
                    state = addEffectToState(state, dust);
                    enemy = state.enemies[enemyIndex];
                }
            }
        }
    }
    if (!enemy.dead && enemyData[enemy.type].accelerate) {
        state = updateEnemy(state, enemyIndex, enemyData[enemy.type].accelerate(state, enemy));
    }
    let {ttl, done, attackCooldownFramesLeft} = enemy;
    if (attackCooldownFramesLeft) {
        attackCooldownFramesLeft--;
    }
    if (ttl) {
        // Enemies that we need to cleanup before they hit the edge of the screen can be marked
        // with a TTL in milliseconds.
        ttl -= FRAME_LENGTH;
        if (ttl <= 0) {
            done = true;
        }
    } else if (!done) {
        // cleanup dead enemies or non permanent enemies when they go off the edge of the screen.
        done = (enemy.dead || !enemy.permanent) &&
            (enemy.left + enemy.width < -OFFSCREEN_PADDING || (enemy.vx > 0 && enemy.left > WIDTH + OFFSCREEN_PADDING) ||
            (enemy.vy < 0 && enemy.top + enemy.height < -OFFSCREEN_PADDING) || enemy.top > GAME_HEIGHT + OFFSCREEN_PADDING);
        if (done && !enemy.dead) {
            let comboScore = Math.max(0, state.players[0].comboScore - 50);
            state = updatePlayer(state, 0, { comboScore });
        }
    }
    return updateEnemy(state, enemyIndex, {done, ttl, attackCooldownFramesLeft, pendingDamage: 0});
};

module.exports = {
    enemyData,
    createEnemy,
    addEnemyToState,
    damageEnemy,
    advanceEnemy,
    renderEnemy,
    getEnemyHitBox,
    updateEnemy,
};

// Move possible circular imports to after exports.
const { getNewSpriteState, getTargetVector } = require('sprites');
const { getGroundHeight } = require('world');

const { createEffect, addEffectToState } = require('effects');
const { attacks, createAttack, addEnemyAttackToState, addPlayerAttackToState, addNeutralAttackToState } = require('attacks');
const { createLoot, addLootToState, getAdaptivePowerupType, gainPoints } = require('loot');
const { updatePlayer } = require('heroes');

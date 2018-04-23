
const Rectangle = require('Rectangle');
const { drawImage } = require('draw');

const {
    WIDTH, GAME_HEIGHT, FRAME_LENGTH, OFFSCREEN_PADDING,
    ENEMY_FLY, ENEMY_HORNET, ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER, ENEMY_MONK, ENEMY_CARGO_BEETLE,
    EFFECT_EXPLOSION, EFFECT_DAMAGE, EFFECT_DUST,
    LOOT_COIN,
    LOOT_SPEED, LOOT_ATTACK_POWER, LOOT_ATTACK_SPEED,
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const {
    getFrame,
    getHitBox,
    flyAnimation, flyDeathAnimation,
    hornetAnimation, hornetDeathAnimation,
    flyingAntAnimation, flyingAntDeathAnimation,
    flyingAntSoldierAnimation, flyingAntSoldierDeathAnimation,
    monkAnimation, monkDeathAnimation, monkAttackAnimation,
    cargoBeetleAnimation, cargoBeetleDeathAnimation,
    bulletAnimation,
} = require('animations');

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
                        const {dx, dy} = getTargetVector(enemy, {left: targetX, top: targetY});
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
    [ENEMY_FLYING_ANT]: {
        animation: flyingAntAnimation,
        deathAnimation: flyingAntDeathAnimation,
        deathSound: 'sfx/flydeath.mp3',
        accelerate: (state, enemy) => {
            let {vx, vy, seed} = enemy;
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
            let {vx, vy, seed} = enemy;
            const speed = enemy.speed;
            const {dx, dy} = getTargetVector(enemy, state.players[0].sprite);
            const theta = Math.atan2(dy, dx);
            if (enemy.animationTime === 0) {
                vx = speed * Math.cos(theta);
                vy = speed * Math.sin(theta);
            } else if (enemy.animationTime < 3000) {
                vx = (vx * 20 + speed * Math.cos(theta)) / 21;
                vy = (vy * 20 + speed * Math.sin(theta)) / 21;
            }
            return {...enemy, vx, vy};
        },
        shoot(state, enemyIndex) {
            const enemies = [...state.enemies];
            let enemy = enemies[enemyIndex];
            if (enemy.shotCooldown === undefined) {
                enemy.shotCooldown = 20 + Math.floor(100 * Math.random());
            }
            if (enemy.shotCooldown > 0) {
                enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldown - 1 };
                return { ...state, enemies };
            } else {
                enemies[enemyIndex] = {...enemy, shotCooldown: enemy.shotCooldownFrames };
            }
            const bulletFrame = bulletAnimation.frames[0];
            let attack = getNewSpriteState({
                ...bulletFrame,
                left: enemy.left - enemy.vx,
                top: enemy.top + enemy.vy + Math.round((enemy.height - bulletAnimation.frames[0].height) / 2),
                vx: enemy.vx * 1.3,
                vy: enemy.vy * 1.3,
            });
            return {...state, enemies, newEnemyAttacks: [...state.newEnemyAttacks, attack] };
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
            return addEnemyToState(state, flyingAnt);
        },
        onHitGroundEffect(state, enemyIndex) {
            const enemy = state.enemies[enemyIndex];
            const fallDamage = Math.floor(enemy.vy / 13);
            const monk = createEnemy(ENEMY_MONK, {
                left: enemy.left,
                top: getGroundHeight(state) - enemy.height,
                animationTime: 20,
                pendingDamage: fallDamage,
            });
            // Add the new enemy to the state.
            state = addEnemyToState(state, monk);
            // Remove the current enemy from the state.
            return updateEnemy(state, enemyIndex, {done: true});
        },
        props: {
            life: 2,
            score: 20,
            speed: 5,
            shotCooldownFrames: 200,
        },
    },
    [ENEMY_MONK]: {
        animation: monkAnimation,
        deathAnimation: monkDeathAnimation,
        attackAnimation: monkAttackAnimation,
        deathSound: 'sfx/robedeath.mp3',
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
            const bulletFrame = bulletAnimation.frames[0];
            let target = state.players[0].sprite;
            target = {...target, left: target.left + state.world.vx * 40};
            const {dx, dy} = getTargetVector(enemy, target);
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (!mag) {
                return state;
            }
            let attack = getNewSpriteState({
                ...bulletFrame,
                left: enemy.left - enemy.vx + enemy.width / 2,
                top: enemy.top + enemy.vy,
                vx: enemy.bulletSpeed * dx / mag - state.world.vx,
                vy: enemy.bulletSpeed * dy / mag,
            });
            enemies[enemyIndex] = {...enemies[enemyIndex], attackCooldownFramesLeft: enemy.attackCooldownFrames };

            return {...state, enemies, newEnemyAttacks: [...state.newEnemyAttacks, attack] };
        },
        onDeathEffect(state, enemyIndex) {
            const enemy = state.enemies[enemyIndex];
            const enemies = [...state.enemies];
            enemies[enemyIndex] = {...enemy, ttl: 600, vx: 0, vy: 0};
            return {...state, enemies};
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
            const newLoot = [...state.newLoot, getNewSpriteState({
                ...loot,
                // These offsets are chosen to match the position of the bucket.
                left: enemy.left + 50 - loot.width / 2,
                top: enemy.top + 85 - loot.height / 2,
            })];
            return {...state, newLoot};
        },
        props: {
            life: 5,
            score: 0,
            speed: 1,
            vx: -5,
        },
    }
}

const createEnemy = (type, props) => {
    const frame = enemyData[type].animation.frames[0];
    return getNewSpriteState({
        ...frame,
        ...enemyData[type].props,
        type,
        seed: Math.random(),
        ...props,
    });
};

const updateEnemy = (state, enemyIndex, props) => {
    const enemies = [...state.enemies];
    enemies[enemyIndex] = {...enemies[enemyIndex], ...props};
    return {...state, enemies};
};

// Return the value with the smallest absolute value.
const absMin = (A, B) => {
    if (A < 0 && B < 0) return Math.max(A, B);
    if (A > 0 && B > 0) return Math.min(A, B);
    return Math.abs(A) < Math.abs(B) ? A : B;
};

const getTargetVector = (agent, target) => {
    return {
        dx: target.left + (target.width || 0) / 2 - (agent.left + (agent.width || 0) / 2),
        dy: target.top + (target.height || 0) / 2 - (agent.top + (agent.height || 0) / 2),
    };
};

const addEnemyToState = (state, enemy) => {
    return {...state, newEnemies: [...state.newEnemies, enemy] };
}

const getEnemyHitBox = ({type, animationTime, left, top}) => {
    return new Rectangle(getHitBox(enemyData[type].animation, animationTime)).translate(left, top);
};

const damageEnemy = (state, enemyIndex, attack) => {
    let updatedState = {...state};
    updatedState.enemies = [...updatedState.enemies];
    updatedState.players = [...updatedState.players];
    updatedState.newEffects = [...updatedState.newEffects];
    let enemy = updatedState.enemies[enemyIndex];
    const damage = attack.damage || 1;
    updatedState.enemies[enemyIndex] = {
        ...enemy,
        life: enemy.life - damage,
        dead: enemy.life <= damage,
        animationTime: enemy.life <= damage ? 0 : enemy.animationTime,
    };
    if (updatedState.enemies[enemyIndex].dead) {

        updatedState = gainPoints(updatedState, attack.playerIndex, enemy.score);

        updatedState.spawnDuration = Math.min(2500, updatedState.spawnDuration + 100);
        if (enemyData[enemy.type].onDeathEffect) {
            updatedState = enemyData[enemy.type].onDeathEffect(updatedState, enemyIndex);
        }
        const explosion = createEffect(EFFECT_EXPLOSION, {
            sfx: enemyData[enemy.type].deathSound,
        });
        explosion.left = enemy.left + (enemy.width - explosion.width ) / 2;
        explosion.top = enemy.top + (enemy.height - explosion.height ) / 2;
        updatedState = addEffectToState(updatedState, explosion);
        // Knock grounded enemies back when killed by an attack (but not if they died from other damage).
        if (enemy.grounded && attack.left) {
            updatedState = updateEnemy(updatedState, enemyIndex, {vx: 6, vy: -6});
            enemy = updatedState.enemies[enemyIndex]
        }
        if (Math.random() < enemy.score / 200) {
            const loot = createLoot(LOOT_COIN);
            updatedState.newLoot.push(getNewSpriteState({
                ...loot,
                left: enemy.left + (enemy.width - loot.width ) / 2,
                top: enemy.top + (enemy.height - loot.height ) / 2,
            }));
        }
    } else {
        if (attack.left) {
            const damage = createEffect(EFFECT_DAMAGE, {
                sfx: 'sfx/hit.mp3',
            });
            damage.left = attack.left + attack.vx + (attack.width - damage.width ) / 2;
            damage.top = attack.top + attack.vy + (attack.height - damage.height ) / 2;
            updatedState = addEffectToState(updatedState, damage);
        }
    }
    return updatedState;
}

const renderEnemy = (context, enemy) => {
    let animation = enemyData[enemy.type].animation;
    if (enemy.dead) {
        animation = enemyData[enemy.type].deathAnimation || animation;
    } else if (enemy.attackCooldownFramesLeft > 0) {
        animation = enemyData[enemy.type].attackAnimation || animation;
    }
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
        const target = new Rectangle(enemy).moveTo(
            -(hitBox.left + hitBox.width / 2),
            -(hitBox.top + hitBox.height / 2),
        );
        drawImage(context, frame.image, frame, target);
        context.restore();
    } else {
        drawImage(context, frame.image, frame, enemy);
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
    // This is kind of a hack to support fall damage being applied to newly created enemies.
    if (enemy.pendingDamage) {
        state = damageEnemy(state, enemyIndex, {playerIndex: 0, damage: enemy.pendingDamage});
        enemy = state.enemies[enemyIndex];
    }
    let animation = enemyData[enemy.type].animation;
    if (enemy.dead && enemyData[enemy.type].deathAnimation) {
        animation = enemyData[enemy.type].deathAnimation;
    }
    const frame = getFrame(animation, enemy.animationTime);

    // Force grounded enemies to line up with the ground.
    if (enemy.grounded) {
        state = updateEnemy(state, enemyIndex, {
            left: enemy.left - state.world.neargroundXFactor * state.world.vx,
            top: Math.min(enemy.top, getGroundHeight(state) - frame.height),
        });
        enemy = state.enemies[enemyIndex];
    }

    let {left, top, animationTime} = enemy;
    left += enemy.vx;
    top += enemy.vy;
    if (!enemy.dead) {
        top = Math.min(top, getGroundHeight(state) - frame.height);
    }
    animationTime += FRAME_LENGTH;
    state = updateEnemy(state, enemyIndex, {left, top, animationTime});

    enemy = state.enemies[enemyIndex];
    if (enemy.dead || enemy.grounded) {
        // Flying enemies fall when they are dead, grounded enemies always fall unless they are on the ground.
        const touchingGround = enemy.top + frame.height >= getGroundHeight(state)
        state = updateEnemy(state, enemyIndex, {
            vy: !touchingGround || !enemy.grounded ? enemy.vy + 1 : 0,
            // Dead bodies shouldn't slide along the ground
            vx: touchingGround && enemy.dead ? enemy.vx * .5 : enemy.vx,
        });
        enemy = state.enemies[enemyIndex];
        if (!enemy.grounded) {
            const onHitGroundEffect = enemyData[enemy.type].onHitGroundEffect;
            if (onHitGroundEffect) {
                if (enemy.top + frame.height > getGroundHeight(state)) {
                    state = onHitGroundEffect(state, enemyIndex);
                    enemy = state.enemies[enemyIndex];

                    // Add a dust cloud to signify something happened when the enemy hit the ground.
                    const dust = createEffect(EFFECT_DUST, {
                        sfx: 'sfx/hit.mp3',
                    });
                    dust.left = enemy.left + (enemy.width - dust.width ) / 2;
                    // Add dust at the bottom of the enemy frame.
                    dust.top = Math.min(enemy.top + enemy.height, getGroundHeight(state)) - dust.height;
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
            enemy.top + enemy.height < -OFFSCREEN_PADDING || enemy.top > GAME_HEIGHT + OFFSCREEN_PADDING);
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
};

// Move possible circular imports to after exports.
const { getNewSpriteState } = require('sprites');
const { getGroundHeight } = require('world');

const { createEffect, addEffectToState } = require('effects');
const { createLoot, getRandomPowerupType, getAdaptivePowerupType, gainPoints } = require('loot');

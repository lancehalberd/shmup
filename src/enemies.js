
const Rectangle = require('Rectangle');
const { drawImage } = require('draw');

const {
    WIDTH, GAME_HEIGHT, FRAME_LENGTH, OFFSCREEN_PADDING,
    ENEMY_FLY, ENEMY_MONK,
    ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER,
    ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE, ENEMY_EXPLOSIVE_BEETLE,
    ATTACK_BULLET, ATTACK_DEFEATED_ENEMY, ATTACK_EXPLOSION,
    ATTACK_SLASH, ATTACK_STAB,
    EFFECT_EXPLOSION, EFFECT_DAMAGE, EFFECT_DUST,
    LOOT_COIN,
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const {
    r, createAnimation,
    getFrame,
    getAnimationLength,
    getHitBox,
    flyAnimation, flyDeathAnimation,
    locustAnimation, locustDeathAnimation,
    locustSoldierAnimation, locustSoldierDeathAnimation,
    flyingAntAnimation, flyingAntDeathAnimation,
    flyingAntSoldierAnimation, flyingAntSoldierDeathAnimation,
    monkAnimation, monkDeathAnimation, monkAttackAnimation,
    cargoBeetleAnimation, cargoBeetleDeathAnimation,
    explosiveBeetleAnimation, explosiveBeetleDeathAnimation,
} = require('animations');

let uniqueIdCounter = 0;

const spawnMonkOnGround = (state, enemy) => {
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
    return removeEnemy(state, enemy);
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
        shoot(state, enemy) {
            if (enemy.shotCooldown > 0) {
                return updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldown - 1});
            }
            state = updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldownFrames});
            const {dx, dy} = getTargetVector(enemy, state.players[0].sprite);
            const theta = Math.atan2(dy, dx);
            const bullet = createAttack(ATTACK_BULLET, {
                vx: enemy.bulletSpeed * Math.cos(theta),
                vy: enemy.bulletSpeed * Math.sin(theta),
                top: enemy.top + enemy.vy + enemy.height / 2,
                left: enemy.left + enemy.vx,
            });
            bullet.top -= bullet.height / 2;
            return addEnemyAttackToState(state, bullet);
        },
        onDeathEffect(state, enemy) {
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
            state = removeEnemy(state, enemy);
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
        shoot(state, enemy) {
            if (enemy.shotCooldown === undefined) {
                state = updateEnemy(state, enemy, {shotCooldown: 20 + Math.floor(50 * Math.random())});
                enemy = state.idMap[enemy.id];
            }
            if (enemy.shotCooldown > 0) {
                return updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldown - 1});
            }
            state = updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldownFrames});
            const theta = Math.atan2(enemy.vy, enemy.vx);
            const bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left - enemy.vx,
                vx: enemy.bulletSpeed * Math.cos(theta),
                vy: enemy.bulletSpeed * Math.sin(theta),
            });
            bullet.top = enemy.top + enemy.vy + Math.round((enemy.height - bullet.height) / 2);
            return addEnemyAttackToState(state, bullet);
        },
        onDeathEffect(state, enemy) {
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
            state = removeEnemy(state, enemy);
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
        shoot(state, enemy) {
            if (enemy.shotCooldown === undefined) {
                state = updateEnemy(state, enemy, {shotCooldown: 20 + Math.floor(enemy.shotCooldownFrames * Math.random())});
                enemy = state.idMap[enemy.id];
            }
            if (enemy.shotCooldown > 0) {
                return updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldown - 1});
            }
            let target = state.players[0].sprite;
            target = {...target, left: target.left + state.world.vx * 40};
            const {dx, dy} = getTargetVector(enemy, target);
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (!mag) {
                return state;
            }
            state = updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldownFrames, attackCooldownFramesLeft: enemy.attackCooldownFrames});

            const bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left - enemy.vx + enemy.width / 2,
                top: enemy.top + enemy.vy,
                vx: enemy.bulletSpeed * dx / mag - state.world.vx,
                vy: enemy.bulletSpeed * dy / mag,
            });
            bullet.left -= bullet.width / 2;
            bullet.top -= bullet.height;
            return addEnemyAttackToState(state, bullet);
        },
        onDeathEffect(state, enemy) {
            return updateEnemy(state, enemy, {ttl: 600});
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
        onDeathEffect(state, enemy) {
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
        onDeathEffect(state, enemy, playerIndex = 0) {
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

const ENEMY_SHIELD_MONK = 'shieldMonk';
enemyData[ENEMY_SHIELD_MONK] = {
    ...enemyData[ENEMY_MONK],
    animation: createAnimation('gfx/enemies/monks/pillback.png', r(42, 50), {cols: 3, duration: 30, frameMap: [0, 1, 2, 1]}),
    deathAnimation: createAnimation('gfx/enemies/monks/pillback.png', r(42, 50), {x: 4, cols: 1, duration: 30}),
    attackAnimation: createAnimation('gfx/enemies/monks/pillback.png', r(42, 50), {x: 3, cols: 1, duration: 30}),
    deathSound: 'sfx/robedeath1.mp3',
    props: {
        life: 5,
        score: 50,
        speed: 1.5,
        grounded: true,
        bulletSpeed: 5,
        attackCooldownFrames: 15,
        shotCooldownFrames: 80,
        weakness: {[ATTACK_SLASH]: 5, [ATTACK_STAB]: 5},
    },
    isInvulnerable(state, enemy, attack) {
        return !(enemy.attackCooldownFramesLeft > 0) && !(attack && attack.melee);
    },
};
window.enemyData = enemyData;

const createEnemy = (type, props) => {
    const frame = enemyData[type].animation.frames[0];
    return getNewSpriteState({
        ...frame,
        ...enemyData[type].props,
        type,
        seed: Math.random(),
        maxLife: props && props.life || enemyData[type].props.life,
        ...props,
        id: `enemy${uniqueIdCounter++}`,
    });
};

function updateEnemy(state, enemy, props) {
    const idMap = {...state.idMap};
    // Don't update the enemy if it isn't currently on the state.
    if (!idMap[enemy.id]) return state;
    idMap[enemy.id] = {...enemy, ...props};
    return {...state, idMap};
}

function addEnemyToState(state, enemy) {
    return {...state, newEnemies: [...(state.newEnemies || []), enemy] };
}

function removeEnemy(state, enemy) {
    const idMap = {...state.idMap};
    delete idMap[enemy.id];
    return {...state, idMap};
}

const getEnemyAnimation = (state, enemy) => {
    if (enemyData[enemy.type].getAnimation) return enemyData[enemy.type].getAnimation(state, enemy);
    return getDefaultEnemyAnimation(state, enemy);
};
const getDefaultEnemyAnimation = (state, enemy) => {
    let animation = enemyData[enemy.type].animation;
    if (enemy.dead) return enemyData[enemy.type].deathAnimation || animation;
    if (enemy.attackCooldownFramesLeft > 0) return enemyData[enemy.type].attackAnimation || animation;
    if (!enemy.spawned) return enemyData[enemy.type].spawnAnimation || animation;
    return animation;
};

function getEnemyHitBox(state, enemy) {
    let animation = getEnemyAnimation(state, enemy);
    return new Rectangle(getHitBox(animation, enemy.animationTime)).translate(enemy.left, enemy.top);
}
function getEnemyCenter(state, enemy) {
    return getEnemyHitBox(state, enemy).getCenter();
}
function isIntersectingEnemyHitBoxes(state, enemy, rectangle) {
    const frame = getFrame(getEnemyAnimation(state, enemy), enemy.animationTime);
    const geometryBox = frame.hitBox || new Rectangle(frame).moveTo(0, 0);
    const reflectX = geometryBox.left + geometryBox.width / 2;
    const hitBoxes = frame.hitBoxes || [geometryBox];
    for (let hitBox of hitBoxes) {
        if (enemy.vx > 0 && !enemy.doNotFlip) {
            hitBox = new Rectangle(hitBox).translate(2 * (reflectX - hitBox.left) - hitBox.width, 0);
        }
        if (Rectangle.collision(new Rectangle(hitBox).translate(enemy.left, enemy.top), rectangle)) {
            return true;
        }
    }
    return false;
}

function enemyIsActive(state, enemy) {
    return enemy && state.idMap[enemy.id] && !enemy.dead &&
        !(enemy.delay > 0) &&
        !(enemyData[enemy.type].spawnAnimation && !enemy.spawned);
}

const damageEnemy = (state, enemyId, attack = {}) => {
    let updatedState = {...state};
    updatedState.idMap = {...updatedState.idMap};
    let enemy = updatedState.idMap[enemyId];
    // Do nothing if the enemy is gone.
    if (!enemy || enemy.dead) return updatedState;
    let damage = attack.damage || 1;
    if (attack.type && enemy.weakness && enemy.weakness[attack.type]) {
        damage = enemy.weakness[attack.type];
        attack = {...attack, damage};
    }
    const enemyIsInvulnerable =
        enemyData[enemy.type].isInvulnerable && enemyData[enemy.type].isInvulnerable(state, enemy, attack);
    if (!enemyIsInvulnerable) {
        updatedState.idMap[enemyId] = {
            ...enemy,
            life: Math.max(0, enemy.life - damage),
            dead: enemy.life <= damage && !enemy.boss,
            // reset animation time for death animation if the enemy is now dead.
            animationTime: (enemy.life <= damage && !enemy.boss) ? 0 : enemy.animationTime,
        };
        enemy = updatedState.idMap[enemyId];
    }
    if (updatedState.idMap[enemyId].dead) {
        if (attack.playerIndex >= 0) {
            let hits = attack.hitIds ? Object.keys(attack.hitIds).length : 0;
            let comboScore = Math.min(1000, updatedState.players[attack.playerIndex].comboScore + 5 + 10 * hits);
            updatedState = updatePlayer(updatedState, attack.playerIndex, { comboScore });
        }
        if (enemy.score) {
            updatedState = gainPoints(updatedState, attack.playerIndex, enemy.score);
        }
        const explosion = createEffect(EFFECT_EXPLOSION, {
            sfx: enemyData[enemy.type].deathSound,
        });
        explosion.left = enemy.left + (enemy.width - explosion.width ) / 2;
        explosion.top = enemy.top + (enemy.height - explosion.height ) / 2;
        updatedState = addEffectToState(updatedState, explosion);

        if (attack.melee && !enemy.stationary) {
            const player = updatedState.players[attack.playerIndex];
            // Make sure to use the hitbox from the enemy when it was still alive.
            const {dx, dy} = getTargetVector(getHeroHitBox(player), getEnemyHitBox(state, {...enemy, dead: false}));
            let theta = Math.atan2(dy, dx);
            // Restrict theta to be mostly in the forward direction.
            theta = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, theta));
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
            delete updatedState.idMap[enemyId];
            updatedState = addPlayerAttackToState(updatedState, defeatedEnemyAttack);
        }

        // Knock grounded enemies back when killed by an attack (but not if they died from other damage).
        if (updatedState.idMap[enemyId] && enemy.grounded && attack.type !== 'fall') {
            updatedState = updateEnemy(updatedState, enemy, {vx: 6, vy: -6});
            enemy = updatedState.idMap[enemyId];
        }
        if (!state.world.spawnsDisabled && Math.random() < enemy.score / 200) {
            const loot = createLoot(LOOT_COIN);
            loot.left = enemy.left + (enemy.width - loot.width ) / 2;
            loot.top = enemy.top + (enemy.height - loot.height ) / 2;
            updatedState = addLootToState(updatedState, loot);
        }
        if (enemyData[enemy.type].onDeathEffect) {
            // This actuall changes the enemy index, so we do it last. In the long term it is probably
            // better to use the unique enemy id instead of the index.
            updatedState = enemyData[enemy.type].onDeathEffect(updatedState, enemy);
        }
    } else {
        if (enemyIsInvulnerable) {
            updatedState = {...updatedState, sfx: {...updatedState.sfx, 'reflect': true}};
        } else {

            if (enemyData[enemy.type].onDamageEffect) {
                // This actuall changes the enemy index, so we do it last. In the long term it is probably
                // better to use the unique enemy id instead of the index.
                updatedState = enemyData[enemy.type].onDamageEffect(updatedState, enemy, attack);
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

function renderEnemyFrame(context, state, enemy, frame) {
    context.save();
    if (enemy.dead && !enemy.persist) {
        context.globalAlpha = .6;
    }
    let hitBox = getEnemyHitBox(state, enemy).translate(-enemy.left, -enemy.top);
    if (enemy.vx > 0 && !enemy.doNotFlip) {
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
        context.save();
        context.translate(enemy.left + hitBox.left + hitBox.width / 2, enemy.top + hitBox.top + hitBox.height / 2);
        const target = new Rectangle(frame).moveTo(
            -(hitBox.left + hitBox.width / 2),
            -(hitBox.top + hitBox.height / 2),
        );
        drawImage(context, frame.image, frame, target);
        context.restore();
    }
    context.restore();
}

const renderEnemy = (context, state, enemy) => {
    if (enemy.delay > 0) return;
    if (enemyData[enemy.type].drawUnder) {
        enemyData[enemy.type].drawUnder(context, state, enemy);
    }
    let animation = getEnemyAnimation(state, enemy);
    const frame = getFrame(animation, enemy.animationTime);
    renderEnemyFrame(context, state, enemy, frame);
   // context.translate(x, y - hitBox.height * yScale / 2);
   // if (rotation) context.rotate(rotation * Math.PI/180);
   // if (xScale !== 1 || yScale !== 1) context.scale(xScale, yScale);

    if (isKeyDown(KEY_SHIFT)) {
        const geometryBox = frame.hitBox || new Rectangle(frame).moveTo(0, 0);
        const reflectX = geometryBox.left + geometryBox.width / 2;
        const hitBoxes = frame.hitBoxes || [geometryBox];
        for (let hitBox of hitBoxes) {
            hitBox = new Rectangle(hitBox)
            if (enemy.vx > 0 && !enemy.doNotFlip) {
                hitBox = hitBox.translate(2 * (reflectX - hitBox.left) - hitBox.width, 0);
            }
            hitBox = hitBox.translate(enemy.left, enemy.top);
            context.save();
            context.globalAlpha = .6;
            context.fillStyle = 'red';
            context.fillRect(hitBox.left, hitBox.top, hitBox.width, hitBox.height);
            context.restore();
        }
    }
    if (enemyData[enemy.type].drawOver) {
        enemyData[enemy.type].drawOver(context, state, enemy);
    }
};

const advanceEnemy = (state, enemy) => {
    if (enemy.delay > 0) {
        return updateEnemy(state, enemy, {delay: enemy.delay - 1});
    }
    // Add a finisher effect to the screen when a boss hits zero health.
    if (enemy.boss && enemy.life <= 0 && !enemy.snaredForFinisher && !enemy.dead) {
        if (!state.effects.filter(effect =>
            effect.type === EFFECT_FINISHER && effect.enemyId === enemy.id).length
        ) {
            let finisherEffect = createEffect(EFFECT_FINISHER, {enemyId: enemy.id});
            // Make sure the finisher is position correctly on the first frame.
            finisherEffect = {
                ...finisherEffect,
                ...getFinisherPosition(state, finisherEffect, enemy),
            };
            state = addEffectToState(state, finisherEffect);
        }
    }
    // This is kind of a hack to support fall damage being applied to newly created enemies.
    if (enemy.pendingDamage) {
        state = damageEnemy(state, enemy.id, {playerIndex: 0, damage: enemy.pendingDamage, type: 'fall'});
        enemy = state.idMap[enemy.id];
        if (!enemy) return state;
    }


    // Stationary enemies are fixed to the nearground (so they move with the nearground).
    const neargroundKey = state.world.mgLayerNames[state.world.mgLayerNames.length - 1];
    const xFactor = state.world[neargroundKey].xFactor;
    const yFactor = state.world[neargroundKey].yFactor;

    if (enemy.stationary || enemy.hanging) {
        state = updateEnemy(state, enemy, {
            top: enemy.top + yFactor * state.world.vy,
            left: enemy.left - xFactor * state.world.vx,
        });
        enemy = state.idMap[enemy.id];
    } else if (enemy.grounded) {
        // Grounded enemies should move relative to the ground.
        state = updateEnemy(state, enemy, {
            left: enemy.left - xFactor * state.world.vx,
        });
        enemy = state.idMap[enemy.id];
    }

    let {left, top, animationTime, spawned} = enemy;
    animationTime += FRAME_LENGTH;
    if (enemyData[enemy.type].spawnAnimation && !spawned && !enemy.dead) {
        if (enemy.animationTime >= getAnimationLength(enemyData[enemy.type].spawnAnimation)) {
            animationTime = 0;
            spawned = true;
        } else {
            // Only update the enemies animation time while spawning.
            return updateEnemy(state, enemy, {animationTime});
        }
    }
    if (!enemy.snaredForFinisher) {
        left += enemy.vx;
        top += enemy.vy;
    }
    state = updateEnemy(state, enemy, {left, top, animationTime, spawned});
    enemy = state.idMap[enemy.id];
    const hitBox = getEnemyHitBox(state, enemy).translate(-enemy.left, -enemy.top);
    const groundOffset = enemy.groundOffset || 0;
    if (!enemy.dead) {
        if (!enemy.stationary) {
            top = Math.min(top, getGroundHeight(state) + groundOffset - (hitBox.top + hitBox.height));
        }
        if (!enemy.boss && top + hitBox.top + hitBox.height > getHazardHeight(state)) {
            state = damageEnemy(state, enemy.id, {playerIndex: 0, damage: 100});
            enemy = state.idMap[enemy.id];
            if (!enemy) return state;
        }
        if (!enemy.boss && top + hitBox.top < getHazardCeilingHeight(state)) {
            state = damageEnemy(state, enemy.id, {playerIndex: 0, damage: 100});
            if (!state.idMap) debugger;
            enemy = state.idMap[enemy.id];
            if (!enemy) return state;
        }
    }
    state = updateEnemy(state, enemy, {left, top, animationTime, spawned});
    enemy = state.idMap[enemy.id];

    if (enemy && ((!enemy.stationary && enemy.dead) || enemy.grounded)) {
        // Flying enemies fall when they are dead, grounded enemies always fall unless they are on the ground.
        const touchingGround = (enemy.vy >= 0) && (enemy.top + hitBox.top + hitBox.height >= getGroundHeight(state) + groundOffset);
        state = updateEnemy(state, enemy, {
            vy: (!touchingGround || !enemy.grounded) ? enemy.vy + 1 : 0,
            // Dead bodies shouldn't slide along the ground
            vx: touchingGround && enemy.dead ? enemy.vx * .5 : enemy.vx,
        });
        enemy = state.idMap[enemy.id];
        if (enemy && enemy.dead && !enemy.hitGround) {
            const onHitGroundEffect = enemyData[enemy.type].onHitGroundEffect;
            if (onHitGroundEffect) {
                if (enemy.top + hitBox.top + hitBox.height > getGroundHeight(state) + groundOffset) {
                    state = onHitGroundEffect(state, enemy);
                    enemy = state.idMap[enemy.id];
                    if (enemy) {
                        // Add a dust cloud to signify something happened when the enemy hit the ground.
                        const dust = createEffect(EFFECT_DUST, {
                            sfx: 'sfx/hit.mp3',
                        });
                        dust.left = enemy.left + (enemy.width - dust.width ) / 2;
                        // Add dust at the bottom of the enemy frame.
                        dust.top = Math.min(enemy.top + hitBox.top + hitBox.height, getGroundHeight(state) + groundOffset) - dust.height;
                        state = addEffectToState(state, dust);
                        enemy = state.idMap[enemy.id];
                    }
                }
            }
        }
    }
    if (!enemy) return state;
    if (enemyData[enemy.type].updateState) {
        state = enemyData[enemy.type].updateState(state, enemy);
        enemy = state.idMap[enemy.id];
    }
    if (!enemy.dead && !enemy.snaredForFinisher && enemyData[enemy.type].accelerate) {
        state = updateEnemy(state, enemy, enemyData[enemy.type].accelerate(state, enemy));
        enemy = state.idMap[enemy.id];
    }
    let {ttl, attackCooldownFramesLeft} = enemy;
    if (attackCooldownFramesLeft) {
        attackCooldownFramesLeft--;
    }
    if (ttl) {
        // Enemies that we need to cleanup before they hit the edge of the screen can be marked
        // with a TTL in milliseconds.
        ttl -= FRAME_LENGTH;
        if (ttl <= 0) return removeEnemy(state, enemy);
    } else {
        // cleanup dead enemies or non permanent enemies when they go off the edge of the screen.
        let effectiveVx = enemy.vx;
        if (enemy.grounded) {
            effectiveVx -= xFactor * state.world.vx;
        }
        const enemyIsBelowScreen = enemy.top > GAME_HEIGHT;
        const done = ((enemy.dead && !enemy.persist) || !enemy.permanent) &&
            (enemy.left + enemy.width < -OFFSCREEN_PADDING || (effectiveVx > 0 && enemy.left > WIDTH + OFFSCREEN_PADDING) ||
            (enemy.vy < 0 && enemy.top + enemy.height < -OFFSCREEN_PADDING) || enemy.top > GAME_HEIGHT + OFFSCREEN_PADDING);
        // Don't penalize players for grounded enemies disappearing when they aren't visible on the screen.
        if (done && !enemy.dead && !(enemy.grounded && enemyIsBelowScreen)) {
            let comboScore = Math.max(0, state.players[0].comboScore - 50);
            state = updatePlayer(state, 0, { comboScore });
            // console.log('lost points:', enemy.type);
        }
        if (done) return removeEnemy(state, enemy);
    }
    return updateEnemy(state, enemy, {ttl, attackCooldownFramesLeft, pendingDamage: 0});
};

module.exports = {
    enemyData,
    createEnemy,
    addEnemyToState,
    damageEnemy,
    removeEnemy,
    advanceEnemy,
    renderEnemy,
    renderEnemyFrame,
    getEnemyHitBox,
    getEnemyCenter,
    isIntersectingEnemyHitBoxes,
    updateEnemy,
    getDefaultEnemyAnimation,
    spawnMonkOnGround,
    enemyIsActive,
    ENEMY_SHIELD_MONK,
};

// Move possible circular imports to after exports.
const { getNewSpriteState, getTargetVector } = require('sprites');
const { getGroundHeight, getHazardHeight, getHazardCeilingHeight } = require('world');

const { createEffect, addEffectToState, } = require('effects');
const { EFFECT_FINISHER, getFinisherPosition } = require('effects/finisher');
const { attacks, createAttack, addEnemyAttackToState, addPlayerAttackToState, addNeutralAttackToState } = require('attacks');
const { createLoot, addLootToState, getAdaptivePowerupType, gainPoints } = require('loot');
const { updatePlayer, getHeroHitBox } = require('heroes');

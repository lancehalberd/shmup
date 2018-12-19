
const Rectangle = require('Rectangle');
const random = require('random');
const { drawImage, drawTintedImage } = require('draw');

const {
    WIDTH, GAME_HEIGHT, FRAME_LENGTH, OFFSCREEN_PADDING,
    ENEMY_FLY, ENEMY_MONK,
    ENEMY_FLYING_ANT, ENEMY_FLYING_ANT_SOLDIER,
    ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER,
    ATTACK_BULLET, ATTACK_DEFEATED_ENEMY,
    ATTACK_SLASH, ATTACK_STAB, ATTACK_EXPLOSION,
    EFFECT_EXPLOSION, EFFECT_DUST,
    LOOT_COIN,
} = require('gameConstants');

const { isKeyDown, KEY_SHIFT } = require('keyboard');

const {
    r, requireImage, createAnimation,
    getFrame,
    getAnimationLength,
    getHitbox,
    flyAnimation, flyDeathAnimation,
    locustAnimation, locustDeathAnimation,
    locustSoldierAnimation, locustSoldierDeathAnimation,
    flyingAntAnimation, flyingAntDeathAnimation,
    flyingAntSoldierAnimation, flyingAntSoldierDeathAnimation,
    monkAnimation, monkDeathAnimation, monkAttackAnimation,
} = require('animations');

const onHitGroundEffect_spawnMonk = (state, enemy) => {
    const fallDamage = Math.floor(enemy.vy / 13);
    const monk = createEnemy(state, ENEMY_MONK, {
        left: enemy.left,
        top: Math.min(getHazardHeight(state), getGroundHeight(state)),
        animationTime: 20,
        pendingDamage: fallDamage,
    });
    monk.top -= monk.height;
    // Add the new enemy to the state.
    state = addEnemyToState(state, monk);
    // Remove the current enemy from the state.
    return removeEnemy(state, enemy);
};

function accelerate_followPlayer(state, enemy) {
    let {vx, vy} = enemy;
    const speed = enemy.speed;
    const {dx, dy} = getTargetVector(enemy, state.players[0].sprite);
    const theta = Math.atan2(dy + (enemy.followYOffset || 0), dx + (enemy.followXOffset || 0));
    if (enemy.animationTime === 0) {
        vx = speed * Math.cos(theta);
        vy = speed * Math.sin(theta);
    } else if (enemy.animationTime < (enemy.followPlayerFor || 3000)) {
        vx = (vx * 20 + speed * Math.cos(theta)) / 21;
        vy = (vy * 20 + speed * Math.sin(theta)) / 21;
    } else {
        const tvx = 6 * Math.abs(vx) / vx;
        vx = (vx * 20 + tvx) / 21;
        vy = (vy * 20 + 0) / 21;
    }
    return {...enemy, vx, vy};
}
function getBulletCoords(state, enemy) {
    const bullet = createAttack(ATTACK_BULLET, {});
    const bulletX = enemy.bulletX !== undefined ? enemy.bulletX : 1;
    const bulletY = enemy.bulletY !== undefined ? enemy.bulletY : 0.5;
    const hitbox = getEnemyHitbox(state, enemy);
    const left = (enemy.vx > 0 && !enemy.doNotFlip) ?
        hitbox.left + bulletX * hitbox.width + enemy.vx + bullet.width * (bulletX - 1): // Facing right.
        hitbox.left + (1 - bulletX) * hitbox.width + enemy.vx - bullet.width * bulletX; // Facing left.
    const top = hitbox.top + enemy.vy + bulletY * hitbox.height + bullet.height * (bulletY - 1);
    return {left, top};
}
function addBullet(state, enemy, getTheta) {
    const bullet = createAttack(ATTACK_BULLET, {});
    const bulletX = enemy.bulletX !== undefined ? enemy.bulletX : 1;
    const bulletY = enemy.bulletY !== undefined ? enemy.bulletY : 0.5;
    const hitbox = getEnemyHitbox(state, enemy);
    bullet.left = (enemy.vx > 0 && !enemy.doNotFlip) ?
        hitbox.left + bulletX * hitbox.width + enemy.vx + bullet.width * (bulletX - 1): // Facing right.
        hitbox.left + (1 - bulletX) * hitbox.width + enemy.vx - bullet.width * bulletX; // Facing left.
    bullet.top = hitbox.top + enemy.vy + bulletY * hitbox.height + bullet.height * (bulletY - 1);
    const theta = getTheta(bullet);
    bullet.vx = enemy.bulletSpeed * Math.cos(theta);
    bullet.vy = enemy.bulletSpeed * Math.sin(theta);
    return addEnemyAttackToState(state, bullet);
}
function shoot_bulletAtAngle(state, enemy, getTheta) {
    if (enemy.shotCooldown === undefined) {
        const initialShotCooldownFrames = enemy.initialShotCooldownFrames || 50
        const shotCooldown = Array.isArray(initialShotCooldownFrames) ?
            random.range(initialShotCooldownFrames[0], initialShotCooldownFrames[1]) :
            initialShotCooldownFrames;
        state = updateEnemy(state, enemy, {shotCooldown});
        enemy = state.idMap[enemy.id];
    }
    if (enemy.attackCooldownFramesLeft > 0 &&
        (enemy.shootFrames || [enemy.attackCooldownFrames - 1]).includes(enemy.attackCooldownFramesLeft)
    ) {
        state = addBullet(state, enemy, getTheta);
    }
    if (enemy.shotCooldown > 0) {
        return updateEnemy(state, enemy, {shotCooldown: enemy.shotCooldown - 1});
    }
    // Set attackCooldownFramesLeft if the enemy uses an attack animation.
    let bulletsFired = enemy.bulletsFired || 0;
    const shotCooldown = Array.isArray(enemy.shotCooldownFrames) ?
        enemy.shotCooldownFrames[bulletsFired % enemy.shotCooldownFrames.length] :
        enemy.shotCooldownFrames;
    bulletsFired++;
    if (enemy.attackCooldownFrames) {
        state = updateEnemy(state, enemy, {shotCooldown, bulletsFired, animationTime: 0, attackCooldownFramesLeft: enemy.attackCooldownFrames});
    } else {
        state = updateEnemy(state, enemy, {shotCooldown, bulletsFired});
        state = addBullet(state, enemy, getTheta);
    }
    return state;
}
function shoot_bulletForward(state, enemy) {
    return shoot_bulletAtAngle(state, enemy, () => Math.atan2(0, enemy.vx));
}
function shoot_bulletAtHeading(state, enemy) {
    return shoot_bulletAtAngle(state, enemy, () => Math.atan2(enemy.vy, enemy.vx));
}
function shoot_bulletAtPlayer(state, enemy) {
    return shoot_bulletAtAngle(state, enemy, bullet => {
        const {dx, dy} = getTargetVector(bullet, state.players[0].sprite);
        return Math.atan2(dy, dx);
    });
}

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
        accelerate(state, enemy) {
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
            difficulty: 6,
        }
    },
    [ENEMY_LOCUST_SOLDIER]: {
        animation: locustSoldierAnimation,
        deathAnimation: locustSoldierDeathAnimation,
        deathSound: 'sfx/hit.mp3',
        accelerate(state, enemy) {
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
        shoot: shoot_bulletForward,
        onDeathEffect(state, enemy) {
            const locust = createEnemy(state, ENEMY_LOCUST, {
                life: 6,
                score: enemyData[ENEMY_LOCUST].props.score / 2,
                left: enemy.left,
                top: enemy.top,
                vx: enemy.vx,
                vy: enemy.vy,
                animationTime: enemy.animationTime, // This helps keep acceleration in sync.
                speed: -1,
            })
            // Delete the current enemy from the state so it can be
            // added on top of the mount enemy.
            state = removeEnemy(state, enemy);
            state = addEnemyToState(state, locust);
            return addEnemyToState(state, enemy);
        },
        onHitGroundEffect: onHitGroundEffect_spawnMonk,
        props: {
            life: 12,
            score: 500,
            speed: 1,
            bulletSpeed: 10,
            shotCooldownFrames: [8, 8, 8, 8, 8, 8, 8, 125],
            bulletX: 1,
            bulletY: 0.25,
            difficulty: 7,
        }
    },
    [ENEMY_FLYING_ANT]: {
        animation: flyingAntAnimation,
        deathAnimation: flyingAntDeathAnimation,
        deathSound: 'sfx/flydeath.mp3',
        accelerate: accelerate_followPlayer,
        props: {
            life: 1,
            score: 30,
            speed: 6,
            difficulty: 3,
        }
    },
    [ENEMY_FLYING_ANT_SOLDIER]: {
        animation: flyingAntSoldierAnimation,
        deathAnimation: flyingAntSoldierDeathAnimation,
        deathSound: 'sfx/hit.mp3',
        accelerate: accelerate_followPlayer,
        shoot: shoot_bulletAtHeading,
        onDeathEffect(state, enemy) {
            const flyingAnt = createEnemy(state, ENEMY_FLYING_ANT, {
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
        onHitGroundEffect: onHitGroundEffect_spawnMonk,
        props: {
            bulletSpeed: 8,
            life: 2,
            score: 20,
            speed: 5,
            shotCooldownFrames: 100,
            initialShotCooldownFrames: [25, 50],
            difficulty: 4,
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
        shoot: shoot_bulletAtPlayer,
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
            bulletX: 0.5,
            bulletY: 0,
            initialShotCooldownFrames: [20, 50],
            difficulty: 3,
        },
    },
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
        difficulty: 5,
    },
    isInvulnerable(state, enemy, attack) {
        // Can still be defeated by explosions and defeated enemies.
        return attack.type !== ATTACK_DEFEATED_ENEMY
            && attack.type !== ATTACK_EXPLOSION
            && !(enemy.attackCooldownFramesLeft > 0) && !(attack && attack.melee);
    },
};
window.enemyData = enemyData;

function createEnemy(state, type, props) {
    const frame = enemyData[type].animation.frames[0];
    const combinedProps = {...enemyData[type].props, ...props};
    let vx = (combinedProps.stationary || combinedProps.hanging) ? 0 : -5;
    if (typeof combinedProps.vx === 'number') {
        vx = combinedProps.vx;
    }
    return getNewSpriteState({
        ...frame,
        // Do not inherit scaleX/scaleY from the frame, otherwise it will
        // be applied twice.
        scaleX: 1,
        scaleY: 1,
        ...enemyData[type].props,
        type,
        seed: Math.random(),
        maxLife: props && props.life || enemyData[type].props.life,
        ...props,
        vx,
        id: `enemy${state.uniqueEnemyIdCounter++}`,
    });
}
function spawnEnemy(state, enemyType, props) {
    const difficulty = state.enemies.filter(e => !e.dead).reduce((sum, e) => sum + (e.difficulty || 1), 0);
    // Don't add new enemies if the difficult is too high for the current level time.
    if (difficulty >= Math.min(20, 5 + state.world.time / 5000)) {
        return state;
    }
    const newEnemy = createEnemy(state, enemyType, props);
    newEnemy.left = Math.max(newEnemy.left, WIDTH);
    newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
    return addEnemyToState(state, newEnemy);
}

function updateEnemy(state, enemy, props) {
    const idMap = {...state.idMap};
    // Don't update the enemy if it isn't currently on the state.
    if (!idMap[enemy.id]) return state;
    idMap[enemy.id] = {...enemy, ...props};
    return {...state, idMap};
}

function addEnemyToState(state, enemy) {
    let sfx = state.sfx;
    if (enemy.spawnSfx) sfx = {...sfx, [enemy.spawnSfx]: true};
    return {...state, newEnemies: [...(state.newEnemies || []), enemy], sfx };
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

function getEnemyHitbox(state, enemy) {
    let animation = getEnemyAnimation(state, enemy);
    const scaleX = enemy.scaleX || 1;
    const scaleY = enemy.scaleY || 1;
    return new Rectangle(getHitbox(animation, enemy.animationTime))
        .stretch(scaleX, scaleY)
        .translate(enemy.left, enemy.top);
}
function getEnemyCenter(state, enemy) {
    return getEnemyHitbox(state, enemy).getCenter();
}
function isIntersectingEnemyHitboxes(state, enemy, rectangle, getDamageBoxes = false) {
    for (const hitbox of getEnemyHitboxes(state, enemy, getDamageBoxes)) {
        if (Rectangle.collision(hitbox, rectangle)) {
            return hitbox;
        }
    }
    return false;
}
// It would be good to make this into an iterator so we don't have to produce all of them for each
// call.
function getEnemyHitboxes(state, enemy, getDamageBoxes) {
    let hitboxes = [];
    if (enemyData[enemy.type].getHitboxes) {
        hitboxes = enemyData[enemy.type].getHitboxes(state, enemy);
    } else {
        const frame = getFrame(getEnemyAnimation(state, enemy), enemy.animationTime);
        hitboxes = frame.hitboxes || [frame.hitbox || new Rectangle(frame).moveTo(0, 0)];
        // Damage boxes hurt the player but are not vulnerable on the enemy.
        if (getDamageBoxes && frame.damageBoxes) {
            hitboxes = [...hitboxes, ...frame.damageBoxes];
        }
    }
    return enemyHitboxesToGlobalHitboxes(state, enemy, hitboxes);
}
function enemyHitboxesToGlobalHitboxes(state, enemy, hitboxes) {
    const frame = getFrame(getEnemyAnimation(state, enemy), enemy.animationTime);
    const geometryBox = frame.hitbox || new Rectangle(frame).moveTo(0, 0);
    const reflectX = geometryBox.left + geometryBox.width / 2;
    // Enemies with flipped flag are flipped by default. This happens when an enemy graphic
    // is facing to the right, because we normally assume enemy graphics face left.
    let isFlipped = !!enemy.flipped;
    // Enemy graphics are flipped again if they are moving to the right (unless they are flagged doNotFlip).
    if (enemy.vx > 0 && !enemy.doNotFlip) {
        isFlipped = !isFlipped;
    }
    const globalHitboxes = [];
    for (let hitbox of hitboxes) {
        const scaleX = (enemy.scaleX || 1) * (frame.scaleX || 1);
        const scaleY = (enemy.scaleY || 1) * (frame.scaleY || 1);
        if (isFlipped) {
            hitbox = new Rectangle(hitbox).translate(2 * (reflectX - hitbox.left) - hitbox.width, 0);
        }
        hitbox = new Rectangle(hitbox).stretch(scaleX, scaleY).translate(enemy.left, enemy.top);
        globalHitboxes.push(hitbox);
    }
    return globalHitboxes;
}

function getEnemyDrawBox(state, enemy) {
    const frame = getFrame(getEnemyAnimation(state, enemy), enemy.animationTime);
    const scaleX = (enemy.scaleX || 1) * (frame.scaleX || 1);
    const scaleY = (enemy.scaleY || 1) * (frame.scaleY || 1);
    return new Rectangle(frame).stretch(scaleX, scaleY).moveTo(enemy.left, enemy.top);
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
            let comboScore = Math.min(1000, updatedState.players[attack.playerIndex].comboScore + 4 + 8 * hits);
            updatedState = updatePlayer(updatedState, attack.playerIndex, { comboScore });
        }
        if (enemy.score && attack.playerIndex >= 0) {
            updatedState = gainPoints(updatedState, attack.playerIndex, enemy.score);
        }
        const explosion = createEffect(EFFECT_EXPLOSION, {
            sfx: enemyData[enemy.type].deathSound,
        });
        const hitbox = getEnemyHitbox(state, enemy);
        explosion.left = hitbox.left + (hitbox.width - explosion.width ) / 2;
        explosion.top = hitbox.top + (hitbox.height - explosion.height ) / 2;
        updatedState = addEffectToState(updatedState, explosion);

        if (attack.melee && !enemy.stationary) {
            const player = updatedState.players[attack.playerIndex];
            // Make sure to use the hitbox from the enemy when it was still alive.
            const {dx, dy} = getTargetVector(getHeroHitbox(player), getEnemyHitbox(state, {...enemy, dead: false}));
            let theta = Math.atan2(dy, dx);
            // Restrict theta to be mostly in the forward direction.
            theta = Math.max(-Math.PI / 6, Math.min(Math.PI / 6, theta));
            const defeatedEnemyAttack = createAttack(ATTACK_DEFEATED_ENEMY, {
                animation: enemyData[enemy.type].deathAnimation || enemyData[enemy.type].animation,
                damage: 10,
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
        if (updatedState.idMap[enemyId] && !enemy.stationary && enemy.grounded &&
            attack.type !== 'fall' && attack.type !== 'hazard'
        ) {
            updatedState = updateEnemy(updatedState, enemy, {vx: 6, vy: -6});
            enemy = updatedState.idMap[enemyId];
        }
        if (!state.world.spawnsDisabled && Math.random() < enemy.score / 200) {
            const loot = createLoot(LOOT_COIN);
            loot.left = hitbox.left + (hitbox.width - loot.width ) / 2;
            loot.top = hitbox.top + (hitbox.height - loot.height ) / 2;
            updatedState = addLootToState(updatedState, loot);
        }
        if (enemyData[enemy.type].onDeathEffect) {
            // This actually changes the enemy index, so we do it last. In the long term it is probably
            // better to use the unique enemy id instead of the index.
            updatedState = enemyData[enemy.type].onDeathEffect(updatedState, enemy);
        }
    } else {
        if (!enemyIsInvulnerable) {
            if (enemyData[enemy.type].onDamageEffect) {
                // This actuall changes the enemy index, so we do it last. In the long term it is probably
                // better to use the unique enemy id instead of the index.
                updatedState = enemyData[enemy.type].onDamageEffect(updatedState, enemy, attack);
            }
        }
    }
    if (attack.type && attacks[attack.type] && attacks[attack.type].hitSfx) {
        updatedState = {...updatedState, sfx: {...updatedState.sfx, [attacks[attack.type].hitSfx]: true}};
    }
    return updatedState;
}

function renderEnemyFrame(context, state, enemy, frame, drawBox = undefined) {
    context.save();
    if (enemy.dead && !enemy.persist) {
        context.globalAlpha = .6;
    }
    let flipped = enemy.flipped;
    if (!enemy.doNotFlip && enemy.vx > 0) flipped = !flipped;
    let hitbox = getEnemyHitbox(state, enemy);
    drawBox = drawBox || getEnemyDrawBox(state, enemy);
    if (flipped) {
        // This moves the origin to where we want the center of the enemies hitbox to be.
        context.save();
        context.translate(hitbox.left + hitbox.width / 2, hitbox.top + hitbox.height / 2);
        context.scale(-1, 1);
        // This draws the image frame so that the center is exactly at the origin.
        const target = drawBox.moveTo(
            -hitbox.width / 2 - hitbox.left + enemy.left,
            -hitbox.height / 2 - hitbox.top + enemy.top,
        );
        if (!enemy.tint || !enemy.tint.amount) drawImage(context, frame.image, frame, target);
        else drawTintedImage(context, frame.image, enemy.tint.color, enemy.tint.amount, frame, target);
        context.restore();
    } else {
        context.save();
        context.translate(hitbox.left + hitbox.width / 2, hitbox.top + hitbox.height / 2);
        const target = drawBox.moveTo(
            -hitbox.width / 2 - hitbox.left + enemy.left,
            -hitbox.height / 2 - hitbox.top + enemy.top,
        );
        if (!enemy.tint || !enemy.tint.amount) drawImage(context, frame.image, frame, target);
        else drawTintedImage(context, frame.image, enemy.tint.color, enemy.tint.amount, frame, target);
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
   // context.translate(x, y - hitbox.height * yScale / 2);
   // if (rotation) context.rotate(rotation * Math.PI/180);
   // if (xScale !== 1 || yScale !== 1) context.scale(xScale, yScale);

    /*if (isKeyDown(KEY_SHIFT)) {
        const geometryBox = frame.hitbox || new Rectangle(frame).moveTo(0, 0);
        const reflectX = geometryBox.left + geometryBox.width / 2;
        const hitboxes = frame.hitboxes || [geometryBox];
        for (let hitbox of hitboxes) {
            hitbox = new Rectangle(hitbox)
            if (enemy.vx > 0 && !enemy.doNotFlip) {
                hitbox = hitbox.translate(2 * (reflectX - hitbox.left) - hitbox.width, 0);
            }
            hitbox = hitbox.translate(enemy.left, enemy.top);
            context.save();
            context.globalAlpha = .6;
            context.fillStyle = 'red';
            context.fillRect(hitbox.left, hitbox.top, hitbox.width, hitbox.height);
            context.restore();
        }
    }*/
    if (isKeyDown(KEY_SHIFT)) {
        context.save();
        context.globalAlpha = .6;
        context.fillStyle = 'red';
        for (const hitbox of getEnemyHitboxes(state, enemy, true)) {
            context.fillRect(hitbox.left, hitbox.top, hitbox.width, hitbox.height);
        }
        context.fillStyle = 'yellow';
        const hitbox = getEnemyHitbox(state, enemy);
        context.fillRect(hitbox.left, hitbox.top, hitbox.width, hitbox.height);
        context.restore();
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
    const hitbox = getEnemyHitbox(state, enemy).translate(-enemy.left, -enemy.top);
    const groundOffset = enemy.groundOffset || 0;
    if (!enemy.dead) {
        if (!enemy.stationary) {
            top = Math.min(top, getGroundHeight(state) + groundOffset - (hitbox.top + hitbox.height));
        }
        if (!enemy.boss && !enemy.hazardProof && top + hitbox.top + hitbox.height > getHazardHeight(state)) {
            state = damageEnemy(state, enemy.id, {playerIndex: 0, damage: 100, type: 'hazard'});
            enemy = state.idMap[enemy.id];
            if (!enemy) return state;
        }
        if (!enemy.boss && !enemy.hazardProof && top + hitbox.top < getHazardCeilingHeight(state)) {
            state = damageEnemy(state, enemy.id, {playerIndex: 0, damage: 100, type: 'hazard'});
            if (!state.idMap) debugger;
            enemy = state.idMap[enemy.id];
            if (!enemy) return state;
        }
    }
    state = updateEnemy(state, enemy, {left, top, animationTime, spawned});
    enemy = state.idMap[enemy.id];

    if (enemy && ((!enemy.stationary && enemy.dead) || enemy.grounded)) {
        // Flying enemies fall when they are dead, grounded enemies always fall unless they are on the ground.
        const touchingGround = (enemy.vy >= 0) && (enemy.top + hitbox.top + hitbox.height >= getGroundHeight(state) + groundOffset);
        state = updateEnemy(state, enemy, {
            vy: (!touchingGround || !enemy.grounded) ? enemy.vy + 1 : 0,
            // Dead bodies shouldn't slide along the ground
            vx: touchingGround && enemy.dead ? enemy.vx * .5 : enemy.vx,
        });
        enemy = state.idMap[enemy.id];
        if (enemy && enemy.dead && !enemy.hitGround) {
            const onHitGroundEffect = enemyData[enemy.type].onHitGroundEffect;
            if (onHitGroundEffect) {

                if (enemy.top + hitbox.top + hitbox.height > Math.min(getHazardHeight(state), getGroundHeight(state) + groundOffset)) {
                    state = onHitGroundEffect(state, enemy);
                    enemy = state.idMap[enemy.id];
                    if (enemy && getHazardHeight(state) < getGroundHeight(state) + groundOffset) {
                        // Add a dust cloud to signify something happened when the enemy hit the ground.
                        const dust = createEffect(EFFECT_DUST, {
                            sfx: 'sfx/hit.mp3',
                        });
                        dust.left = enemy.left + (enemy.width - dust.width ) / 2;
                        // Add dust at the bottom of the enemy frame.
                        dust.top = Math.min(enemy.top + hitbox.top + hitbox.height, getGroundHeight(state) + groundOffset) - dust.height;
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
    if (!enemy) return state;
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
        if (enemy.grounded || enemy.hanging) {
            effectiveVx -= xFactor * state.world.vx;
        }
        const drawBox = getEnemyDrawBox(state, enemy);
        // console.log(effectiveVx, drawBox.left, drawBox.width, -OFFSCREEN_PADDING);
        const done = ((enemy.dead && !enemy.persist) || !enemy.permanent) &&
            (
                (effectiveVx < 0 && drawBox.left + drawBox.width < -OFFSCREEN_PADDING) ||
                (effectiveVx > 0 && drawBox.left > WIDTH + OFFSCREEN_PADDING) ||
                (enemy.vy < 0 && drawBox.top + drawBox.height < -OFFSCREEN_PADDING) ||
                (enemy.vy > 0 && drawBox.top > GAME_HEIGHT + OFFSCREEN_PADDING)
            );
        if (done) {
            return removeEnemy(state, enemy);
        }
    }
    return updateEnemy(state, enemy, {ttl, attackCooldownFramesLeft, pendingDamage: 0});
};


const ENEMY_DEMO_EMPRESS = 'demoEmpress';
const demoEmpressGeometry = r(90, 93,
    {hitbox: {left: 47, top: 3, width: 20, height: 71}, scaleX: 3, scaleY: 3},
);
const thanksImage = r(298, 88, {image: requireImage('gfx/thanksyouw.png')});

enemyData[ENEMY_DEMO_EMPRESS] = {
    swoopAnimation: createAnimation('gfx/enemies/empress.png', demoEmpressGeometry, {cols: 2}),
    animation: createAnimation('gfx/enemies/empress.png', demoEmpressGeometry, {x: 2, cols: 2}),
    getAnimation(state, enemy) {
        if (enemy.mode === 'enter') {
            return this.swoopAnimation;
        }
        return this.animation;
    },
    accelerate(state, enemy) {
        let {vx, vy, mode, modeTime, top, left, tint} = enemy;
        switch (mode) {
            // Swoop onto the right side of the screen.
            case 'enter':
                if (top < 0) vy = 20;
                else vy *= 0.9;
                if (left > 4 * WIDTH / 5) vx = -40;
                else vx *= 0.9;
                if (top >= GAME_HEIGHT / 4 && left <=  3 * WIDTH / 4) {
                    mode = 'float';
                    modeTime = 0;
                }
                break;
            // Float for a few seconds before summoning fatal lightning.
            case 'float':
                vx = Math.cos(modeTime / 300);
                vy = Math.sin(modeTime / 300);
                if (modeTime > 3000) {
                    mode = 'lightning';
                    modeTime = 0;
                }
                tint = null;
                break;
            case 'lightning':
                vx = vy = 0;
                tint = {color: modeTime % 400 < 200 ? 'white' : 'black', amount: 0.9};
                if (modeTime > 3500) {
                    mode = 'float';
                    modeTime = 0;
                }
                break;
        }
        modeTime += FRAME_LENGTH;
        return {...enemy, vx, vy, mode, modeTime, top, left, tint};
    },
    drawUnder(context, state, enemy) {
        if (enemy.mode === 'enter') return;
        drawImage(context, thanksImage.image, thanksImage,
            new Rectangle(thanksImage).scale(2).moveCenterTo(WIDTH / 2, GAME_HEIGHT / 4)
        );
    },
    shoot(state, enemy) {
        // Rapidly summon lightning bolts until the player is defeated.
        if (enemy.mode === 'lightning' && enemy.modeTime % 300 === 0 && enemy.modeTime < 3000) {
            let left = (enemy.modeTime + Math.floor(Math.random() * 50)) % WIDTH - 40;
            for (let i = 0; i < 3; i ++) {
                const lightning = createAttack(ATTACK_LIGHTNING_BOLT, {
                    left,
                    top: 0,
                    delay: 10,
                    vy: 30,
                });
                left += 60
                state = addEnemyAttackToState(state, lightning);
            }
        }
        return state;
    },
    props: {
        life: 100000,
        speed: 20,
        boss: true,
        permanent: true,
        mode: 'enter',
        doNotFlip: true,
        left: 1000,
        top: -100,
    },
};

const ENEMY_FLEA = 'flea';
const fleaGeometry = r(15, 15);

enemyData[ENEMY_FLEA] = {
    animation: createAnimation('gfx/enemies/fleasheet.png', fleaGeometry, {x: 3}),
    jumpingAnimation: createAnimation('gfx/enemies/fleasheet.png', fleaGeometry, {x: 1, cols: 2, frameMap: [1, 0], loop: false}),
    deathAnimation: createAnimation('gfx/enemies/fleasheet.png', r(15, 15)),
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        return enemy.vy < 0 ? this.jumpingAnimation : this.animation;
    },
    moveTowardPlayer(state, enemy) {
        const player = state.players[0];
        if (player.invulnerableFor > 0) return updateEnemy(state, enemy, {attached: 0});
        state = updatePlayer(state, 0, {cannotSwitchFrames: 10}, {
            vx: player.sprite.vx * 0.7,
            vy: player.sprite.vy * 0.5 + 1,
        });
        const enemyHitbox = getEnemyHitbox(state, enemy);
        const hitbox = getHeroHitbox(player);
        const dx = hitbox.left + hitbox.width / 2 - (enemyHitbox.left + enemyHitbox.width / 2);
        const dy = hitbox.top + hitbox.height / 2 - (enemyHitbox.top + enemyHitbox.height / 2);
        return updateEnemy(state, enemy, {
            vy: enemy.vy * 0.8 + dy / 20,
            vx: enemy.vx * 0.8 + dx / 20,
            attached: enemy.attached - 1,
        });
    },
    updateState(state, enemy) {
        if (enemy.dead) return state;
        if (enemy.attached > 0) {
            return this.moveTowardPlayer(state, enemy);
        }
        const heroHitbox = getHeroHitbox(state.players[0]);
        if (enemy.attached < -10 && isIntersectingEnemyHitboxes(state, enemy, heroHitbox)) {
            return updateEnemy(state, enemy, {attached: 80});
        }
        let { vx, vy, jumps, attached } = enemy;
        attached--;
        // The flea cannot act while in the air.
        if (enemy.top + enemy.height < getGroundHeight(state)) {
            //console.log('falling');
            return updateEnemy(state, enemy, {attached});
        }
        if (enemy.jumps >= 5) {
            return updateEnemy(state, enemy, {vx: enemy.vx * 1.3, vy: -10, attached});
        }
        //set base speed to world velocity
        const baseSpeed = state.world.vx * state.world.ground.xFactor;
        //if on ground, move toward player if player is not above
        //otherwise jump at player
        if (heroHitbox.left + heroHitbox.width < enemy.left - 100) {
            //console.log('left');
            vx = baseSpeed - 5;
            vy = -8;
        } else if (heroHitbox.left > enemy.left + enemy.width + 100) {
            //console.log('right');
            vx = baseSpeed + 2;
            vy = -8;
        } else {
            const targetY = heroHitbox.top + heroHitbox.height / 2;
            vx = (heroHitbox.left + heroHitbox.width / 2 < enemy.left + enemy.width / 2) ? baseSpeed - 5 : baseSpeed + 2;
            if (targetY > 2 * GAME_HEIGHT / 3) vy = -15;
            else vy = -25;
            jumps++;
        }
        return updateEnemy(state, enemy, {vx, vy, jumps, attached});
    },
    onDeathEffect(state, enemy) {
        return updateEnemy(state, enemy, {ttl: 600});
    },
    props: {
        life: 1,
        score: 10,
        grounded: true,
        jumps: 0,
        vx: 0,
        noCollisionDamage: true,
        attached: 0,
    }
}

function setMode(state, enemy, mode) {
    return updateEnemy(state, enemy, {mode, modeTime: 0, animationTime: 0});
};

module.exports = {
    enemyData,
    createEnemy,
    spawnEnemy,
    addEnemyToState,
    damageEnemy,
    removeEnemy,
    advanceEnemy,
    renderEnemy,
    renderEnemyFrame,
    getEnemyHitbox,
    getEnemyHitboxes,
    enemyHitboxesToGlobalHitboxes,
    getEnemyDrawBox,
    getEnemyCenter,
    isIntersectingEnemyHitboxes,
    updateEnemy,
    getDefaultEnemyAnimation,
    enemyIsActive,
    ENEMY_DEMO_EMPRESS,
    ENEMY_FLEA,
    ENEMY_SHIELD_MONK,
    accelerate_followPlayer,
    onHitGroundEffect_spawnMonk,
    shoot_bulletAtPlayer,
    addBullet,
    getBulletCoords,
    setMode,
};

// Move possible circular imports to after exports.
const { getNewSpriteState, getTargetVector } = require('sprites');
const { getGroundHeight, getHazardHeight, getHazardCeilingHeight } = require('world');
const { ATTACK_LIGHTNING_BOLT } = require('enemies/beetles');

const { createEffect, addEffectToState, } = require('effects');
const { EFFECT_FINISHER, getFinisherPosition } = require('effects/finisher');
const { attacks, createAttack, addEnemyAttackToState, addPlayerAttackToState } = require('attacks');
const { createLoot, addLootToState, gainPoints } = require('loot');
const { updatePlayer, getHeroHitbox } = require('heroes');

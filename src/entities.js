
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

const entities = {};
window.entities = entities;

function createEntity(state, type, props) {
    const frame = entities[type].animation
        ? entities[type].animation.frames[0]
        : {top: 0, left: 0, width: 0, height: 0};
    return getNewSpriteState({
        ...frame,
        // Do not inherit scaleX/scaleY from the frame, otherwise it will be applied twice.
        scaleX: 1,
        scaleY: 1,
        ...entities[type].props,
        type,
        ...props,
        id: `entity${state.uniqueEntityIdCounter++}`,
    });
}
function updateEntity(state, entity, props) {
    const idMap = {...state.idMap};
    // Don't update the enemy if it isn't currently on the state.
    if (!idMap[entity.id]) return state;
    idMap[entity.id] = {...entity, ...props};
    return {...state, idMap};
}
function addEntityToState(state, entity) {
    const idMap = {...state.idMap};
    idMap[entity.id] = entity;
    return {...state, idMap};
}
function removeEntity(state, entity) {
    const idMap = {...state.idMap};
    delete idMap[entity.id];
    return {...state, idMap};
}

function getAnimation(state, entity) {
    if (entities[entity.type].getAnimation) return entities[entity.type].getAnimation(state, entity);
    return getDefaultAnimation(state, entity);
}
function getDefaultAnimation(state, entity) {
    return entities[entity.type].animation;
}
function targetIntersectsAny(state, target, rectangles) {
    for (const rectangle of rectangles) {
        if (Rectangle.collision(rectangle, target)) {
            return rectangle;
        }
    }
    return false;
}
// It would be good to make this into an iterator so we don't have to produce all of them for each
// call.
function getHitboxes(state, entity, include = null, exclude = null) {
    const globalHitboxes = [];
    const frame = getFrame(getAnimation(state, entity), entity.animationTime);
    const geometryBox = frame.hitbox || new Rectangle(frame).moveTo(0, 0);
    const reflectX = geometryBox.left + geometryBox.width / 2;
    const hitboxes = frame.hitboxes || [geometryBox];
    for (let hitbox of hitboxes) {
        const scaleX = (entity.scaleX || 1) * (frame.scaleX || 1);
        const scaleY = (entity.scaleY || 1) * (frame.scaleY || 1);
        if (scaleX < 0) {
            hitbox = new Rectangle(hitbox).translate(2 * (reflectX - hitbox.left) - hitbox.width, 0);
        }
        hitbox = new Rectangle(hitbox).stretch(scaleX, scaleY).translate(entity.left, entity.top);
        globalHitboxes.push(hitbox);
    }
    return globalHitboxes;
}
function getDrawBox(state, entity) {
    const frame = getFrame(getAnimation(state, entity), entity.animationTime);
    const scaleX = (entity.scaleX || 1) * (frame.scaleX || 1);
    const scaleY = (entity.scaleY || 1) * (frame.scaleY || 1);
    return new Rectangle(frame).stretch(scaleX, scaleY).moveTo(entity.left, entity.top);
}
function entityIsActive(state, entity) {
    return entity && state.idMap[entity.id] && !(entity.delay > 0);
}

function renderFrame(context, state, entity, frame, drawBox = undefined) {
    context.save();
    if (enemy.dead && !enemy.persist) {
        context.globalAlpha = .6;
    }
    const geometryBox = frame.hitbox || new Rectangle(frame).moveTo(0, 0);

    drawBox = drawBox || getEnemyDrawBox(state, enemy);
    if ((enemy.vx > 0 && !enemy.flipped && !enemy.doNotFlip) || (enemy.vx <= 0 && enemy.flipped)) {
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
        if (!enemy.boss && top + hitbox.top + hitbox.height > getHazardHeight(state)) {
            state = damageEnemy(state, enemy.id, {playerIndex: 0, damage: 100});
            enemy = state.idMap[enemy.id];
            if (!enemy) return state;
        }
        if (!enemy.boss && top + hitbox.top < getHazardCeilingHeight(state)) {
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
        const enemyIsBelowScreen = enemy.top > GAME_HEIGHT;
        const drawBox = getEnemyDrawBox(state, enemy);
        // console.log(effectiveVx, drawBox.left, drawBox.width, -OFFSCREEN_PADDING);
        const done = ((enemy.dead && !enemy.persist) || !enemy.permanent) &&
            (
                (effectiveVx < 0 && drawBox.left + drawBox.width < -OFFSCREEN_PADDING) ||
                (effectiveVx > 0 && drawBox.left > WIDTH + OFFSCREEN_PADDING) ||
                (enemy.vy < 0 && drawBox.top + drawBox.height < -OFFSCREEN_PADDING) ||
                drawBox.top > GAME_HEIGHT + OFFSCREEN_PADDING
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

const spawnEnemy = (state, enemyType, props) => {
    const newEnemy = createEnemy(state, enemyType, props);
    newEnemy.left = Math.max(newEnemy.left, WIDTH);
    newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
    if (typeof newEnemy.vx !== 'number') {
        newEnemy.vx = (newEnemy.stationary || newEnemy.hanging) ? 0 : -5;
    }
    return addEnemyToState(state, newEnemy);
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
    getEnemyDrawBox,
    getEnemyCenter,
    isIntersectingEnemyHitboxes,
    updateEnemy,
    getDefaultEnemyAnimation,
    enemyIsActive,
    ENEMY_SHIELD_MONK,
    ENEMY_DEMO_EMPRESS,
    accelerate_followPlayer,
    onHitGroundEffect_spawnMonk,
    shoot_bulletAtPlayer,
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

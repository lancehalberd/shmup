module.exports = {
    transitionToCastleBoss,
};
const {
    FRAME_LENGTH, HEIGHT, WIDTH, GAME_HEIGHT,
    ENEMY_FLYING_ANT,
    ATTACK_BULLET,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r } = require('animations');
const { allWorlds, getNewLayer, clearLayers, getGroundHeight } = require('world');
const { getNewSpriteState } = require('sprites');
const { createAttack, addEnemyAttackToState } = require('attacks');
const {
    enemyData, createEnemy, addEnemyToState,
    updateEnemy, setMode, getEnemyHitbox,
    removeEnemy, damageEnemy,
 } = require('enemies');
 const {
    createEffect, addEffectToState
 } = require('effects');
 const {
    getSealTargetPosition, EFFECT_SEAL_TARGET
 } = require('effects/sealPortal');
const { ATTACK_LIGHTNING_BOLT } = require('enemies/beetles');
const { ENEMY_JUMPING_SPIDER } = require('enemies/spiders');
const { ENEMY_STINK_BUG } = require('areas/sewer');
const { ENEMY_BUBBLE_SHOT } = require('areas/beachBoss');
const { LOOT_HELMET, LOOT_GAUNTLET, LOOT_NECKLACE, LOOT_NEEDLE } = require('loot');
const { enterStarWorld } = require('areas/stars');
const { CHECK_POINT_STARS_BOSS } = require('areas/starsBoss');

const WORLD_CASTLE_BOSS = 'castleBoss';

const throneAnimation = createAnimation('gfx/scene/castle/throneroom.png', r(400, 300));
const flag = createAnimation('gfx/scene/castle/thronethings.png', r(20, 60), {y: 9, rows: 4});
const torch = createAnimation('gfx/scene/castle/thronethings.png', r(20, 60), {rows: 4});
const torchHolder = createAnimation('gfx/scene/castle/thronethings.png', r(20, 60), {y: 4});

function transitionToCastleBoss(state) {
    state = clearLayers(state, ['torchHolders', 'torches', 'wallDecorations']);
    const throneX = WIDTH + 200;
    const flagProps = {
        ...flag.frames[0],
        width: 2 * flag.frames[0].width,
        height: 2 * flag.frames[0].height,
        animation: flag,
    }
    const torchProps = {
        ...torch.frames[0],
        width: 2 * torch.frames[0].width,
        height: 2 * torch.frames[0].height,
        animation: torch,
    }
    const torchHolderProps = {
        ...torchHolder.frames[0],
        width: 2 * torchHolder.frames[0].width,
        height: 2 * torchHolder.frames[0].height,
        animation: torchHolder,
    }
    const world = {
        ...state.world,
        throneRoom: getNewLayer({
            xFactor: 1,
            yFactor: 1,
            yOffset: 0,
            sprites: [
                getNewSpriteState({
                    ...throneAnimation.frames[0],
                    width: 800,
                    height: 600,
                    top: -36,
                    left: throneX,
                    animation: throneAnimation,
                }),
                getNewSpriteState({
                    ...flagProps,
                    top: 360 - 36,
                    left: throneX + 60,
                }),
                getNewSpriteState({
                    ...flagProps,
                    top: 360 - 36,
                    left: throneX + 800 - 130,
                }),
                getNewSpriteState({
                    ...flagProps,
                    top: 360 - 36 - 42,
                    left: throneX + 90,
                }),
                getNewSpriteState({
                    ...flagProps,
                    top: 360 - 36 - 42,
                    left: throneX + 800 - 160,
                }),
                getNewSpriteState({
                    ...flagProps,
                    top: 360 - 36 - 84,
                    left: throneX + 120,
                }),
                getNewSpriteState({
                    ...flagProps,
                    top: 360 - 36 - 84,
                    left: throneX + 800 - 190,
                }),
                getNewSpriteState({
                    ...torchHolderProps,
                    top: 50,
                    left: throneX + 200,
                }),
                getNewSpriteState({
                    ...torchHolderProps,
                    top: 50,
                    left: throneX + 560,
                }),
                getNewSpriteState({
                    ...torchProps,
                    top: 50,
                    left: throneX + 200,
                }),
                getNewSpriteState({
                    ...torchProps,
                    top: 50,
                    left: throneX + 560,
                }),
            ]
        }),
        mgLayerNames: [...state.world.mgLayerNames, 'throneRoom'],
        spawnsDisabled: true,
        type: WORLD_CASTLE_BOSS,
        time: 0,
        targetX: state.world.x + throneX,
        targetFrames: 50 * 5,
    };
    return {...state, world};
}
allWorlds[WORLD_CASTLE_BOSS] = {
    advanceWorld: (state) => {
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        let {targetFrames, targetX, targetY} = world;
        // 20s before the end of the level raise screen so we can transition to the sunrise graphics
        // during the boss fight.
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};

        if (time === 500) {
            const throne = state.world.throneRoom.sprites[0];
            const lifebars = {};
            let newEnemy = createEnemy(state, ENEMY_EMPRESS, {
                left: throne.left + 335,
                top: 150,
            });
            const portalsSealed = state.portalsSealed || {};
            newEnemy.life *= (1 - 0.2 * Object.keys(portalsSealed).length);
            lifebars[newEnemy.id] = {
                left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: world.time,
            };
            state = addEnemyToState(state, newEnemy);
            world = {...world, lifebars, bgm: 'bgm/boss.mp3'};
            state = {...state, bgm: world.bgm};
        }

        state = {...state, world};
        return state;
    },
};

/*
Slash attacks
Projectile attacks
Add empress dying and hitting the ground

Clones that summon spreading lightning bolts on defeat

4x Portals for gloves/helmet/necklace/needle
// bottom right of screen pointing left
1: (fields) summons a wave of flying ants that slowly home towards the player then fly off screen.

//top of screen pointing down, drops spiders
2: (forest) summons a wave of spiders on the right edge the just jump at different heights to the left.

// bottom right of screen pointing left
3: (sewer) shoots a burst of stink bugs that stick to wall in various places

// bottom of screen pointing up
4: (beach/circus) summons bullet bubbles from the bottom left that float up and to the left.
*/

const ENEMY_EMPRESS = 'empress';
const sittingEmpressGeometry = r(59, 64,
    {hitboxes: [], scaleX: 2, scaleY: 2}
);
const empressGeometry = r(90, 93,{
    scaleX: 2, scaleY: 2,
    hitbox: {"left":48,"width":23,"top":7,"height":65},
    hitboxes: [
        {"left":53,"width":12,"top":9,"height":64},
        {"left":65,"width":4,"top":18,"height":56},
        {"left":46,"width":7,"top":30,"height":34},
    ],
    damageBoxes: [
        {"left":7,"width":15,"top":31,"height":7},
        {"left":25,"width":14,"top":27,"height":7},
    ],
});
const friendlyEmpressGeometry = {...empressGeometry,
    hitboxes: [], damageBoxes: [],
};
const prepareGeometry = {...empressGeometry,
    damageBoxes:[
        {"left":13,"width":12,"top":5,"height":6},
        {"left":27,"width":13,"top":14,"height":7},
    ]
};
const strike1Geometry = {...empressGeometry,
    damageBoxes:[
        {"left":16,"width":26,"top":29,"height":48},
    ],
};
const strike2Geometry = {...empressGeometry,
    damageBoxes: [
        {"left":70,"width":14,"top":8,"height":7},
        {"left":37,"width":8,"top":57,"height":20},
    ],
};
const strike3Geometry = {...empressGeometry,
    damageBoxes: [
        {"left":13,"width":33,"top":33,"height":2},
        {"left":72,"width":9,"top":13,"height":7},
    ],
};
const deadEmpressGeometry = r(90, 93,{
    scaleX: 2, scaleY: 2,
    hitbox: {"left":20, "width":60, "top":70, "height":40},
    hitboxes: [],
    damageBoxes: [],
});


enemyData[ENEMY_EMPRESS] = {
    sittingAnimation: createAnimation('gfx/enemies/empress/sittingempress.png', sittingEmpressGeometry),
    animation: createAnimation('gfx/enemies/empress/empress.png', empressGeometry, {cols: 2}),
    friendlyAnimation: createAnimation('gfx/enemies/empress/empress.png', friendlyEmpressGeometry, {cols: 2}),
    prepareAnimation: createAnimation('gfx/enemies/empress/empress.png', prepareGeometry, {x: 2}),
    strike1Animation: createAnimation('gfx/enemies/empress/empress.png', strike1Geometry, {x: 3}),
    strike2Animation: createAnimation('gfx/enemies/empress/empress.png', strike2Geometry, {x: 4}),
    strike3Animation: createAnimation('gfx/enemies/empress/empress.png', strike3Geometry, {x: 5}),
    swoopAnimation: createAnimation('gfx/enemies/empress/empress.png', empressGeometry, {x: 6, cols: 2}),
    hurtAnimation: createAnimation('gfx/enemies/empress/empress.png', deadEmpressGeometry, {x: 8}),
    deadAnimation: createAnimation('gfx/enemies/empress/empress.png', deadEmpressGeometry, {x: 9}),
    getAnimation(state, enemy) {
        if (enemy.dead) {
            const touchingGround = enemy.top + 220 >= getGroundHeight(state);
            if (touchingGround) return this.deadAnimation;
            return this.hurtAnimation;
        }
        if (enemy.mode === 'hurt') return this.hurtAnimation;
        if (enemy.mode === 'defeated') return this.deadAnimation;
        if (enemy.mode === 'returnToThrone' || enemy.mode === 'sit') return this.friendlyAnimation;
        if (enemy.mode === 'prepareSlash1' || enemy.mode === 'preparingThunder') {
            return this.prepareAnimation;
        }
        if (enemy.mode === 'slash1' || enemy.mode === 'prepareSlash2') return this.strike1Animation;
        if (enemy.mode === 'slash2' || enemy.mode === 'prepareSlash3') return this.strike2Animation;
        if (enemy.mode === 'slash3') return this.strike3Animation;
        if (enemy.mode === 'sitting') return this.sittingAnimation;
        if (enemy.mode === 'enter') return this.swoopAnimation;
        return this.animation;
    },
    updateState(state, enemy) {
        if (enemy.dead || enemy.snaredForFinisher) return state;
        const allPortalsSealed = Object.keys(state.portalsSealed || {}).length >= 4;
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.mode === 'sitting') {
            if (state.world.throneRoom.sprites[0].left < 10) {
                if (allPortalsSealed) {
                    if (enemy.modeTime >= 2000) {
                        return enterStarWorld(state, CHECK_POINT_STARS_BOSS, CHECK_POINT_STARS_BOSS);
                    }
                    return state;
                }
                state = addPortals(state);
                return setMode(state, enemy, 'prepareSlashCombo', {
                    left: enemy.left - 55,
                    top: enemy.top - 10,
                    comboX: 400, comboY: 100
                });
            }
        } else if (enemy.mode === 'prepareSlashCombo') {
            return moveToTarget(state, enemy, enemy.speed / 2, enemy.comboX, enemy.comboY, 'prepareSlash1', 400);
        } else if (enemy.mode === 'prepareSlash1') {
            if (enemy.modeTime >= 500) return setMode(state, enemy, 'slash1');
        } else if (enemy.mode === 'slash1') {
            return moveToTarget(state, enemy, enemy.speed, enemy.comboX + 100, enemy.comboY + 200, 'slash2');
        } else if (enemy.mode === 'prepareSlash2') {
            if (enemy.modeTime >= 100) return setMode(state, enemy, 'slash2');
        } else if (enemy.mode === 'slash2') {
            return moveToTarget(state, enemy, enemy.speed, enemy.comboX + 200, enemy.comboY + 100, 'slash3');
        } else if (enemy.mode === 'prepareSlash3') {
            if (enemy.modeTime >= 100) return setMode(state, enemy, 'slash3');
        } else if (enemy.mode === 'slash3') {
            return moveToTarget(state, enemy, enemy.speed, enemy.comboX - 100, enemy.comboY + 100, 'choose');
        } else if (enemy.mode === 'summonBullets') {
            if (enemy.modeTime < GAME_HEIGHT * 2 && enemy.modeTime % 20 === 0) {
                state = addEnemyAttackToState(state, createAttack(ATTACK_BULLET, {
                    top: enemy.modeTime * 2 - 10,
                    left: WIDTH - 20,
                    vy: 0,
                    vx: 0,
                    ax: -0.5,
                    delay: 25, //Math.max(5, 60 - enemy.modeTime / 10),
                }));
            }
            if (enemy.modeTime % 400 === 0) {
                state = this.shootBulletNova(state, enemy, enemy.modeTime / 400 * Math.PI / 20);
            }
            if (enemy.modeTime >= 3000) {
                return setMode(state, enemy, 'choose', {vx: 0, vy: 0});
            }
            return updateEnemy(state, enemy, {
                vx: 2 * Math.cos(enemy.modeTime / 100),
                vy: 2 * Math.sin(enemy.modeTime / 100),
            });
        } else if (enemy.mode === 'preparingThunder') {
            state = flashEnemy(state, enemy);
            enemy = state.idMap[enemy.id];
            return moveToTarget(state, enemy, enemy.speed / 3, enemy.targetX, enemy.targetY, 'summonThunder', 600);
        } else if (enemy.mode === 'summonThunder') {
            if (enemy.modeTime === 20) {
                state = updateEnemy(state, enemy, {tint: null});
                enemy = state.idMap[enemy.id];
            }
            const interval = 400, spacing = 150;
            if (enemy.modeTime % interval === 0){
                const hitbox = getEnemyHitbox(state, enemy);
                const index = enemy.modeTime / interval - 1;
                let lightning = createAttack(ATTACK_LIGHTNING_BOLT, {
                    left: hitbox.left - 30 - spacing * index,
                    top: -30,
                    delay: 0,
                    vy: 30,
                });
                state = addEnemyAttackToState(state, lightning);
                lightning = createAttack(ATTACK_LIGHTNING_BOLT, {
                    left: hitbox.left - 30 + 100 + spacing * index,
                    top: -30,
                    delay: 0,
                    vy: 30,
                });
                return addEnemyAttackToState(state, lightning);
            }
            if (enemy.modeTime % 400 === 200) {
                state = this.shootBulletNova(state, enemy, enemy.modeTime / 400 * Math.PI / 20);
            }
            if (enemy.modeTime >= interval * 5.5) {
                return setMode(state, enemy, 'choose');
            }
        } else if (enemy.mode === 'choose') {
            if (enemy.modeTime === 20) {
                state = this.shootBulletNova(state, enemy, Math.random() * Math.PI / 10);
            }
            if (enemy.modeTime >= 500) {
                if (enemy.life <= enemy.maxLife * 0.4 && random.chance(enemy.lightningChance)) {
                    return setMode(state, enemy, 'preparingThunder', {
                        targetX: random.range(300, 700), targetY: 100,
                        lightningChance: enemy.lightningChance - 0.3
                    });
                }
                if (enemy.life <= enemy.maxLife * 0.8 && random.chance(enemy.bulletWaveChance)) {
                    return setMode(state, enemy, 'summonBullets', {
                        bulletWaveChance: enemy.bulletWaveChance - 0.5
                    });
                }
                return setMode(state, enemy, 'prepareSlashCombo', {
                    comboX: random.range(200, 500), comboY: random.range(100, 200),
                    // Increase odds of using bulletWave/lightning when neither is used.
                    bulletWaveChance: Math.min(1, enemy.bulletWaveChance + 0.2),
                    lightningChance: Math.min(1, enemy.lightningChance + 0.2),
                });
            }
        } else if (enemy.mode === 'hurt') {
            if (enemy.modeTime >= 500 && !allPortalsSealed) {
                return setMode(state, enemy, 'choose', {vx: 0, vy: 0, modeTime: -600});
            }
            const touchingGround = enemy.top + 220 >= getGroundHeight(state);
            if (allPortalsSealed && touchingGround) {
                state = {...state, world: {...state.world, lifebars: []}};
                return setMode(state, enemy, 'defeated', {vx: 0, life: 100});
            }
            return updateEnemy(state, enemy, {vx: 2, vy: enemy.vy + 0.5});
        } else if (enemy.mode === 'defeated') {
            if (enemy.modeTime >= 1500) {
                return setMode(state, enemy, 'returnToThrone');
            }
        } else if (enemy.mode === 'returnToThrone') {
            return moveToTarget(state, enemy, enemy.speed / 3, 405, 218, 'sit', 300);
        } else if (enemy.mode === 'sit') {
            // This extra mode is used to offset the empress as she changes to the sitting frame
            // which doesn't line up well with her other frames. We do the inverse of this
            // when she first leaves the throne.
            return setMode(state, enemy, 'sitting', {left: enemy.left + 55, top: enemy.top + 10});
        }
        return state;
    },
    shootBulletNova(state, enemy, baseTheta = 0) {
        const numBullets = 10;
        for (let i = 0; i < numBullets; i++) {
            const theta = baseTheta + i * 2 * Math.PI / numBullets;
            state = this.shootBullet(state, enemy, theta);
        }
        return updateEnemy(state, enemy, {shotCooldown: 4000});
    },
    shootBullet(state, enemy, theta) {
        const bullet = createAttack(ATTACK_BULLET, {
            vx: Math.cos(theta) * 5 - state.world.vx,
            vy: Math.sin(theta) * 5,
            left: enemy.left + 150,
            top: enemy.top + 5,
        });
        bullet.left -= bullet.width / 2;
        bullet.top -= bullet.height / 2;
        return addEnemyAttackToState(state, bullet);
    },
    onDeathEffect(state, enemy) {
        return updateEnemy(state, enemy, {grounded: true, tint: null});
    },
    props: {
        life: 1000,
        speed: 20,
        vx: 0,
        vy: 0,
        boss: true,
        permanent: true,
        // Don't make her transparent on defeat.
        persist: true,
        mode: 'sitting',
        modeTime: 0,
        doNotFlip: true,
        left: 1000,
        top: -100,
        hanging: true,
        lightningChance: 1,
        bulletWaveChance: 1,
    },
};
function flashEnemy(state, enemy) {
    if (enemy.animationTime % 280 === 0)
        return updateEnemy(state, enemy, {tint: {color: 'black', amount: 0.8}});
    if (enemy.animationTime % 280 === 140)
        return updateEnemy(state, enemy, {tint: {color: 'white', amount: 0.8}});
    return state;
}
function moveToTarget(state, enemy, speed, targetX, targetY, mode, delay = 0) {
    const center = new Rectangle(getEnemyHitbox(state, enemy)).getCenter();
    const dx = targetX - center[0];
    const dy = targetY - center[1];
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag <= speed) {
        if (enemy.modeTime >= delay) return setMode(state, enemy, mode, {vx: 0, vy: 0});
        return updateEnemy(state, enemy, {vx: 0, vy: 0});
    }
    return updateEnemy(state, enemy, {
        modeTime: 0,
        vx: speed * dx / mag,
        vy: speed * dy / mag,
    });
}
function addPortals(state) {
    const portalsSealed = state.portalsSealed || {};
    const firstPortalTime = 5000 / FRAME_LENGTH;
    const testFactor = 1;
    let portal;
    if (!portalsSealed[enemyData[ENEMY_FLYING_ANT_PORTAL].relic]) {
        portal = createEnemy(state, ENEMY_FLYING_ANT_PORTAL,
            {left: 720, top: 320, delay: firstPortalTime});
        state = addEnemyToState(state, portal);
    }
    if (!portalsSealed[enemyData[ENEMY_JUMPING_SPIDER_PORTAL].relic]) {
        portal = createEnemy(state, ENEMY_JUMPING_SPIDER_PORTAL,
            {left: 700, top: -20, rotation: Math.PI / 2, delay: firstPortalTime + 10 * 50 * testFactor});
        state = addEnemyToState(state, portal);
    }
    if (!portalsSealed[enemyData[ENEMY_STINK_BUG_PORTAL].relic]) {
        portal = createEnemy(state, ENEMY_STINK_BUG_PORTAL,
            {left: 720, top: 200, delay: firstPortalTime + 20 * 50 * testFactor});
        state = addEnemyToState(state, portal);
    }
    if (!portalsSealed[enemyData[ENEMY_BUBBLE_SHOT_PORTAL].relic]) {
        portal = createEnemy(state, ENEMY_BUBBLE_SHOT_PORTAL,
            {left: 700, top: 450, rotation: Math.PI / 3, delay: firstPortalTime + 25 * 50 * testFactor});
        state = addEnemyToState(state, portal);
    }
    return state;
}
const ENEMY_FLYING_ANT_PORTAL = 'flyingAntPortal';
const ENEMY_JUMPING_SPIDER_PORTAL = 'jumpingSpiderPortal';
const ENEMY_STINK_BUG_PORTAL = 'stinkBugPortal';
const ENEMY_BUBBLE_SHOT_PORTAL = 'bubbleShotPortal';
const portalGeometry = r(50, 80, {scaleX: 1.5, scaleY: 1.5, hitboxes: []});
const portalAnimation = createAnimation('gfx/scene/portal/portal.png', portalGeometry, {rows: 6, duration: 8}, {loopFrame: 3});
const startTime = 2000;
enemyData[ENEMY_FLYING_ANT_PORTAL] = {
    animation: portalAnimation,
    deathAnimation: createAnimation('gfx/scene/portal/portal.png', portalGeometry, {rows: 4, y: -1, duration: 8, frameMap: [3, 2, 1, 0]}, {loop: false}),
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.modTime >= startTime + this.number * this.interval) return this.deathAnimation;
        return this.animation;
    },
    updateState(state, enemy) {
        if (!enemy.dead && (state.players[0].usingFinisher || state.enemies[0].dead)) {
            return updateEnemy(state, enemy, {life: 0, dead: true});
        } else if (enemy.dead) {
            const animation = this.deathAnimation;
            if (enemy.animationTime >= animation.frames.length * animation.frameDuration * FRAME_LENGTH) {
                return removeEnemy(state, enemy);
            }
            return state;
        }
        // Add a target for sealing the portal to the screen if the player has the
        // relic that matches this portal.
        if (this.getAnimation(state, enemy) === this.animation && state.players[0].relics[this.relic]) {
            const myPortal = state.effects.filter(
                e => e.type === EFFECT_SEAL_TARGET && e.enemyId === enemy.id
            )[0];
            if (!myPortal) {
                state = updateEnemy(state, enemy, {relic: this.relic});

                let portal = createEffect(EFFECT_SEAL_TARGET, {enemyId: enemy.id});
                // Make sure the target is position correctly on the first frame.
                portal = {
                    ...portal,
                    ...getSealTargetPosition(state, portal, enemy),
                };
                return addEffectToState(state, portal);
            }
        }
        return this.checkToSpawn(state, enemy);
    },
    checkToSpawn(state, enemy) {
        state = updateEnemy(state, enemy, {modTime: (enemy.modTime + FRAME_LENGTH) % this.period});
        enemy = state.idMap[enemy.id];
        const modTime = enemy.modTime;
        if (modTime === 0 || modTime === startTime + this.number * this.interval) {
            // Note thate marking hidden removes the target when the portal starts closing.
            state = updateEnemy(state, enemy, {animationTime: 0, hidden: modTime !== 0});
        }
        //if (modTime >= startTime - 1000 && modTime < startTime) return flashEnemy(state, enemy);
        //if (modTime === startTime) return updateEnemy(state, enemy, {tint: null});
        if (modTime % this.interval !== 0 ||
            modTime < startTime ||
            modTime > startTime + this.number * this.interval
        ) {
            return state;
        }
        const index = (modTime - startTime) / this.interval;
        return addEnemyToState(state, this.spawnEnemy(state, enemy, index));
    },
    spawnEnemy(state, enemy, index) {
        return createEnemy(state, ENEMY_FLYING_ANT, {
            top: enemy.top + 10 + 4 * index,
            left: enemy.left - 5,
            vx: -5,
            vy: -10 + 10 * index / 12,
            followPlayerFor: 1800,
            weight: 30, // This is the weight of the current velocity over the tracking velocity.
        });
    },
    onDeathEffect(state) {
        let empress = state.enemies.filter(e => e.type === ENEMY_EMPRESS)[0];
        if (!empress) return state;
        state = damageEnemy(state, empress.id, {damage: enemyData[ENEMY_EMPRESS].props.life / 5});
        empress = state.idMap[empress.id];
        return setMode(state, empress, 'hurt', {tint: null, vy: -2});
    },
    interval: 300,
    number: 10,
    period: 15000,
    relic: LOOT_HELMET,
    props: {
        life: 1,
        stationary: true,
        alpha: 0.8,
        modTime: 0,
    }
};

enemyData[ENEMY_JUMPING_SPIDER_PORTAL] = {
    ...enemyData[ENEMY_FLYING_ANT_PORTAL],
    spawnEnemy(state, enemy, index) {
        return createEnemy(state, ENEMY_JUMPING_SPIDER, {
            top: enemy.top + 20,
            left: enemy.left - 10 + Math.random() * 40,
            vx: -2 - Math.random(),
            vy: 5,
            grounded: true,
            jumps: 3,
            jumpVelocity: [-16, -22, -28][index % 3],
            mode: 'jumping',
        });
    },
    interval: 500,
    number: 5,
    period: 20000,
    relic: LOOT_GAUNTLET,
};

enemyData[ENEMY_STINK_BUG_PORTAL] = {
    ...enemyData[ENEMY_FLYING_ANT_PORTAL],
    spawnEnemy(state, enemy, index) {
        const sourceOffset = [20, 40]
        return createEnemy(state, ENEMY_STINK_BUG, {
            left: enemy.left + sourceOffset[0],
            top: enemy.top + sourceOffset[1],
            vx: -5 - index * 2,
            targetX: 700 - index * 80,
            vy: -3 - index - Math.random() * 12,
            ay: 1,
            noCollisionDamage: true,
            gasTTL: 16000 / FRAME_LENGTH,
        });
    },
    interval: 20,
    number: 8,
    period: 25000,
    relic: LOOT_NECKLACE,
};

enemyData[ENEMY_BUBBLE_SHOT_PORTAL] = {
    ...enemyData[ENEMY_FLYING_ANT_PORTAL],
    spawnEnemy(state, enemy) {
        const sourceOffset = [20, 40]
        return createEnemy(state, ENEMY_BUBBLE_SHOT, {
            left: enemy.left + sourceOffset[0],
            top: enemy.top + sourceOffset[1],
            vx: -4 - Math.random() * 5,
            vy: -1 - Math.random() * 5,
            scaleX: 0.2,
            scaleY: 0.2,
            sourceId: enemy.id,
            sourceOffset,
        });
    },
    interval: 400,
    number: 6,
    period: 30000,
    relic: LOOT_NEEDLE,
};



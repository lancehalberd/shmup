
const {
    FRAME_LENGTH, HEIGHT, WIDTH, GAME_HEIGHT,
    ENEMY_FLYING_ANT,
    ATTACK_BULLET,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r, getFrame, requireImage, getHitbox } = require('animations');
const { allWorlds, getNewLayer, clearLayers, getGroundHeight } = require('world');

const WORLD_CASTLE_BOSS = 'castleBoss';
const BOSS_DURATION = 80000;

module.exports = {
    transitionToCastleBoss,
};

const { getNewSpriteState } = require('sprites');
const { createAttack, addEnemyAttackToState } = require('attacks');
const {
    enemyData, createEnemy, addEnemyToState,
    updateEnemy, setMode, getEnemyHitbox,
    removeEnemy,
 } = require('enemies');
const { ATTACK_LIGHTNING_BOLT } = require('enemies/beetles');
const { ENEMY_JUMPING_SPIDER } = require('enemies/spiders');
const { ENEMY_STINK_BUG } = require('areas/sewer');
const { ENEMY_BUBBLE_SHOT } = require('areas/beachBoss');

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
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.mode === 'sitting') {
            if (state.world.throneRoom.sprites[0].left < 10) {
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
            if (enemy.animationTime % 400 === 0){
                state = updateEnemy(state, enemy, {tint: {color: 'black', amount: 0.8}});
                enemy = state.idMap[enemy.id];
            } else if (enemy.animationTime % 400 === 200) {
                state = updateEnemy(state, enemy, {tint: {color: 'white', amount: 0.8}});
                enemy = state.idMap[enemy.id];
            }
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
    const firstPortalTime = 5000 / FRAME_LENGTH;
    let portal = createEnemy(state, ENEMY_FLYING_ANT_PORTAL,
        {left: 720, top: 320, delay: firstPortalTime});
    state = addEnemyToState(state, portal);
    portal = createEnemy(state, ENEMY_JUMPING_SPIDER_PORTAL,
        {left: 700, top: -20, rotation: Math.PI / 2, delay: firstPortalTime + 10 * 50});
    state = addEnemyToState(state, portal);
    portal = createEnemy(state, ENEMY_STINK_BUG_PORTAL,
        {left: 720, top: 200, delay: firstPortalTime + 20 * 50});
    state = addEnemyToState(state, portal);
    portal = createEnemy(state, ENEMY_BUBBLE_SHOT_PORTAL,
        {left: 700, top: 450, rotation: Math.PI / 3, delay: firstPortalTime + 25 * 50});
    state = addEnemyToState(state, portal);
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
    deathAnimation: createAnimation('gfx/scene/portal/portal.png', portalGeometry, {rows: 2, duration: 8, frameMap: [1, 0]}),
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
        return this.checkToSpawn(state, enemy);
    },
    checkToSpawn(state, enemy) {
        const modTime = enemy.animationTime % 15000;
        const number = 10, interval = 300;
        if (modTime % interval || modTime < startTime || modTime > startTime + number * interval) return state;
        const index = (modTime - startTime) / interval;
        const flyingAnt = createEnemy(state, ENEMY_FLYING_ANT, {
            top: enemy.top + 10 + 4 * index,
            left: enemy.left - 5,
            vx: -5,
            vy: -10 + 10 * index / 12,
            followPlayerFor: 1800,
            weight: 30, // This is the weight of the current velocity over the tracking velocity.
        });
        return addEnemyToState(state, flyingAnt);
    },
    props: {
        life: 1,
        stationary: true,
        alpha: 0.8,
    }
};

enemyData[ENEMY_JUMPING_SPIDER_PORTAL] = {
    ...enemyData[ENEMY_FLYING_ANT_PORTAL],
    checkToSpawn(state, enemy) {
        const modTime = enemy.animationTime % 20000;
        const number = 5, interval = 500;
        if (modTime % interval || modTime < startTime || modTime > startTime + number * interval) return state;
        const index = (modTime - startTime) / interval;
        const jumpingSpider = createEnemy(state, ENEMY_JUMPING_SPIDER, {
            top: enemy.top + 20,
            left: enemy.left - 10 + Math.random() * 40,
            vx: -2 - Math.random(),
            vy: 5,
            grounded: true,
            jumps: 3,
            jumpVelocity: random.element([-16, -22, -28]),
            mode: 'jumping',
        });
        return addEnemyToState(state, jumpingSpider);
    },
};

enemyData[ENEMY_STINK_BUG_PORTAL] = {
    ...enemyData[ENEMY_FLYING_ANT_PORTAL],
    checkToSpawn(state, enemy) {
        const modTime = enemy.animationTime % 25000;
        const endTime = startTime + 160, interval = 20;
        if (modTime % interval || modTime < startTime || modTime > endTime) return state;
        const index = (modTime - startTime) / interval;
        const sourceOffset = [20, 40]
        const stinkBug = createEnemy(state, ENEMY_STINK_BUG, {
            left: enemy.left + sourceOffset[0],
            top: enemy.top + sourceOffset[1],
            vx: -5 - index * 2,
            targetX: 700 - index * 80,
            vy: -3 - index - Math.random() * 12,
            ay: 1,
            noCollisionDamage: true,
            gasTTL: 16000 / FRAME_LENGTH,
        });
        return addEnemyToState(state, stinkBug);
    },
};

enemyData[ENEMY_BUBBLE_SHOT_PORTAL] = {
    ...enemyData[ENEMY_FLYING_ANT_PORTAL],
    checkToSpawn(state, enemy) {
        const modTime = enemy.animationTime % 30000;
        const number = 6, interval = 400;
        if (modTime % interval || modTime < startTime || modTime > startTime + number * interval) return state;
        const index = (modTime - startTime) / interval;
        const sourceOffset = [20, 40]
        const bubbleShot = createEnemy(state, ENEMY_BUBBLE_SHOT, {
            left: enemy.left + sourceOffset[0],
            top: enemy.top + sourceOffset[1],
            vx: -4 - Math.random() * 5,
            vy: -1 - Math.random() * 5,
            scaleX: 0.2,
            scaleY: 0.2,
            sourceId: enemy.id,
            sourceOffset,
        });
        return addEnemyToState(state, bubbleShot);
    },
};



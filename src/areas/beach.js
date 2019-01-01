const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ATTACK_BULLET, ENEMY_MONK,
} = require('gameConstants');
const { ENEMY_HORNET, ENEMY_HORNET_KNIGHT } = require('enemies/hornets');
const random = require('random');
const { createAnimation, a, r, requireImage } = require('animations');
const {
    getNewLayer, allWorlds,
    checkpoints, setCheckpoint, setEvent
} = require('world');

const WORLD_BEACH = 'beach';
const CHECK_POINT_BEACH_START = 'beachStart';
const CHECK_POINT_BEACH_MIDDLE = 'beachMiddle';
const CHECK_POINT_BEACH_MIDDLE_TIME = 40000;
const CHECK_POINT_BEACH_END = 'beachEnd'
const CHECK_POINT_BEACH_BOSS = 'beachBoss'
const BEACH_DURATION = 120000;
const BEACH_EASY_DURATION = 30000;
const SAFE_HEIGHT = GAME_HEIGHT;
const ENEMY_SHELL_MONK = 'shellMonk';
const ENEMY_URCHIN = 'urchin';
const ENEMY_SHORT_SAND_TURRET = 'shortSandTurret';
const ENEMY_TALL_SAND_TURRET = 'tallSandTurret';
const ENEMY_BURROW_MONK = 'burrowMonk';

module.exports = {
    CHECK_POINT_BEACH_START,
    WORLD_BEACH,
    getBeachWorld,
    ENEMY_SHELL_MONK,
    ENEMY_URCHIN,
    ENEMY_SHORT_SAND_TURRET,
    ENEMY_TALL_SAND_TURRET,
    ENEMY_BURROW_MONK,
};

const { updatePlayer, getHeroHitbox } = require('heroes');
const {
    updateEnemy, getEnemyHitbox,
    enemyData, shoot_bulletAtPlayer,
    createEnemy, addEnemyToState,
    spawnEnemy, damageEnemy, setMode,
    addBullet, getBulletCoords, renderEnemyFrame,
} = require('enemies');
const { transitionToBeachBoss } = require('areas/beachBoss');
const {
    addEnemyAttackToState, createAttack,
    ATTACK_URCHIN_NEEDLE,
} = require('attacks');

checkpoints[CHECK_POINT_BEACH_START] = function (state) {
    const world = getBeachWorld();
    return {...state, world};
};
checkpoints[CHECK_POINT_BEACH_MIDDLE] = function (state) {
    const world = getBeachWorld();
    // This is 1/3 of the way through the stage.
    world.time = CHECK_POINT_BEACH_MIDDLE_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_BEACH_END] = function (state) {
    const world = getBeachWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return {...state, world};
};
checkpoints[CHECK_POINT_BEACH_BOSS] = function (state) {
    const world = getBeachWorld();
    world.time = 120000;
    return transitionToBeachBoss({...state, world});
};

const {
    nothing, easyFlies, normalFlies, powerup,
    explodingBeetle, lightningBeetle,
    bossPowerup,
    singleEnemy, singleEasyHardEnemy,
} = require('enemyPatterns');
allWorlds[WORLD_BEACH] = {
    initialEvent: 'nothing',
    events: {
        transition: (state, eventTime) => {
            state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
            if (eventTime === 1000) {
                state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 400});
                return setEvent(state, 'nothing');
            }
            return state;
        },
        nothing: nothing(1000, 'easyFlies'),
        easyFlies: easyFlies('powerup'),
        powerup: powerup(['shellMonk', 'urchin']),
        urchin: (state, eventTime) => {
            let spacing = state.world.time < BEACH_EASY_DURATION ? 3000 : 2000;
            if (eventTime === 0) {
                const count = random.range(1, 3);
                let left = WIDTH;
                for (let i = 0; i < count; i++) {
                    state = spawnEnemy(state, ENEMY_URCHIN, {left, top: SAFE_HEIGHT / 2});
                    left += random.element([30, 40, 50]);
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, 'shellMonk');
            }
        },
        flies: normalFlies(BEACH_EASY_DURATION, ['urchin', 'burrowMonk']),
        hornet: singleEasyHardEnemy(ENEMY_HORNET, ENEMY_HORNET_KNIGHT, BEACH_EASY_DURATION, 1000, ['flies']),
        burrowMonk: singleEnemy(ENEMY_BURROW_MONK, 1000, ['burrowMonk', 'sandTurret']),
        shellMonk: singleEnemy(ENEMY_SHELL_MONK, 2000, ['explodingBeetle', 'lightningBeetle']),
        sandTurret: (state, eventTime) => {
            if (eventTime === 0) {
                if (state.world.time < BEACH_EASY_DURATION) {
                    const type = random.element([ENEMY_SHORT_SAND_TURRET, ENEMY_TALL_SAND_TURRET]);
                    return spawnEnemy(state, type, {left: WIDTH, top: GAME_HEIGHT - 200});
                } else if (state.world.time < BEACH_EASY_DURATION * 2) {
                    state = spawnEnemy(state, ENEMY_TALL_SAND_TURRET, {left: WIDTH + 80, top: GAME_HEIGHT - 200, modeTime: -1000});
                    return spawnEnemy(state, ENEMY_SHORT_SAND_TURRET, {left: WIDTH, top: GAME_HEIGHT - 200});
                } else {
                    state = spawnEnemy(state, ENEMY_TALL_SAND_TURRET, {left: WIDTH + 80, top: GAME_HEIGHT - 200, modeTime: -1000});
                    state = spawnEnemy(state, ENEMY_SHORT_SAND_TURRET, {left: WIDTH, top: GAME_HEIGHT - 200});
                    return spawnEnemy(state, ENEMY_SHORT_SAND_TURRET, {left: WIDTH + 160, top: GAME_HEIGHT - 200, modeTime: -1500});
                }
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['urchin', 'shellMonk']));
            }
        },
        explodingBeetle: explodingBeetle(['urchin', 'sandTurret', 'hornet']),
        lightningBeetle: lightningBeetle(['urchin', 'sandTurret', 'hornet']),
        bossPowerup: bossPowerup(CHECK_POINT_BEACH_END, transitionToBeachBoss),
    },
    advanceWorld: (state) => {
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 70 * 6;
        const targetX = Math.max(world.targetX, world.x + 1000);
        let targetY = world.y;
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        if (world.type === WORLD_BEACH && world.time >= BEACH_DURATION && world.event !== 'bossPowerup') {
            return setEvent(state, 'bossPowerup');
        }
        if (world.time === CHECK_POINT_BEACH_MIDDLE_TIME) {
            state = setCheckpoint(state, CHECK_POINT_BEACH_MIDDLE);
        }

        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};

function getBeachWorld() {
    return {
        type: WORLD_BEACH,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 1000,
        targetY: 0,
        targetFrames: 50 * 10,
        time: 0,
        bgm: 'bgm/field.mp3',
        groundHeight: 30,
        ...getBeachLayers(),
    };
}

const skyLoop = createAnimation('gfx/scene/beach/4Asky.png', r(400, 250));
const oceanLoop = createAnimation('gfx/scene/beach/4abacksheet.png', r(400, 150), {cols: 4, duration: 12, frameMap: [0, 0, 0, 1, 2, 3, 3, 3, 2, 1]});
const beachLoop = createAnimation('gfx/scene/beach/sandground.png', r(200, 60));
const rock1Animation = createAnimation('gfx/scene/beach/rock1.png', r(50, 50));
const rock2Animation = createAnimation('gfx/scene/beach/rock2.png', r(50, 50));
const shell1Animation = createAnimation('gfx/scene/beach/shell1.png', r(100, 100));
const shell2Animation = createAnimation('gfx/scene/beach/shell2.png', r(100, 100));
function getBeachLayers() {
    return {
    background: getNewLayer({
        xFactor: 0, yFactor: 1, yOffset: -100, xOffset: 0, unique: true,
        spriteData: {
            sky: {animation: skyLoop, scale: 2},
        },
    }),
    ocean: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -50, syncAnimations: true,
        spriteData: {
            ocean: {animation: oceanLoop, scale: 2},
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: 0,
        spriteData: {
            beach: {animation: beachLoop, scale: 2},
        },
    }),
    detritus: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -56,
        spriteData: {
            rock1: { animation: rock1Animation, scale: 2, next: ['rock2', 'shell2'], offset: [-10, 100, 150], yOffset: [-1, 2, 4] },
            rock2: { animation: rock2Animation, scale: 2, next: ['rock1', 'shell1'], offset: [90, 180], yOffset: [-1, 2, 4] },
            shell1: { animation: shell1Animation, scale: 1, next: ['shell2', 'rock1'], offset: [20, 120], yOffset: [-1, 2, 4] },
            shell2: { animation: shell2Animation, scale: 1, next: ['shell1', 'rock2'], offset: [100], yOffset: [-1, 2, 4] },
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['background', 'ocean', 'ground', 'detritus'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: [],
    };
}

const shellMonkGeometry = r(100, 100, {
    hitboxes:[
        {"left":20,"width":49,"top":44,"height":52},
        {"left":29,"width":37,"top":29,"height":15},
    ]
});
const shellMonkAttackGeometry = r(100, 100, {
    hitboxes:[
        {"left":24,"width":33,"top":61,"height":35},
    ],
    damageBoxes: [
        {"left":28,"width":56,"top":31,"height":52},
        {"left":64,"width":8,"top":5,"height":27},
    ]
});
enemyData[ENEMY_SHELL_MONK] = {
    animation: createAnimation('gfx/enemies/monks/shellrobes.png', shellMonkGeometry, {x: 2}),
    deathAnimation: createAnimation('gfx/enemies/monks/shellrobes.png', shellMonkGeometry, {x: 2}),
    attackAnimation: createAnimation('gfx/enemies/monks/shellrobes.png', shellMonkAttackGeometry, {cols: 2, frameMap: [1, 0, 0, 0, 0, 0, 1], duration: 12}),
    deathSound: 'sfx/robedeath1.mp3',
    isInvulnerable(state, enemy) {
        return !(enemy.attackCooldownFramesLeft > 0);
    },
    shoot: shoot_bulletAtPlayer,
    onDeathEffect(state, enemy) {
        return updateEnemy(state, enemy, {ttl: 600});
    },
    props: {
        life: 6,
        score: 100,
        grounded: true,
        vx: 0,
        bulletSpeed: 5,
        attackCooldownFrames: 84,
        shotCooldownFrames: [100, 120],
        bulletX: 0.8,
        bulletY: 0.74,
        shootFrames: [33, 22, 14],
    },
};

const urchinGeometry = r(100, 100, {
    hitbox: {left: 22, top: 44, width: 62, height: 56},
});
enemyData[ENEMY_URCHIN] = {
    animation: createAnimation('gfx/enemies/urchin.png', urchinGeometry),
    deathSound: 'sfx/throwhit.mp3',
    updateState(state, enemy) {
        if (enemy.dead) return state;
        if (enemy.left < WIDTH / 3 && Math.random() < 0.1) {
            state = damageEnemy(state, enemy.id, {damage: 1});
        }
        return state;
    },
    onDeathEffect(state, enemy) {
        const enemyHitbox = getEnemyHitbox(state, enemy);
        for (let i = 0; i >= -8; i--) {
            const theta = Math.PI * i / 8;
            const vx = Math.cos(theta) * 5;
            const vy = Math.sin(theta) * 5;
            const needle = createAttack(ATTACK_URCHIN_NEEDLE, {
                vx,
                vy,
                rotation: theta + Math.PI / 2,
                left: enemyHitbox.left + enemyHitbox.width / 2 + 2 * vx,
                top: enemyHitbox.top + enemyHitbox.height / 2 + 2 * vy,
            });
            needle.left -= needle.width / 2;
            needle.top -= needle.height / 2;
            state = addEnemyAttackToState(state, needle);
        }
        return updateEnemy(state, enemy, {ttl: 600});
    },
    props: {
        life: 5,
        score: 20,
        grounded: true,
        vx: 0,
    },
};

const turretGeometry = r(200, 250, {
    hitbox: {left: 45, top: 124, width: 40, height: 126},
    hitboxes: [],
});
const monkAnimation = createAnimation('gfx/enemies/turrets.png', r(200, 250), {cols: 4, frameMap: [1, 2], duration: 12});
monkAnimation.frames[1].hitbox = {left: 45, top: 180, width: 40, height: 10};
monkAnimation.frames[0].hitbox = {left: 45, top: 160, width: 40, height: 30};
enemyData[ENEMY_SHORT_SAND_TURRET] = {
    animation: createAnimation('gfx/enemies/turrets.png', turretGeometry, {x: 4}),
    monkAnimation,
    deathSound: 'sfx/robedeath1.mp3',
    updateState(state, enemy) {
        if (enemy.dead) return state;
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.mode === 'idle') {
            if (enemy.modeTime >= 3000) {
                return this.setMode(state, enemy, 'spawn');
            }
            if (enemy.modeTime === 2000 && (enemy.cannotSpawn || Math.random() <= 0.6)) {
                return this.setMode(state, enemy, 'shoot');
            }
        } else if (enemy.mode === 'shoot') {
            if (enemy.modeTime === 500 || enemy.modeTime === 1500) {
                const bullet = createAttack(ATTACK_BULLET, {});
                const {top, left} = getBulletCoords(state, enemy);
                const hitbox = getHeroHitbox(state.players[0]);
                const dx = hitbox.left + hitbox.width / 2 - (left + bullet.width / 2);
                const dy = hitbox.top + hitbox.height / 2 - (top + bullet.height / 2);
                let baseTheta = Math.atan2(dy, dx);
                const numBullets = 3;
                for (let i = 0; i < numBullets; i++) {
                    const theta = baseTheta - Math.PI / 4 + i * Math.PI / (2 * (numBullets - 1));
                    state = addBullet(state, enemy, () => theta);
                }
                return state;
            } else if (enemy.modeTime >= 3000) {
                return this.setMode(state, enemy, 'idle');
            }
        } else if (enemy.mode === 'spawn') {
            if (enemy.modeTime === 200) {
                const hitbox = getEnemyHitbox(state, enemy);
                const monk = createEnemy(state, ENEMY_MONK, {
                    left: hitbox.left, top: hitbox.top + hitbox.height / 2 - 10
                });
                state = addEnemyToState(state, monk);
                return this.setMode(state, enemy, 'idle');
            }
        }
        return state;
    },
    // Draw the monk on top of the turret during the shoot animation.
    drawOver(context, state, enemy) {
        if (enemy.dead) return;
        if (enemy.mode !== 'shoot' && enemy.mode !== 'spawn') return;
        const frame = this.getMonkAnimationFrame(state, enemy);
        renderEnemyFrame(context, state, enemy, frame);
    },
    getMonkAnimationFrame(state, enemy) {
        let frameIndex = 0; // shooting frame
        if (enemy.modeTime < 200 || enemy.modeTime > 2800) frameIndex = 1; // entering/exiting.
        return this.monkAnimation.frames[frameIndex];
    },
    getHitboxes(state, enemy) {
        if (enemy.dead || enemy.mode !== 'shoot') return [];
        const frame = this.getMonkAnimationFrame(state, enemy);
        return frame.hitboxes || [frame.hitbox || frame];
    },
    onDeathEffect(state, enemy) {
        // Add dead monk falling from turret.
        const hitbox = getEnemyHitbox(state, enemy);
        const monk = createEnemy(state, ENEMY_MONK, {
            dead: true, ttl: 1000, vx: 5, left: hitbox.left, top: hitbox.top + hitbox.height / 2 - 10,
        });
        state = addEnemyToState(state, monk);
        return this.setMode(state, enemy, 'idle');
    },
    setMode,
    props: {
        life: 5,
        score: 500,
        mode: 'idle',
        modeTime: 0,
        bulletX: 150 / 200,
        bulletY: 0.4,
        bulletSpeed: 5,
        stationary: true,
        persist: true,
        grounded: true,
        background: true,
    },
};

const tallTurretGeometry = r(200, 250, {
    hitbox: {left: 48, top: -94, width: 45, height: 344},
    hitboxes: [],
});
const tallMonkAnimation = createAnimation('gfx/enemies/turrets.png', r(200, 250), {cols: 4, frameMap: [0, 3], duration: 12});
tallMonkAnimation.frames[1].hitbox = {left: 45, top: 80, width: 40, height: 10};
tallMonkAnimation.frames[0].hitbox = {left: 45, top: 60, width: 40, height: 30};
enemyData[ENEMY_TALL_SAND_TURRET] = {
    ...enemyData[ENEMY_SHORT_SAND_TURRET],
    animation: createAnimation('gfx/enemies/turrets.png', tallTurretGeometry, {x: 5}),
    monkAnimation: tallMonkAnimation,
    deathSound: 'sfx/robedeath1.mp3',
    props: {
        ...enemyData[ENEMY_SHORT_SAND_TURRET].props,
        bulletX: 150 / 200,
        bulletY: 0.45,
    },
};

const burrowMonkGeometry = r(36, 50, {
    hitboxes: [],
});
const burrowMonkShootAnimation = createAnimation('gfx/enemies/monks/burrowrobe.png', burrowMonkGeometry, {cols: 2, frameMap: [1, 0, 0, 0, 0, 0, 1], duration: 12});
burrowMonkShootAnimation.frames[0].hitboxes = [{ left:0, top: 22, width: 36, height: 20}];
burrowMonkShootAnimation.frames[1].hitboxes = [{ left:0, top: 0, width: 36, height: 32}];
enemyData[ENEMY_BURROW_MONK] = {
    animation: createAnimation('gfx/enemies/monks/burrowrobe.png', burrowMonkGeometry, {x: 2, cols: 2, duration: 6}),
    deathAnimation: createAnimation('gfx/enemies/monks/robeded.png', r(46, 41)),
    attackAnimation: burrowMonkShootAnimation,
    deathSound: 'sfx/robedeath1.mp3',
    shoot: shoot_bulletAtPlayer,
    accelerate(state, enemy) {
        if (enemy.attackCooldownFramesLeft > 0) {
            return {...enemy, vx: 0};
        }
        const playerHitbox = getHeroHitbox(state.players[0]);
        const enemyHitbox = getEnemyHitbox(state, enemy);
        if (enemy.animationTime < 5000 && enemyHitbox.left + enemyHitbox.width / 2 < playerHitbox.left + playerHitbox.width / 2) {
            return {...enemy, vx: Math.min(enemy.speed + 1, enemy.vx + 1)};
        } else {
            return {...enemy, vx: Math.max(-enemy.speed + 1, enemy.vx - 1)};
        }
    },
    onDeathEffect(state, enemy) {
        return updateEnemy(state, enemy, {ttl: 600});
    },
    props: {
        life: 4,
        score: 40,
        grounded: true,
        speed: 4,
        bulletSpeed: 5,
        attackCooldownFrames: 84,
        shotCooldownFrames: [160, 200],
        bulletX: 0.5,
        bulletY: 0.2,
        shootFrames: [64, 20],
    },
};

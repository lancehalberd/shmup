const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ATTACK_BULLET, ENEMY_MONK,
} = require('gameConstants');
const { ENEMY_HORNET, ENEMY_HORNET_KNIGHT } = require('enemies/hornets');
const random = require('random');
const { createAnimation, a, r, requireImage, getFrame } = require('animations');
const {
    getNewLayer, allWorlds, updateLayerSprite,
    checkpoints, setCheckpoint, setEvent, advanceWorld,
} = require('world');

const WORLD_OCEAN = 'ocean';
const CHECK_POINT_OCEAN_START = 'oceanStart';
const CHECK_POINT_OCEAN_END = 'oceanEnd'
const OCEAN_DURATION = 40000;
const ENEMY_PIRANHA = 'piranha';
const ENEMY_PIRANHA_RIDER = 'piranhaRider';
const ENEMY_SEA_URCHIN = 'seaUrchin';

module.exports = {
    CHECK_POINT_OCEAN_START,
    WORLD_OCEAN,
    ENEMY_PIRANHA,
    ENEMY_SEA_URCHIN,
    getOceanWorld,
};

const { updatePlayer, getHeroHitbox } = require('heroes');
const {
    updateEnemy, getEnemyHitbox,
    enemyData, shoot_bulletAtPlayer,
    createEnemy, addEnemyToState,
    spawnEnemy, damageEnemy, setMode,
    addBullet, getBulletCoords, renderEnemyFrame,
} = require('enemies');
const { transitionToCastle } = require('areas/oceanToCastle');
const {
    addEnemyAttackToState, createAttack, ATTACK_URCHIN_NEEDLE,
} = require('attacks');

const { ENEMY_SHELL_MONK, ENEMY_URCHIN, ENEMY_SHORT_SAND_TURRET, ENEMY_TALL_SAND_TURRET } = require('areas/beach');
const { ENEMY_BUBBLE_SHIELD } = require('areas/beachBoss');
checkpoints[CHECK_POINT_OCEAN_START] = function (state) {
    const world = getOceanWorld();
    return advanceWorld(advanceWorld({...state, world}));
};
checkpoints[CHECK_POINT_OCEAN_END] = function (state) {
    const world = getOceanWorld();
    world.y = 0;
    world.time = OCEAN_DURATION - 5000;
    return advanceWorld(advanceWorld({...state, world}));
};

const {
    nothing,  powerup, bossPowerup, singleEnemy,
} = require('enemyPatterns');
allWorlds[WORLD_OCEAN] = {
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
        nothing: nothing(1000, 'easyPiranha'),
        easyPiranha: (state, eventTime) => {
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_PIRANHA, {left: WIDTH, top: GAME_HEIGHT / 2, delay: 40});
            }
            eventTime -= 4000;
            if (eventTime === 0) {
                let tops = [GAME_HEIGHT / 3, 2 * GAME_HEIGHT / 3];
                state = spawnEnemy(state, ENEMY_PIRANHA, {left: WIDTH, top: random.removeElement(tops)});
                return spawnEnemy(state, ENEMY_PIRANHA, {left: WIDTH, top: random.removeElement(tops), delay: 40});
            }
            eventTime -= 4000;
            if (eventTime >= 0) {
                return setEvent(state, 'powerup');
            }
        },
        powerup: powerup('seaUrchins'),
        urchin: (state, eventTime) => {
            let spacing = 2000;
            if (eventTime === 0) {
                const count = random.range(1, 3);
                let left = WIDTH;
                for (let i = 0; i < count; i++) {
                    state = spawnEnemy(state, ENEMY_URCHIN, {left, top: 400});
                    left += random.element([30, 40, 50]);
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, ['urchin', 'shellMonk']);
            }
        },
        seaUrchins: (state, eventTime) => {
            let spacing = 2000;
            if (eventTime === 0) {
                const count = random.range(1, 3);
                let left = WIDTH;
                for (let i = 0; i < count; i++) {
                    state = spawnEnemy(state, ENEMY_SEA_URCHIN, {
                        left, top: random.range(200, 300),
                    });
                    left += random.element([60, 80, 100]);
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, 'piranha');
            }
        },
        shellMonk: singleEnemy(ENEMY_SHELL_MONK, 2000, ['sandTurret']),
        sandTurret: (state, eventTime) => {
            if (eventTime === 0) {
                state = spawnEnemy(state, ENEMY_TALL_SAND_TURRET, {left: WIDTH + 80, top: GAME_HEIGHT - 200, modeTime: -1000, cannotSpawn: true});
                state = spawnEnemy(state, ENEMY_TALL_SAND_TURRET, {left: WIDTH + 240, top: GAME_HEIGHT - 200, modeTime: -2000, cannotSpawn: true});
                state = spawnEnemy(state, ENEMY_SHORT_SAND_TURRET, {left: WIDTH, top: GAME_HEIGHT - 200, cannotSpawn: true});
                state = spawnEnemy(state, ENEMY_SHORT_SAND_TURRET, {left: WIDTH + 160, top: GAME_HEIGHT - 200, modeTime: -1500, cannotSpawn: true});
                return spawnEnemy(state, ENEMY_SHORT_SAND_TURRET, {left: WIDTH + 320, top: GAME_HEIGHT - 200, modeTime: -3000, cannotSpawn: true});
            }
            eventTime -= 4000;
            if (eventTime >= 0) {
                return setEvent(state, ['seaUrchins', 'sandTurret']);
            }
        },
        piranha: (state, eventTime) => {
            if (eventTime === 0) {
                let tops = [GAME_HEIGHT / 4, GAME_HEIGHT / 2, 3 * GAME_HEIGHT / 4];
                state = spawnEnemy(state, ENEMY_PIRANHA, {left: WIDTH, top: random.removeElement(tops)});
                state = spawnEnemy(state, ENEMY_PIRANHA, {left: WIDTH, top: random.removeElement(tops), delay: 40});
                return spawnEnemy(state, ENEMY_PIRANHA, {left: WIDTH, top: random.removeElement(tops), delay: 80});
            }
            eventTime -= 4000;
            if (eventTime >= 0) {
                return setEvent(state, ['urchin', 'shellMonk']);
            }
        },
    },
    advanceWorld(state) {
        //state = this.updateWater(state);
        state = this.floatEnemies(state);
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 70 * 6;
        const targetX = Math.max(world.targetX, world.x + 1000);
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetFrames, time};
        state = {...state, world};
        if (!state.enemies.filter(e => !e.dead && e.type === ENEMY_BUBBLE_SHIELD).length) {
            state = addEnemyToState(state, createEnemy(state, ENEMY_BUBBLE_SHIELD, {left: -200}));
        }
        if (world.type === WORLD_OCEAN && world.time >= OCEAN_DURATION) {
            return transitionToCastle(state);
        }
        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
    // Scroll the deep water up at the beginning of the level.
    updateWater(state) {
        let water = state.world.deepWater.sprites[0];
        if (!water) return state;
        const start = 0, end = GAME_HEIGHT - water.height;
        const top = Math.max(end, start - state.world.time / 50);
        state = updateLayerSprite(state, 'deepWater', 0, {left: 0, top});
        return updateLayerSprite(state, 'deepWaterback', 0, {left: 0, top});
    },
    floatEnemies(state) {
        for (const enemy of state.enemies) {
            if (!enemy.dead || enemy.grounded) continue;
            const enemyHitbox = getEnemyHitbox(state, enemy);
            state = updateEnemy(state, enemy, {vx: enemy.vx * 0.99, vy: enemy.vy * 0.85 - 1.2 });
        }
        return state;
    }
};

function getOceanWorld() {
    return {
        type: WORLD_OCEAN,
        x: 0,
        y: 900,
        vx: 0,
        vy: 0,
        targetX: 1000,
        targetY: 0,
        targetFrames: 50 * 45,
        time: 0,
        bgm: 'bgm/ocean.mp3',
        groundHeight: 30,
        ...getOceanLayers(),
    };
}

const beachLoop = createAnimation('gfx/scene/beach/sandground.png', r(200, 60));
const bubbles1Animation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120));
const bubbles2Animation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {x: 1});
const bubblesAnimations = [bubbles1Animation, bubbles2Animation];
const seaweedAnimation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {cols: 2, x: 2, duration: 24});
const fishAnimation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {x: 4});
const coral1Animation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {x: 5});
const coral2Animation = createAnimation('gfx/scene/ocean/coral.png', r(120, 120), {x: 6});
const deepWaterAnimation = createAnimation('gfx/scene/ocean/under.png', r(400, 900));

function getOceanLayers() {
    return {
    deepWaterback: getNewLayer({
        xFactor: 0, yFactor: 1, yOffset: 0, xOffset: 0, unique: true,
        spriteData: {
            sky: {animation: deepWaterAnimation, scale: 2},
        },
    }),
    deepWater: getNewLayer({
        xFactor: 0, yFactor: 1, yOffset: 0, xOffset: 0, unique: true,
        spriteData: {
            sky: {animation: deepWaterAnimation, scale: 2, alpha: 0.5},
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: 0,
        spriteData: {
            ocean: {animation: beachLoop, scale: 2},
        },
    }),
    highStuff: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -1200,
        spriteData: {
            bubbles: { animation: bubblesAnimations, vy: -1, scale: 2, offset: [100, 150], yOffset: [0, 100, 200] },
            fish: { animation: fishAnimation, scale: 2, vx: -1, offset: [100, 150], yOffset: [50, 150, 250] },
        },
    }),
    midStuff: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -800,
        spriteData: {
            bubbles: { animation: bubblesAnimations, vy: -1, scale: 2, offset: [100, 150], yOffset: [0, 100, 200] },
            fish: { animation: fishAnimation, scale: 2, vx: -2, offset: [100, 150], yOffset: [50, 150, 250] },
        },
    }),
    lowStuff: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -400,
        spriteData: {
            bubbles: { animation: bubblesAnimations, vy: -1, scale: 2, offset: [100, 150], yOffset: [0, 100, 200] },
            fish: { animation: fishAnimation, scale: 2, vx: -1, offset: [100, 150], yOffset: [50, 150, 250] },
        },
    }),
    groundStuff: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -56,
        spriteData: {
            seaweed: { animation: seaweedAnimation, scale: 2, offset: [-10, 100, 150], yOffset: [-1, 2, 4] },
            coral1: { animation: coral1Animation, scale: 1, offset: [20, 120], yOffset: [-1, 2, 4] },
            coral2: { animation: coral2Animation, scale: 1, offset: [100], yOffset: [-1, 2, 4] },
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['deepWaterback', 'ground', 'highStuff', 'midStuff', 'lowStuff', 'groundStuff'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: ['deepWater'],
    };
}

const piranhaGeometry = r(140, 120, {
    hitboxes: [
        {"left":6,"width":129,"top":55,"height":25},
        {"left":42,"width":51,"top":79,"height":18},
        {"left":40,"width":57,"top":32,"height":23},
        {"left":45,"width":16,"top":13,"height":28}, //rider
    ]
});
const teethAnimation = createAnimation('gfx/enemies/piranha.png', piranhaGeometry, {x: 3});
const piranhaMonkAnimation = createAnimation('gfx/enemies/piranha.png', piranhaGeometry, {x: 4});
enemyData[ENEMY_PIRANHA_RIDER] = {
    animation: createAnimation('gfx/enemies/piranha.png', piranhaGeometry, {x: 5}),
    props: {
        life: 0,
        dead: true,
    }
};
enemyData[ENEMY_PIRANHA] = {
    animation: createAnimation('gfx/enemies/piranha.png', piranhaGeometry, {cols: 2}),
    deathAnimation: createAnimation('gfx/enemies/piranha.png', piranhaGeometry, {x: 2}),
    updateState(state, enemy) {
        if (enemy.dead) return state;
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.mode === 'enter') {
            if (enemy.modeTime > 500) {
                return setMode(state, enemy, 'pause', {vx: 0});
            }
            return updateEnemy(state, enemy, {vx: enemy.vx * 0.98});
        } else if (enemy.mode === 'pause') {
            if (enemy.modeTime > 1500) {
                return setMode(state, enemy, 'charge', {vx: -15});
            }
        }
        return state;
    },
    drawOver(context, state, enemy) {
        if (enemy.dead) return;
        if (enemy.mode === 'charge') {
            let frame = getFrame(teethAnimation, enemy.animationTime);
            renderEnemyFrame(context, state, enemy, frame);
        }
        let frame = getFrame(piranhaMonkAnimation, enemy.animationTime);
        renderEnemyFrame(context, state, enemy, frame);
    },
    onDeathEffect(state, enemy) {
        state = updateEnemy(state, enemy, {vx: 3});
        // Add the falling knight.
        const rider = createEnemy(state, ENEMY_PIRANHA_RIDER, {
            life: 0,
            dead: true,
            left: enemy.left,
            top: enemy.top,
            vx: 5,
            vy: 0,
        });
        return addEnemyToState(state, rider);
    },
    props: {
        life: 10,
        score: 100,
        vx: -8,
        mode: 'enter',
        modeTime: 0,
    }
};

enemyData[ENEMY_SEA_URCHIN] = {
    ...enemyData[ENEMY_URCHIN],
    updateState(state, enemy) {
        if (enemy.dead) return state;
        state = updateEnemy(state, enemy, {vy: Math.cos((enemy.left * -20 + enemy.animationTime) / 2000)});
        enemy = state.idMap[enemy.id];
        if (enemy.left < WIDTH / 3 && Math.random() < 0.1) {
            state = damageEnemy(state, enemy.id, {damage: 1});
        }
        return state;
    },
    onDeathEffect(state, enemy) {
        const enemyHitbox = getEnemyHitbox(state, enemy);
        for (let i = 0; i >= -12; i--) {
            const theta = 2 * Math.PI * i / 8;
            const vx = Math.cos(theta) * 5;
            const vy = Math.sin(theta) * 5;
            const needle = createAttack(ATTACK_URCHIN_NEEDLE, {
                vx,
                vy,
                rotation: theta + Math.PI / 2,
                left: enemyHitbox.left + enemyHitbox.width / 2 + 5 * vx,
                top: enemyHitbox.top + enemyHitbox.height / 2 + 5 * vy,
                tint: {amount: 1, color: 'red'},
            });
            needle.left -= needle.width / 2;
            needle.top -= needle.height / 2;
            state = addEnemyAttackToState(state, needle);
        }
        return state;
    },
    props: {
        life: 5,
        score: 40,
        hanging: true,
        vx: 0,
    },
};

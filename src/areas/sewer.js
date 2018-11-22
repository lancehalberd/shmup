const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ATTACK_RED_LASER,
} = require('gameConstants');
const random = require('random');
const { createAnimation, a, r, requireImage } = require('animations');
const { getGroundHeight, getNewLayer, allWorlds,
    checkpoints, setCheckpoint, getHazardCeilingHeight, getHazardHeight, setEvent,
} = require('world');
const { ENEMY_CARGO_BEETLE, ENEMY_LIGHTNING_BEETLE } = require('enemies/beetles');

const WORLD_SEWER = 'sewer';
const CHECK_POINT_SEWER_START = 'sewerStart';
const CHECK_POINT_SEWER_MIDDLE = 'sewerMiddle';
const CHECK_POINT_SEWER_MIDDLE_TIME = 40000;
const CHECK_POINT_SEWER_END = 'sewerEnd'
const CHECK_POINT_SEWER_BOSS = 'sewerBoss'
const ENEMY_RAT = 'rat';
const ENEMY_STINK_BUG = 'stinkBug';

const SEWER_DURATION = 120000;
const SEWER_EASY_DURATION = 30000;

const SAFE_HEIGHT = GAME_HEIGHT - getSewerWorld().hazardHeight;

module.exports = {
    CHECK_POINT_SEWER_START,
    WORLD_SEWER,
    getSewerWorld,
    ENEMY_RAT,
    ENEMY_STINK_BUG,
};

checkpoints[CHECK_POINT_SEWER_START] = function (state) {
    const world = getSewerWorld();
    return {...state, world};
};
checkpoints[CHECK_POINT_SEWER_MIDDLE] = function (state) {
    const world = getSewerWorld();
    // This is 1/3 of the way through the stage.
    world.time = CHECK_POINT_SEWER_MIDDLE_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_SEWER_END] = function (state) {
    const world = getSewerWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return {...state, world};
};
checkpoints[CHECK_POINT_SEWER_BOSS] = function (state) {
    const world = getSewerWorld();
    world.time = 120000;
    return transitionToSewerBoss({...state, world});
};

const { nothing, powerup, easyRoaches, normalRoaches, } = require('enemyPatterns');
allWorlds[WORLD_SEWER] = {
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
        nothing: nothing(1000, 'easyRoaches'),
        easyRoaches: easyRoaches('powerup'),
        powerup: powerup(['rats', 'bugs']),
        cockroaches: normalRoaches(SEWER_EASY_DURATION, ['rats', 'bugs']),
        bugs(state, eventTime) {
            return setEvent(state, ['randomBugs', 'wallOfBugs']);
        },
        randomBugs(state, eventTime) {
            if (eventTime === 0) {
                state = spawnEnemy(state, ENEMY_STINK_BUG, {left: WIDTH, top: random.range(20, SAFE_HEIGHT - 40)});
                state = spawnEnemy(state, ENEMY_STINK_BUG, {left: WIDTH + 100, top: random.range(20, SAFE_HEIGHT - 40)});
                return spawnEnemy(state, ENEMY_STINK_BUG, {left: WIDTH + 200, top: random.range(20, SAFE_HEIGHT - 40)});
            }
            eventTime -= 4000;
            if (eventTime >= 0) {
                return setEvent(state, ['cockroaches', 'rats']);
            }
        },
        wallOfBugs(state, eventTime) {
            let skipIndex = random.range(1, 5);
            if (eventTime === 0) {
                const dx = random.element([-20, -10, 0, 10, 20]);
                let left = WIDTH + 200;
                for (let top = 20, index = 0; top < SAFE_HEIGHT - 40; top += random.element([50, 70]), left += dx, index++) {
                    if (skipIndex === index) continue;
                    state = spawnEnemy(state, ENEMY_STINK_BUG, {left, top});
                }
                return state;
            }
            eventTime -= 4000;
            if (eventTime >= 0) {
                return setEvent(state, ['cockroaches', 'rats']);
            }
        },
        rats: (state, eventTime) => {
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_RAT, {left: WIDTH, top: random.range(SAFE_HEIGHT / 4, SAFE_HEIGHT / 2)});
            }
            eventTime -= 4000;
            if (eventTime >= 0) {
                return setEvent(state, ['cockroaches', 'bugs']);
            }
        },
        bossPrep: (state) => {
            if (state.enemies.length === 0) {
                state = setCheckpoint(state, CHECK_POINT_SEWER_END);
                return transitionToSewerBoss(state);
            }
        },
    },
    advanceWorld: (state) => {
        state = floatEnemies(state);
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 70 * 5;
        const targetX = Math.max(world.targetX, world.x + 1000);
        let targetY = world.y;
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        if (world.type === WORLD_SEWER && world.time >= SEWER_DURATION && world.event !== 'bossPrep') {
            return setEvent(state, 'bossPrep');
        }
        if (world.time === CHECK_POINT_SEWER_MIDDLE_TIME) {
            state = setCheckpoint(state, CHECK_POINT_SEWER_MIDDLE);
        }

        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};
function floatEnemies(state) {
    for (const enemy of state.enemies) {
        if (!enemy.dead) continue;
        const enemyHitBox = getEnemyHitBox(state, enemy);
        if (enemyHitBox.top + enemyHitBox.height >= getHazardHeight(state)) {
            state = updateEnemy(state, enemy, {vx: (enemy.vx - 1.5) * 0.9, vy: enemy.vy * 0.85 - 1.2 });
        }
    }
    return state;
}

const sewerLoop = createAnimation('gfx/scene/sewer/sewer.png', r(400, 500));
const waterAnimation = createAnimation('gfx/scene/sewer/50water.png', r(200, 100));
const waterTopRectangle = r(200, 30);
const waterTopAnimation = {
    frames: [
        {...waterTopRectangle, image: requireImage('gfx/scene/sewer/water1.png')},
        {...waterTopRectangle, image: requireImage('gfx/scene/sewer/water2.png')},
        {...waterTopRectangle, image: requireImage('gfx/scene/sewer/water3.png')},
        {...waterTopRectangle, image: requireImage('gfx/scene/sewer/water2.png')},
    ],
    frameDuration: 20,
}
function getSewerLayers () {
    return {
        background: getNewLayer({
            xFactor: 1, yFactor: 1, maxY: 0,
            spriteData: {
                sewer: {animation: sewerLoop, scale: 2, next: ['sewer']},
            },
        }),
        water: getNewLayer({
            xFactor: 1, yFactor: 1, yOffset: 0,
            spriteData: {
                water: {animation: waterAnimation, scale: 2, next: ['water']},
            },
        }),
        ground: getNewLayer({
            xFactor: 1, yFactor: 1, yOffset: -140,
            spriteData: {
                water: {animation: waterTopAnimation, scale: 2, vx: -3, next: ['water']},
            },
        }),
        // Background layers start at the top left corner of the screen.
        bgLayerNames: [],
        // Midground layers use the bottom of the HUD as the top of the screen,
        // which is consistent with all non background sprites, making hit detection simple.
        mgLayerNames: ['background', 'water', 'ground'],
        // Foreground works the same as Midground but is drawn on top of game sprites.
        fgLayerNames: [],
    };
}

function getSewerWorld() {
    return {
        type: WORLD_SEWER,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 1000,
        targetY: 0,
        targetFrames: 50 * 10,
        time: 0,
        bgm: 'bgm/alley.mp3',
        hazardHeight: 170,
        groundHeight: 0,
        ...getSewerLayers(),
    };
}

const { updatePlayer, getHeroHitBox } = require('heroes');
const { spawnEnemy, enemyData, getEnemyHitBox, updateEnemy } = require('enemies');
const { transitionToSewerBoss } = require('areas/sewerBoss');
const { createAttack, addEnemyAttackToState, ATTACK_GAS } = require('attacks');

const ratGeometry = r(120, 120, {
    hitBox: {left: 50, top: 2, width: 25, height: 85}
});
const ratJumpGeometry = r(120, 120, {
    hitBox: {left: 35, top: 35, width: 75, height: 30}
});
enemyData[ENEMY_RAT] = {
    animation: createAnimation('gfx/enemies/rat.png', ratGeometry, {cols: 4, frameMap: [0, 1, 2, 3, 2, 1]}),
    pauseAnimation: createAnimation('gfx/enemies/rat.png', ratGeometry, {x: 3}),
    jumpAnimation: createAnimation('gfx/enemies/rat.png', ratJumpGeometry, {x: 5}),
    deathAnimation: createAnimation('gfx/enemies/rat.png', ratGeometry, {x: 4}),
    deathSound: 'sfx/hit.mp3',
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.mode === 'pause') return this.pauseAnimation;
        if (enemy.mode === 'jump') return this.jumpAnimation;
        return this.animation;
    },
    accelerate(state, enemy) {
        const minTop = Math.max(-10, getHazardCeilingHeight(state) + 5);
        if (enemy.mode === 'pause') {
            const heroHitBox = getHeroHitBox(state.players[0]);
            const enemyHitBox = getEnemyHitBox(state, enemy);
            const dx = (heroHitBox.left + heroHitBox.width / 2) - (enemyHitBox.left + enemyHitBox.width / 2);
            if (dx >= -100 && dx <= 100) {
                return { ...enemy,
                    vy: 3,
                    // Adding the player velocity makes them track the player much better,
                    // but if we use it exactly, it is a little too annoying, so just add half
                    // to make it easier to dodge.
                    vx: Math.max(-4, Math.min(4, dx / 25)) + state.players[0].sprite.vx / 2,
                    mode: 'jump', modeTime: 0, animationTime: 0,
                    hanging: false, grounded: true,
                };
            } else if (enemy.modeTime < 1500) {
                return { ...enemy, vy: enemy.vy * 0.5, modeTime: enemy.modeTime + FRAME_LENGTH };
            } else {
                return { ...enemy, mode: enemy.top <= minTop ? 'climbDown' : 'climb', modeTime: 0 };
            }
        } else if (enemy.mode === 'climb') {
            if (enemy.modeTime >= 600) {
                return { ...enemy, mode: 'pause', modeTime: 0 };
            } else if (enemy.top >= minTop) {
                return { ...enemy, vy: -3, modeTime: enemy.modeTime + FRAME_LENGTH };
            } else if (enemy.modeTime >= 500) {
                return { ...enemy, mode: 'pause', modeTime: 0 };
            } else {
                return { ...enemy, vy: enemy.vy * 0.5, modeTime: enemy.modeTime + FRAME_LENGTH };
            }
        } else if (enemy.mode === 'climbDown') {
            if (enemy.modeTime >= 400) {
                return { ...enemy, mode: 'pause', modeTime: 0 };
            } else {
                return { ...enemy, vy: 2, modeTime: enemy.modeTime + FRAME_LENGTH };
            }
        }
        return enemy;
    },
    onDeathEffect(state, enemy) {
        // Looks bad when the enemy hits the water if the graphic flips.
        return updateEnemy(state, enemy, {doNotFlip: true});
    },
    props: {
        life: 8,
        hanging: true,
        mode: 'climb',
        modeTime: 0,
        score: 50,
    }
};
const stinkBugGeometry = r(30, 30);
enemyData[ENEMY_STINK_BUG] = {
    animation: createAnimation('gfx/enemies/stinkbugsheet.png', stinkBugGeometry, {cols: 3}),
    deathAnimation: createAnimation('gfx/enemies/stinkbugsheet.png', stinkBugGeometry, {x: 3}),
    deathSound: 'sfx/flydeath.mp3',
    onDeathEffect(state, enemy) {
        const enemyHitBox = getEnemyHitBox(state, enemy);
        const gas = createAttack(ATTACK_GAS, {
            left: enemyHitBox.left + enemyHitBox.width / 2,
            top: enemyHitBox.top + enemyHitBox.height / 2,
        });
        gas.left -= gas.width / 2;
        gas.top -= gas.height / 2;
        return addEnemyAttackToState(state, gas);
    },
    props: {
        life: 2,
        vx: 0,
        verticalSpeed: 6,
        hanging: true,
        bounceSpeed: 4,
        score: 20,
    },
};

/*

I moved the mounted enemy to the Archerfish.
The Archerfish alone has an attack, and can attack even when mounted,
shooting globs of water or a stream of water that when hitting the knight pushes them downward.
The water can move in an arc, perhaps, but if that is impossible, can be like a laser.
I can make any attack related effect needed on my end, but I was not sure how it needed to be done.

*/


const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
} = require('gameConstants');
const random = require('random');
const { createAnimation, r, requireImage } = require('animations');
const { getNewLayer, allWorlds,
    checkpoints, setCheckpoint, getHazardCeilingHeight, getHazardHeight, setEvent,
    advanceWorld,
} = require('world');

const WORLD_SEWER = 'sewer';
const CHECK_POINT_SEWER_START = 'sewerStart';
const CHECK_POINT_SEWER_MIDDLE = 'sewerMiddle';
const CHECK_POINT_SEWER_MIDDLE_TIME = 40000;
const CHECK_POINT_SEWER_END = 'sewerEnd'
const CHECK_POINT_SEWER_BOSS = 'sewerBoss'
const ENEMY_RAT = 'rat';
const ENEMY_STINK_BUG = 'stinkBug';
const ENEMY_ARCHER_FISH = 'archerFish';
const ENEMY_ARCHER_FISH_SOLDIER = 'archerFishSoldier';

const SEWER_DURATION = 120000;
const SEWER_EASY_DURATION = 30000;

const SAFE_HEIGHT = GAME_HEIGHT - getSewerWorld().hazardHeight;

module.exports = {
    CHECK_POINT_SEWER_START,
    WORLD_SEWER,
    getSewerWorld,
    ENEMY_RAT,
    ENEMY_STINK_BUG,
    ENEMY_ARCHER_FISH,
    ENEMY_ARCHER_FISH_SOLDIER,
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
    // Need to call advanceWorld once so that sprites from the sewer are present which
    // the transition requires.
    return transitionToSewerBoss(advanceWorld({...state, world}));
};

const { nothing, powerup, easyRoaches, normalRoaches, bossPowerup, } = require('enemyPatterns');
allWorlds[WORLD_SEWER] = {
    initialEvent: 'nothing',
    events: {
        transition: (state, eventTime) => {
            state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 150});
            if (eventTime === 1000) {
                state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 200});
                return setEvent(state, 'nothing');
            }
            return state;
        },
        nothing: nothing(1000, 'easyRoaches'),
        easyRoaches: easyRoaches('powerup'),
        powerup: powerup(['rats', 'bugs', 'fish']),
        cockroaches: normalRoaches(SEWER_EASY_DURATION, ['fish', 'bugs']),
        bugs(state) {
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
                return setEvent(state, ['cockroaches', 'fish']);
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
                return setEvent(state, ['cockroaches', 'fish']);
            }
        },
        fish: (state, eventTime) => {
            if (eventTime === 0) {
                if (state.world.time < SEWER_EASY_DURATION ) {
                    return spawnEnemy(state, ENEMY_ARCHER_FISH, {left: WIDTH + 100, top: GAME_HEIGHT + 50});
                } else {
                    return spawnEnemy(state, ENEMY_ARCHER_FISH_SOLDIER, {left: WIDTH + 100, top: getHazardHeight(state) + 50});
                }

            }
            eventTime -= 1000;
            if (eventTime >= 0) {
                return setEvent(state, ['rats', 'bugs']);
            }
        },
        rats: (state, eventTime) => {
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_RAT, {left: WIDTH, top: random.range(SAFE_HEIGHT / 4, SAFE_HEIGHT / 2)});
            }
            eventTime -= 1000;
            if (eventTime >= 0) {
                return setEvent(state, ['cockroaches', 'bugs']);
            }
        },
        bossPowerup: bossPowerup(CHECK_POINT_SEWER_END, transitionToSewerBoss),
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

        if (world.type === WORLD_SEWER && world.time >= SEWER_DURATION && world.event !== 'bossPowerup') {
            return setEvent(state, 'bossPowerup');
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
        const enemyHitbox = getEnemyHitbox(state, enemy);
        if (enemyHitbox.top + enemyHitbox.height / 2 >= getHazardHeight(state)) {
            state = updateEnemy(state, enemy, {vx: (enemy.vx - 1.5) * 0.9, vy: enemy.vy * 0.85 - 1.2 });
        }
    }
    return state;
}

const sewerBackground1 = createAnimation('gfx/scene/sewer/sewer1.png', r(400, 500));
const sewerBackground2 = createAnimation('gfx/scene/sewer/sewer2.png', r(400, 500));
const waterAnimation = createAnimation('gfx/scene/sewer/50water.png', r(200, 100));
const waterTopRectangle = r(200, 15);
const waterTopAnimation = {
    frames: [
        {...waterTopRectangle, image: requireImage('gfx/scene/sewer/water1.png')},
        {...waterTopRectangle, image: requireImage('gfx/scene/sewer/water2.png')},
        {...waterTopRectangle, image: requireImage('gfx/scene/sewer/water3.png')},
        {...waterTopRectangle, image: requireImage('gfx/scene/sewer/water2.png')},
    ],
    frameDuration: 20,
}
const waterTopForegroundRectangle = {left: 0, top: 15, width: 200, height:15};
const waterTopForegroundAnimation = {
    frames: [
        {...waterTopForegroundRectangle, image: requireImage('gfx/scene/sewer/water1.png')},
        {...waterTopForegroundRectangle, image: requireImage('gfx/scene/sewer/water2.png')},
        {...waterTopForegroundRectangle, image: requireImage('gfx/scene/sewer/water3.png')},
        {...waterTopForegroundRectangle, image: requireImage('gfx/scene/sewer/water2.png')},
    ],
    frameDuration: 20,
}
function getSewerLayers () {
    return {
        background: getNewLayer({
            xFactor: 1, yFactor: 1, maxY: 0,
            spriteData: {
                sewer1: {animation: sewerBackground1, scale: 2, next: ['sewer1', 'sewer2']},
                sewer2: {animation: sewerBackground2, scale: 2, next: ['sewer1', 'sewer2']},
            },
        }),
        water: getNewLayer({
            xFactor: 1, yFactor: 1, yOffset: 60,
            spriteData: {
                water: {animation: waterAnimation, scale: 2, next: ['water']},
            },
        }),
        ground: getNewLayer({
            xFactor: 1, yFactor: 1, yOffset: -170,
            spriteData: {
                water: {animation: waterTopAnimation, scale: 2, vx: -3, next: ['water']},
            },
        }),
        foreground: getNewLayer({
            xFactor: 1, yFactor: 1, yOffset: -140,
            spriteData: {
                water: {animation: waterTopForegroundAnimation, scale: 2, vx: -4, next: ['water']},
            },
        }),
        // Background layers start at the top left corner of the screen.
        bgLayerNames: [],
        // Midground layers use the bottom of the HUD as the top of the screen,
        // which is consistent with all non background sprites, making hit detection simple.
        mgLayerNames: ['background', 'ground'],
        // Foreground works the same as Midground but is drawn on top of game sprites.
        fgLayerNames: ['water', 'foreground', 'heroShadow'],
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
        groundHeight: -1000,
        ...getSewerLayers(),
    };
}

const { updatePlayer, getHeroHitbox } = require('heroes');
const { spawnEnemy, enemyData, getEnemyHitbox, updateEnemy } = require('enemies');
const { transitionToSewerBoss } = require('areas/sewerBoss');
const { createAttack, addEnemyAttackToState, ATTACK_GAS, ATTACK_WATER } = require('attacks');

const ratGeometry = r(120, 120, {
    hitbox: {left: 50, top: 2, width: 25, height: 85}
});
const ratJumpGeometry = r(120, 120, {
    hitbox: {left: 35, top: 35, width: 75, height: 30}
});
enemyData[ENEMY_RAT] = {
    animation: createAnimation('gfx/enemies/rat.png', ratGeometry, {cols: 4, frameMap: [0, 1, 2, 3, 2, 1]}),
    pauseAnimation: createAnimation('gfx/enemies/rat.png', ratGeometry, {x: 3}),
    jumpAnimation: createAnimation('gfx/enemies/rat.png', ratJumpGeometry, {x: 5}),
    deathAnimation: createAnimation('gfx/enemies/rat.png', ratGeometry, {x: 4}),
    deathSound: 'squeek',
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.mode === 'pause') return this.pauseAnimation;
        if (enemy.mode === 'jump') return this.jumpAnimation;
        return this.animation;
    },
    accelerate(state, enemy) {
        const minTop = Math.max(-10, getHazardCeilingHeight(state) + 5);
        const maxTop = Math.min(GAME_HEIGHT + 10, getHazardHeight(state) - 5) * 0.6;
        if (enemy.mode === 'pause') {
            const heroHitbox = getHeroHitbox(state.players[0]);
            const enemyHitbox = getEnemyHitbox(state, enemy);
            const dx = (heroHitbox.left + heroHitbox.width / 2) - (enemyHitbox.left + enemyHitbox.width / 2);
            if (!enemy.passive && dx >= -100 && dx <= 100 && heroHitbox.top > enemyHitbox.top) {
                return { ...enemy,
                    vy: 3,
                    // Adding the player velocity makes them track the player much better,
                    // but if we use it exactly, it is a little too annoying, so just add half
                    // to make it easier to dodge.
                    vx: Math.max(-4, Math.min(4, dx / 25)) + state.players[0].sprite.vx / 2,
                    mode: 'jump', modeTime: 0, animationTime: 0,
                    hanging: false, grounded: true,
                };
            } else if (enemy.modeTime < 1000) {
                return { ...enemy, vy: enemy.vy * 0.5, modeTime: enemy.modeTime + FRAME_LENGTH };
            } else {
                return { ...enemy, mode: 'climb', modeTime: 0 };
            }
        } else if (enemy.mode === 'climb') {
            if (enemy.modeTime >= 600) {
                return { ...enemy, mode: 'pause', modeTime: 0 };
            } else if (enemy.direction === 'up') {
                if (enemy.top >= minTop) {
                    return { ...enemy, vy: -3, modeTime: enemy.modeTime + FRAME_LENGTH };
                } else {
                    return { ...enemy, mode: 'pause', modeTime: 0, direction: 'down' };
                }
            } else {
                if (enemy.top + enemy.height <= maxTop) {
                    return { ...enemy, vy: 3, modeTime: enemy.modeTime + FRAME_LENGTH };
                } else {
                    return { ...enemy, mode: 'pause', modeTime: 0, direction: 'up' };
                }
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
        // Can set to true to remove the jumping behavior.
        passive: false,
        direction: 'up',
    }
};
const stinkBugGeometry = r(30, 30);
enemyData[ENEMY_STINK_BUG] = {
    animation: createAnimation('gfx/enemies/stinkbugsheet.png', stinkBugGeometry, {cols: 3}),
    deathAnimation: createAnimation('gfx/enemies/stinkbugsheet.png', stinkBugGeometry, {x: 3}),
    deathSound: 'sfx/flydeath.mp3',
    onDeathEffect(state, enemy) {
        const enemyHitbox = getEnemyHitbox(state, enemy);
        const gas = createAttack(ATTACK_GAS, {
            left: enemyHitbox.left + enemyHitbox.width / 2,
            top: enemyHitbox.top + enemyHitbox.height / 2,
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

const archerFishGeometry = r(80, 80, {
    hitbox: {left: 7, top: 20, width: 70, height: 50},
});

enemyData[ENEMY_ARCHER_FISH] = {
    animation: createAnimation('gfx/enemies/archersheet.png', archerFishGeometry, {cols: 2}),
    attackAnimation: createAnimation('gfx/enemies/archersheet.png', archerFishGeometry, {x: 2}),
    deathAnimation: createAnimation('gfx/enemies/archersheet.png', archerFishGeometry, {y: 1}),
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.mode === 'attack') return this.attackAnimation;
        return this.animation;
    },
    updateState(state, enemy) {
        if (enemy.dead) return state;
        if (enemy.mode === 'rising') {
            const hitbox = getEnemyHitbox(state, enemy);
            const offset = (enemy.type === ENEMY_ARCHER_FISH_SOLDIER) ? 20 : 30;
            if (hitbox.top + offset > getHazardHeight(state)) {
                return updateEnemy(state, enemy, {vy: enemy.vy * .85 - 0.4});
            }
            return this.changeMode(state, enemy, 'pause');
        }
        if (enemy.mode === 'attack') {
            if (enemy.modeTime >= 400 && !(enemy.modeTime % 10) && (enemy.modeTime % 100 < 50)) {
                const hitbox = getEnemyHitbox(state, enemy);
                const water = createAttack(ATTACK_WATER, {
                    left: hitbox.left + hitbox.width / 2 + 36 * (enemy.flipped ? 1 : -1),
                    top: hitbox.top + 4,
                    vx: (enemy.flipped ? 1 : -2) * 5,
                    vy: -8,
                });
                water.left -= water.width / 2;
                water.top -= water.height / 2;
                state = updateEnemy(state, enemy, {left: enemy.left + (enemy.flipped ? -1 : 1), top: enemy.top + 1});
                state = addEnemyAttackToState(state, water);
                enemy = state.idMap[enemy.id];
            }
            if (enemy.modeTime === 800) {
                return this.changeMode(state, enemy, 'rising');
            }
            return updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH, vy: 0, vx: enemy.vx * 0.1});
        }
        if (enemy.mode === 'pause') {
            if (enemy.modeTime === 800) {
                return this.changeMode(state, enemy, 'attack');
            }
            const playerHitbox = getHeroHitbox(state.players[0]);
            const hitbox = getEnemyHitbox(state, enemy);
            const dx = (playerHitbox.left + playerHitbox.width / 2) - (hitbox.left + hitbox.width / 2);
            return updateEnemy(state, enemy, {
                modeTime: enemy.modeTime + FRAME_LENGTH,
                flipped: dx > 0,
                vy: 0,
                vx: (enemy.type === ENEMY_ARCHER_FISH_SOLDIER) ? (dx > 0 ? 1 : -2) : 0,
            });
        }
        return state;
    },
    changeMode(state, enemy, mode) {
        return updateEnemy(state, enemy, {mode, modeTime: 0, animationTime: 0});
    },
    props: {
        life: 5,
        score: 40,
        mode: 'rising',
        hanging: true,
        // Water doesn't kill the fish.
        hazardProof: true,
        doNotFlip: true,
    },
};

const archerFishSoldierGeometry = {
    ...archerFishGeometry,
    hitboxes: [
        archerFishGeometry.hitbox,
        {left: 23, top: 0, width: 20, height: 34},
    ]
}

// This just gives different animations for the fish soldier, the regular fish itself
// checks the type and has slightly different behavior for the soldier.
enemyData[ENEMY_ARCHER_FISH_SOLDIER] = {
    ...enemyData[ENEMY_ARCHER_FISH],
    animation: createAnimation('gfx/enemies/archersheet.png', archerFishSoldierGeometry, {y: 1, rows: 2, cols: 3, frameMap: [2, 3]}),
    attackAnimation: createAnimation('gfx/enemies/archersheet.png', archerFishSoldierGeometry, {y: 1, x: 1}),
    deathAnimation: createAnimation('gfx/enemies/archersheet.png', archerFishSoldierGeometry, {y: 1}),
};



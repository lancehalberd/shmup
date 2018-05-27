
const {
    TEST_ENEMY, FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ENEMY_FLY, ENEMY_MONK,
    ENEMY_HORNET, ENEMY_HORNET_SOLDIER,
    ENEMY_FLYING_ANT,
    ENEMY_LOCUST, ENEMY_LOCUST_SOLDIER,
    ENEMY_CARGO_BEETLE, ENEMY_EXPLOSIVE_BEETLE,
    ATTACK_BULLET,
} = require('gameConstants');
const random = require('random');
const { requireImage, createAnimation, r } = require('animations');
const { getNewSpriteState, getTargetVector } = require('sprites');
const { getGroundHeight, getNewLayer, allWorlds } = require('world');

const plainsBg = createAnimation('gfx/scene/plainsbg.png', r(800, 800));
const groundAnimation = createAnimation('gfx/scene/groundloop.png', r(200, 60));
const townAnimation = createAnimation('gfx/scene/town.png', r(300, 300));
const dandyHitBox = r(36, 36, {left: 7});
const dandyRectangle = r(80, 98, {hitBox: dandyHitBox});
const dandyAAnimation = createAnimation('gfx/scene/dandyidleabc.png', dandyRectangle, {cols: 2, duration: 30});
const dandyAPoofAnimation = createAnimation('gfx/scene/dandya.png', dandyRectangle, {cols: 6, duration: 8}, {loop: false});
const dandyBAnimation = createAnimation('gfx/scene/dandyidleabc.png', dandyRectangle, {x: 2, cols: 2, duration: 30});
const dandyBPoofAnimation = createAnimation('gfx/scene/dandyb.png', dandyRectangle, {cols: 6, duration: 8}, {loop: false});
const dandyCAnimation = createAnimation('gfx/scene/dandyidleabc.png', dandyRectangle, {x: 4, cols: 2, duration: 30});
const dandyCPoofAnimation = createAnimation('gfx/scene/dandyc.png', dandyRectangle, {cols: 6, duration: 8}, {loop: false});
const grassTuft = createAnimation('gfx/scene/tuft.png', r(92, 64), {cols: 3, duration: 20, frameMap:[0, 2, 1, 2]});
const grassAnimation = createAnimation('gfx/scene/plainsfg1.png', r(200, 100));
const grass2Animation = createAnimation('gfx/scene/plainsfg4.png', r(110, 51));
const grass3Animation = createAnimation('gfx/scene/plainsfg5.png', r(122, 52));
const smallCloverAnimation = createAnimation('gfx/scene/plainsfg6.png', r(69, 38));
const leavesAnimation = createAnimation('gfx/scene/plainsfg2.png', r(200, 100));
const berriesAnimation = createAnimation('gfx/scene/plainsfg3.png', r(200, 100));
const wheatAnimation = createAnimation('gfx/scene/plainsmg1.png', r(200, 100));
const thickGrass = createAnimation('gfx/scene/plainsmg.png', r(300, 300));
const darkGrass = createAnimation('gfx/scene/plainsmg2.png', r(300, 300));
// const lightGrass = createAnimation('gfx/scene/plainsmg3.png', r(300, 300));


const WORLD_FIELD = 'field';
const WORLD_FIELD_BOSS = 'fieldBoss';


const spawnEnemy = (state, enemyType, props) => {
    const newEnemy = createEnemy(enemyType, props);
    newEnemy.left = Math.max(newEnemy.left, WIDTH);
    newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
    newEnemy.vx = newEnemy.vx || -5;
    return addEnemyToState(state, newEnemy);
};


const formidableEnemies = [ENEMY_HORNET, ENEMY_LOCUST, ENEMY_HORNET_SOLDIER, ENEMY_LOCUST_SOLDIER, ENEMY_EXPLOSIVE_BEETLE];

const setEvent = (state, event) => {
    // FRAME_LENGTH will be added to eventTime before the event is processed next, so we
    // set it to -FRAME_LENGTH so it will be 0 on the first frame.
    return {...state, world: {...state.world, eventTime: -FRAME_LENGTH, event}};
};
const FIELD_DURATION = 120000;
const FIELD_EASY_DURATION = 30000;

allWorlds[WORLD_FIELD] = {
    initialEvent: 'nothing',
    events: {
        nothing: (state, eventTime) => {
            if (eventTime === 1000) {
                if (state.players[0].powerups.length) {
                    state = {...state, world: {...state.world, time: FIELD_DURATION / 2}};
                    return setEvent(state, 'flies');
                }
                return setEvent(state, 'easyFlies');
            }
        },
        easyFlies: (state, eventTime) => {
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * GAME_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * GAME_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * GAME_HEIGHT / 4;
                return spawnEnemy(state, ENEMY_FLY, {left: WIDTH, top});
            }
            eventTime -= 2000;
            if (eventTime >= 0) {
                return setEvent(state, 'powerup');
            }
        },
        powerup: (state, eventTime) => {
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_CARGO_BEETLE, {left: WIDTH, top: GAME_HEIGHT / 2});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, 'flies');
            }
        },
        flies: (state, eventTime) => {
            const numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            const baseNumber = 4 - numFormidable;
            let spacing = state.world.time < FIELD_EASY_DURATION ? 2000 : 1000;
            if (eventTime === 0) {
                let top = random.element([1,2, 3]) * GAME_HEIGHT / 4;
                for (let i = 0; i < baseNumber; i++) {
                    state = spawnEnemy(state, ENEMY_FLY, {left: WIDTH + i * 80, top});
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime === 0) {
                let top = random.element([1, 2, 3]) * GAME_HEIGHT / 4;
                for (let i = 0; i < baseNumber; i++) {
                    state = spawnEnemy(state, ENEMY_FLY, {left: WIDTH + i * 80, top});
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime === 0) {
                const mode = random.range(0, 1);
                for (let i = 0; i < 2 * baseNumber; i++) {
                    let top = [GAME_HEIGHT / 6 + i * 30, 5 * GAME_HEIGHT / 6 - i * 30][mode];
                    state = spawnEnemy(state, ENEMY_FLY, {left: WIDTH + i * 80, top });
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['flyingAnts', 'monks']));
            }
        },
        monks: (state, eventTime) => {
            let spacing = state.world.time < FIELD_EASY_DURATION ? 3000 : 1000;
            if (eventTime === 0) {
                let left = WIDTH;
                for (let i = 0; i < random.range(1, 2); i++) {
                    state = spawnEnemy(state, ENEMY_MONK, {left, top : GAME_HEIGHT});
                    left += random.range(100, 200);
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['flyingAnts']));
            }
        },
        flyingAnts: (state, eventTime) => {
            const numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            const baseNumber = 2 - numFormidable;
            let spacing = state.world.time < FIELD_EASY_DURATION ? 3000 : 1000;
            if (eventTime === 0) {
                for (let i = 0; i < baseNumber - 1; i++) {
                    state = spawnEnemy(state, ENEMY_FLYING_ANT, {left: WIDTH + 10 + Math.random() * 30, top: GAME_HEIGHT / 4 + i * GAME_HEIGHT / 2});
                }
                return state;
            }
            eventTime -= spacing
            if (eventTime === 0) {
                for (let i = 0; i < baseNumber; i++) {
                    const enemyType = random.element([ENEMY_FLYING_ANT]);
                    state = spawnEnemy(state, enemyType, {left: WIDTH + 10 + Math.random() * 30, top: GAME_HEIGHT / 4 + i * GAME_HEIGHT / 2});
                }
                return state;
            }
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['hornet', 'locust']));
            }
        },
        hornet: (state, eventTime) => {
            let numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            if (eventTime === 0 && numFormidable === 0) {
                const enemyType = (state.world.time >= 0.5 * FIELD_DURATION) ? ENEMY_HORNET_SOLDIER : ENEMY_HORNET;
                state = spawnEnemy(state, enemyType, {left: WIDTH + 10, top: random.element([GAME_HEIGHT / 4, 3 * GAME_HEIGHT / 4])});
                numFormidable++;
                return state;
            }
            let spacing = state.world.time < FIELD_EASY_DURATION ? 4000 : 2000;
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['flies', 'monks']));
            }
        },
        locust: (state, eventTime) => {
            let numFormidable = state.enemies.filter(enemy => formidableEnemies.includes(enemy.type)).length;
            if (eventTime === 0 && numFormidable <= 1) {
                const enemyType = (state.world.time >= 0.5 * FIELD_DURATION) ? ENEMY_LOCUST_SOLDIER : ENEMY_LOCUST;
                state = spawnEnemy(state, enemyType, {left: WIDTH + 10, top: GAME_HEIGHT / 4 + Math.random() * GAME_HEIGHT });
                numFormidable += 2;
                return state;
            }
            let spacing = state.world.time < FIELD_EASY_DURATION ? 2000 : 1000;
            eventTime -= spacing;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['locust', 'flies', 'monks']));
            }
        },
        bossPrep: (state) => {
            if (state.enemies.length === 0) {
                return transitionToFieldBoss(state);
            }
        },
    },
    advanceWorld: (state) => {
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 50 * 5;
        const targetX = world.x + 1000;
        let targetY = world.y;
        if (world.time % 60000 > 45000) targetY = world.y;
        else if (world.time % 60000 > 30000) targetY = 400;
        else if (world.time % 60000 > 15000) targetY = world.y;
        else targetY = -100;
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        // After 90 seconds, stop spawning enemies, and transition to the boss once all enemies are
        // defeated.
        if (world.type === WORLD_FIELD && world.time >= FIELD_DURATION && world.event !== 'bossPrep') {
            return setEvent(state, 'bossPrep');
        }
        if (TEST_ENEMY) {
            if (!state.enemies.length) {
                state = spawnEnemy(state, TEST_ENEMY, {left: WIDTH, top: random.range(100, 700)});
            }
            return state;
        }
        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;

        // This was the original random enemy spawning code for the game.
        /*
        let {enemyCooldown} = state;
        const spawnDuration = Math.min(2500, 100 + time / 20 + state.players[0].score / 10);
        if (enemyCooldown > 0) {
            enemyCooldown--;
        } else if (time % 5000 < spawnDuration - 800 * numFormidable) {
            let newEnemyType = ENEMY_FLY;
            if (time > 15000 && Math.random() < 1 / 6) {
                newEnemyType = ENEMY_FLYING_ANT_SOLDIER;
            } else if (time > 10000 && Math.random() < 1 / 3) {
                newEnemyType = ENEMY_FLYING_ANT;
            } else if (time > 20000 && Math.random() > Math.max(.9, 1 - .1 * state.players[0].score / 3000)) {
                newEnemyType = random.element(formidableEnemies);
            } else if (getGroundHeight(state) < GAME_HEIGHT && Math.random() < 1 / 10) {
                newEnemyType = ENEMY_MONK;
            }
            const newEnemy = createEnemy(newEnemyType, {
                left: WIDTH + 10,
                top: 40 + (GAME_HEIGHT - 80) * (0.5 + 0.5 * Math.sin(time / (1000 - spawnDuration / 5))),
            });
            newEnemy.vx = newEnemy.vx || -6 + 3 * (time % 5000) / spawnDuration;
            newEnemy.top = newEnemy.grounded ? getGroundHeight(state) - newEnemy.height : newEnemy.top - newEnemy.height / 2;
            state = addEnemyToState(state, newEnemy);
            switch (newEnemy.type) {
                case ENEMY_HORNET:
                    enemyCooldown = 3 * ENEMY_COOLDOWN;
                    break;
                case ENEMY_FLYING_ANT_SOLDIER:
                    enemyCooldown = 2 * ENEMY_COOLDOWN;
                    break;
                default:
                    enemyCooldown = ENEMY_COOLDOWN;
                    break;
            }
        }
        return {...state, enemyCooldown};
        */

    },
};
const layerNamesToClear = ['wheat', 'darkGrass', 'thickGrass', 'nearground', 'foreground'];
const treeFortAnimation = createAnimation('gfx/enemies/plainsboss/plainsbossbase.png', r(800, 600));
const forestEdgeAnimation = createAnimation('gfx/enemies/plainsboss/forestbeginbase.png', r(800, 600));


allWorlds[WORLD_FIELD_BOSS] = {
    advanceWorld: (state) => {
        let world = state.world;
        if (world.time < 500 &&
            (['nearground','foreground'].some(layerName => world[layerName].sprites.length) ||
                world.y > 0)
        ) {
            world = {
                ...world,
                targetFrames: 50 * 5 / 2,
                targetX: world.x + 1000,
                time: 0,
            }
        }
        const time = world.time + FRAME_LENGTH;
        if (time === 500) {
            world.nearground.sprites = [
                getNewSpriteState({
                    ...forestEdgeAnimation.frames[0],
                    top: -36,
                    left: 2 * WIDTH,
                    animation: forestEdgeAnimation,
                }),
                getNewSpriteState({
                    ...treeFortAnimation.frames[0],
                    top: -36,
                    left: 2 * WIDTH,
                    animation: treeFortAnimation,
                }),
            ];
            /*world.thickGrass.sprites = [
                getNewSpriteState({
                    ...forestEdgeAnimation.frames[0],
                    top: -36,
                    left: 2 * WIDTH,
                    animation: forestEdgeAnimation,
                })
            ];*/
            world.targetFrames = 400 / 2;
            world.targetX = world.x +  2 * WIDTH;
            world.bgm = 'bgm/boss.mp3';
            state = {...state, bgm: world.bgm};
        }
        if (world.targetFrames < 50) {
            world.targetFrames += .6;
        }
        if (time === 2500) {
            const treeSprite = world.nearground.sprites[0];
            let newEnemy = createEnemy(ENEMY_DOOR, {
                left: treeSprite.left + 638,
                top: treeSprite.top + 270,
            });
            state = addEnemyToState(state, newEnemy);
            newEnemy = createEnemy(ENEMY_LARGE_TURRET, {
                left: treeSprite.left + treeSprite.width - 90,
                top: treeSprite.top + 70,
            });
            newEnemy.left -= newEnemy.width / 2;
            newEnemy.top -= newEnemy.height / 2;
            state = addEnemyToState(state, newEnemy);
            const smallTurrets = [
                [-125, 110], [-35, 130], [-130, 160],
                [-40, 200], [-125, 240], [-35, 245],
            ];
            for (const coords of smallTurrets) {
                newEnemy = createEnemy(ENEMY_SMALL_TURRET, {
                    left: treeSprite.left + treeSprite.width + coords[0],
                    top: treeSprite.top + coords[1],
                });
                newEnemy.left -= newEnemy.width / 2;
                newEnemy.top -= newEnemy.height / 2;
                state = addEnemyToState(state, newEnemy);
            }
        }
        const turrets = state.enemies.filter(enemy => enemy.type === ENEMY_SMALL_TURRET);
        if (time > 2500) {
            if (state.enemies.filter(enemy => enemy.type === ENEMY_LARGE_TURRET).length === 0) {
                return enterStarWorldEnd(state);
            }
            if (state.enemies.filter(enemy => enemy.type === ENEMY_DOOR).length === 0) {
                return enterStarWorldEnd(state);
            }
            const minMonkTime = 4000 + 1000 * turrets.length;
            if (turrets.length <= 4 && time - (world.lastMonkTime || 0) >= minMonkTime && Math.random() > 0.9) {
                const treeSprite = world.nearground.sprites[0];
                const newEnemy = createEnemy(ENEMY_GROUND_MONK, {
                    left: treeSprite.left + treeSprite.width - 270,
                    top: treeSprite.top + treeSprite.height - 36,
                    // Normally monks walk slowly left to right to keep up with scrolling,
                    // but when the screen is still, the need to walk right to left to
                    // approach the player.
                    speed: -2,
                });
                newEnemy.left -= newEnemy.width / 2;
                newEnemy.top -= newEnemy.height / 2;
                state = addEnemyToState(state, newEnemy);
                world = {...world, lastMonkTime: time};
            }
            const minStickTime = 3000 + 1000 * turrets.length;
            if (time - (world.lastStickTime || 0) >= minStickTime && Math.random() > 0.9) {
                const treeSprite = world.nearground.sprites[0];
                const spawnX = Math.random() * 400 + treeSprite.left + 50;

                // Add a dust cloud to signify something happened when the enemy hit the ground.
                let leaf = createEffect(EFFECT_LEAF, {top: Math.random() * -30, left: spawnX - 20 - Math.random() * 40, vy: -2 + Math.random() * 4});
                leaf.left -= leaf.width / 2;
                state = addEffectToState(state, leaf);
                leaf = createEffect(EFFECT_LEAF, {top: Math.random() * -30, left: spawnX -20 + Math.random() * 40, animationTime: 500, vy: -2 + Math.random() * 4});
                leaf.left -= leaf.width / 2;
                state = addEffectToState(state, leaf);

                let stick = createEnemy(random.element([ENEMY_STICK_1, ENEMY_STICK_2, ENEMY_STICK_3]), {
                    left: spawnX,
                    top: -100,
                    vy: 0,
                    delay: 10,
                });
                stick.left -= stick.width / 2;
                state = addEnemyToState(state, stick);
                world = {...world, lastStickTime: time};
            }
        }
        world = {...world, time};
        state = {...state, world};
        return state;
    },
};

const getFieldWorld = () => ({
    type: WORLD_FIELD,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 1000,
    targetY: 0,
    targetFrames: 50 * 10,
    time: 0,
    bgm: 'bgm/river.mp3',
    groundHeight: 30,
    ...getFieldLayers(),
});

const getFieldLayers = () => ({
    background: getNewLayer({
        xFactor: 0, yFactor: 0.2, yOffset: -100, maxY: 0,
        animation: plainsBg,
    }),
    wheat: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -50,
        spriteData: {
            wheatBunch: {animation: wheatAnimation, scale: 4, next: ['wheatCouple'], offset: [-140, -120]},
            wheatCouple: {animation: wheatAnimation, scale: 5, next: ['wheat'], offset: [-100, -80]},
            wheat: {animation: wheatAnimation, scale: 4, next: ['wheatBunch'], offset: [-40, 400]},
        },
    }),
    darkGrass: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -50,
        spriteData: {
            darkGrass: {animation: darkGrass, scale: 1.75, next: ['darkGrass'], offset: [-40, -20]},
        },
    }),
    thickGrass: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: -30,
        spriteData: {
            thickGrass: {animation: thickGrass, scale: 1.75, next: ['thickGrass'], offset: [-40, -20]},
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 0.5, yOffset: 0,
        spriteData: {
            ground: {animation: groundAnimation, scale: 1, next: ['ground'], offset: 0},
        },
    }),
    nearground: {...getNewLayer({
            xFactor: 1, yFactor: 0.5, yOffset: -40,
            spriteData: {
                dandyBunch: {animation: dandyAAnimation, onHit: onHitDandy, scale: 2, next: ['dandyB', 'dandyC', 'dandyPair'], offset: [-40, -35], yOffset: [-8, -5]},
                dandyPair: {animation: dandyBAnimation, onHit: onHitDandy, scale: 2, next: ['dandyC'], offset: [-50, -45], yOffset: [0, 2]},
                dandyA: {animation: dandyAAnimation, onHit: onHitDandy, scale: 2, next: ['dandyB', 'dandyC', 'leaves', 'grassOrBerries'], offset: 80},
                dandyB: {animation: dandyBAnimation, onHit: onHitDandy, scale: 2, next: ['leaves'], offset: -20, yOffset: [-3, 1]},
                dandyC: {animation: dandyCAnimation, onHit: onHitDandy, scale: 2, next: ['dandyA', 'leaves', 'grassOrBerries'], offset: 100, yOffset: [3, 5]},
                leaves: {animation: [leavesAnimation, smallCloverAnimation], scale: 2, next: ['dandyA', 'dandyBunch', 'leaves', 'grassOrBerries'], offset: -20},
                grassOrBerries: {animation: [grassAnimation, grass2Animation, grass3Animation, berriesAnimation], scale: 2, next: ['grassOrBerries', 'dandyB', 'dandyPair', 'leaves'], offset: 0},
            },
        }),
    },
    foreground: getNewLayer({
        xFactor: 1, yFactor: 0.5, yOffset: -5,
        spriteData: {
            grass: {animation: grassTuft, scale: 1.5, next: ['grass'], offset: [-10, 400, 550, 610]},
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: ['background',],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['wheat', 'darkGrass', 'thickGrass', 'ground', 'nearground'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: ['foreground'],
});

const getFieldWorldStart = () => {
    let world = getFieldWorld();
    world.nearground.sprites = [getNewSpriteState({
        ...townAnimation.frames[0],
        top: 263,
        left: 0,
        offset: 50,
        animation: townAnimation,
        next: ['grassOrBerries'],
    })];
    return world;
};

const transitionToFieldBoss = (state) => {
    const updatedWorld = {
        ...state.world,
        type: WORLD_FIELD_BOSS,
        time: 0,
        targetFrames: 50 * 5,
        targetY: -100,
    };
    for (const layerName of layerNamesToClear) {
        const sprites = updatedWorld[layerName].sprites.filter(sprite => sprite.left < WIDTH);
        updatedWorld[layerName] = {...updatedWorld[layerName], spriteData: false, sprites};
    }

    return {...state, world: updatedWorld};
}

const onHitDandy = (state, layerName, spriteIndex) => {
    let world = state.world;
    let layer = world[layerName];
    let sprites = [...layer.sprites];
    const sprite = sprites[spriteIndex];
    let newAnimation = dandyAPoofAnimation;
    if (sprite.animation === dandyBAnimation) {
        newAnimation = dandyBPoofAnimation;
    } else if (sprite.animation === dandyCAnimation) {
        newAnimation = dandyCPoofAnimation;
    }
    sprites[spriteIndex] = {...sprite, animation: newAnimation, onHit: null, animationTime: FRAME_LENGTH * newAnimation.frameDuration};
    layer = {...layer, sprites};
    world = {...world, [layerName]: layer};
    return {...state, world};
};

module.exports = {
    getFieldWorld, getFieldWorldStart,
};

const { enemyData, createEnemy, addEnemyToState, updateEnemy } = require('enemies');

const smallTurretRectangle = r(41, 41);
const ENEMY_SMALL_TURRET = 'smallTurret';
enemyData[ENEMY_SMALL_TURRET] = {
    animation: createAnimation('gfx/enemies/plainsboss/sweetspot.png', smallTurretRectangle),
    deathAnimation: createAnimation('gfx/enemies/plainsboss/sweetspot4.png', smallTurretRectangle),
    attackAnimation: {
        frames: [
            {...smallTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspot2.png')},
            {...smallTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspot3.png')},
            {...smallTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspot2.png')},
        ],
        frameDuration: 12,
    },
    deathSound: 'sfx/robedeath1.mp3',
    isInvulnerable(state, enemyIndex) {
        const enemy = state.enemies[enemyIndex];
        return !(enemy.attackCooldownFramesLeft > 0);
    },
    shoot(state, enemyIndex) {
        let enemy = {...state.enemies[enemyIndex]};
        if (enemy.left > WIDTH + 10) return state;
        // This is pretty ad hoc, but this code delays creating the bullet until the second
        // frame of the attack animation, since the first frame is a preparation frame.
        if (enemy.attackCooldownFramesLeft === Math.floor(enemy.attackCooldownFrames / 2)) {
            let target = state.players[0].sprite;
            target = {...target, left: target.left + state.world.vx * 40};
            let {dx, dy} = getTargetVector(enemy, target);
            if (!dx && !dy) dx = -1;
            const mag = Math.sqrt(dx * dx + dy * dy);
            const bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left,
                top: enemy.top + enemy.height / 2,
                vx: enemy.bulletSpeed * dx / mag,
                vy: enemy.bulletSpeed * dy / mag,
            });
            bullet.left -= bullet.width / 2;
            bullet.top -= bullet.height / 2;
            state = addEnemyAttackToState(state, bullet);
        }
        let shotCooldown = enemy.shotCooldown;
        if (shotCooldown === undefined) {
            shotCooldown = random.element(enemy.shotCooldownFrames);
        }
        if (shotCooldown > 0) {
            return updateEnemy(state, enemyIndex, {shotCooldown: shotCooldown - 1});
        }
        shotCooldown = random.element(enemy.shotCooldownFrames);
        return updateEnemy(state, enemyIndex, {shotCooldown, animationTime: 0, attackCooldownFramesLeft: enemy.attackCooldownFrames});
    },
    onDeathEffect(state, enemyIndex) {
        return updateEnemy(state, enemyIndex, {ttl: 600});
    },
    props: {
        life: 6,
        score: 200,
        stationary: true,
        bulletSpeed: 5,
        attackCooldownFrames: 36,
        shotCooldownFrames: [80, 120],
    },
};

const largeTurretRectangle = r(41, 41);
const ENEMY_LARGE_TURRET = 'largeTurret';
enemyData[ENEMY_LARGE_TURRET] = {
    animation: createAnimation('gfx/enemies/plainsboss/sweetspotlarge1.png', largeTurretRectangle),
    deathAnimation: createAnimation('gfx/enemies/plainsboss/sweetspotlarge4.png', largeTurretRectangle),
    attackAnimation: {
        frames: [
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge2.png')},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png')},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png')},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png')},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png')},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png')},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge3.png')},
            {...largeTurretRectangle, image: requireImage('gfx/enemies/plainsboss/sweetspotlarge2.png')},
        ],
        frameDuration: 12,
    },
    deathSound: 'sfx/robedeath1.mp3',
    isInvulnerable(state, enemyIndex) {
        const enemy = state.enemies[enemyIndex];
        return !(enemy.attackCooldownFramesLeft > 0);
    },
    shoot(state, enemyIndex) {
        let enemy = {...state.enemies[enemyIndex]};
        // Don't open up until 2 or fewer turrets are left.
        if (state.enemies.filter(enemy => enemy.type === ENEMY_SMALL_TURRET).length > 2) return state;
        // This turret shoots four different times during its attack animation.
        if (enemy.attackCooldownFramesLeft === 54 || enemy.attackCooldownFramesLeft === 36) {
            let target = state.players[0].sprite;
            // First shot is slower and potentially off target.
            target = {...target, left: target.left + 40 - Math.random() * 80};
            let {dx, dy} = getTargetVector(enemy, target);
            if (!dx && !dy) dx = -1;
            const mag = Math.sqrt(dx * dx + dy * dy);
            const bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left + 10,
                top: enemy.top + enemy.height,
                vx: enemy.bulletSpeed * dx / mag,
                vy: enemy.bulletSpeed * dy / mag,
            });
            bullet.left -= bullet.width / 2;
            bullet.top -= bullet.height / 2;
            state = addEnemyAttackToState(state, bullet);
        } else if (enemy.attackCooldownFramesLeft === 18 || enemy.attackCooldownFramesLeft === 72) {
            let target = state.players[0].sprite;
            let {dx, dy} = getTargetVector(enemy, target);
            if (!dx && !dy) dx = -1;
            const mag = Math.sqrt(dx * dx + dy * dy);
            const bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left + 10,
                top: enemy.top + enemy.height,
                vx: 1.5 * enemy.bulletSpeed * dx / mag,
                vy: 1.5 * enemy.bulletSpeed * dy / mag,
            });
            bullet.left -= bullet.width / 2;
            bullet.top -= bullet.height / 2;
            state = addEnemyAttackToState(state, bullet);
        }
        let shotCooldown = enemy.shotCooldown;
        if (shotCooldown === undefined) {
            shotCooldown = random.element(enemy.shotCooldownFrames);
        }
        if (shotCooldown > 0) {
            return updateEnemy(state, enemyIndex, {shotCooldown: shotCooldown - 1});
        }
        shotCooldown = random.element(enemy.shotCooldownFrames);
        return updateEnemy(state, enemyIndex, {shotCooldown, animationTime: 0, attackCooldownFramesLeft: enemy.attackCooldownFrames});
    },
    onDeathEffect(state, enemyIndex) {
        return updateEnemy(state, enemyIndex, {ttl: 1000});
    },
    props: {
        life: 30,
        score: 1000,
        stationary: true,
        bulletSpeed: 6,
        attackCooldownFrames: 96,
        shotCooldownFrames: [120, 160],
    },
};
const ENEMY_GROUND_MONK = 'groundMonk';
enemyData[ENEMY_GROUND_MONK] = {
    ...enemyData[ENEMY_MONK],
    spawnAnimation: createAnimation('gfx/enemies/robesclimb.png', r(49, 31), {duration: 120}),
    props: {
        ...enemyData[ENEMY_MONK].props,
        life: 2,
    },
};
const ENEMY_DOOR = 'door';
const doorRectangle = r(129, 275, {hitBox: {left: 22, top: 23, width: 96, height: 243}});
enemyData[ENEMY_DOOR] = {
    animation: {
        frames: [
            {...doorRectangle, image: requireImage('gfx/enemies/plainsboss/door1.png')},
            {...doorRectangle, image: requireImage('gfx/enemies/plainsboss/door2.png')},
            {...doorRectangle, image: requireImage('gfx/enemies/plainsboss/door3.png')},
        ],
        frameDuration: 12,
    },
    deathAnimation: createAnimation('gfx/enemies/plainsboss/door3.png', doorRectangle),
    accelerate(state, enemy) {
        if (enemy.life > 2 * enemy.maxLife / 3) return {...enemy, animationTime: 0};
        if (enemy.life > enemy.maxLife / 3) return {...enemy, animationTime: FRAME_LENGTH * 12};
        return {...enemy, animationTime: 2 * FRAME_LENGTH * 12};
    },
    onDeathEffect(state, enemyIndex) {
        return updateEnemy(state, enemyIndex, {stationary: false});
    },
    onDamageEffect(state, enemyIndex) {
        if (state.enemies[enemyIndex].life % 3) return state;
        for (let i = 0; i < 2; i++) {
            const effect = createEffect(EFFECT_DOOR_DAMAGE, {
                top: state.enemies[enemyIndex].top + 20 + 120 * i + Math.random() * 40,
                left: state.enemies[enemyIndex].left + 20 + Math.random() * 90,
            });
            effect.top -= effect.height / 2;
            effect.left -= effect.width / 2;
            state = addEffectToState(state, effect);
        }
        return state;
    },
    props: {
        maxLife: 300,
        life: 300,
        score: 500,
        stationary: true,
    },
};
const ENEMY_STICK_1 = 'stick1';
const ENEMY_STICK_2 = 'stick2';
const ENEMY_STICK_3 = 'stick3';
enemyData[ENEMY_STICK_1] = {
    animation: createAnimation('gfx/enemies/plainsboss/branch1.png', r(80, 40)),
    deathAnimation: createAnimation('gfx/enemies/plainsboss/branch4.png', r(80, 40)),
    accelerate: (state, enemy) => {
        if (enemy.top + enemy.height >= getGroundHeight(state)) {
            return {...enemy, dead: true, vx: 3+ Math.random() * 3, vy: -4};
        }
        return {...enemy, vy: enemy.vy + .6};
    },
    props: {
        life: 1,
        score: 0,
    },
};
enemyData[ENEMY_STICK_2] = {
    ...enemyData[ENEMY_STICK_1],
    animation: createAnimation('gfx/enemies/plainsboss/branch2.png', r(80, 40)),
};
enemyData[ENEMY_STICK_3] = {
    ...enemyData[ENEMY_STICK_1],
    animation: createAnimation('gfx/enemies/plainsboss/branch3.png', r(113, 24)),
};

const { enterStarWorldEnd } = require('areas/stars');

const { createAttack, addEnemyAttackToState } = require('attacks');

const { createEffect, effects, addEffectToState, updateEffect } = require('effects');
const EFFECT_LEAF = 'leaf';
effects[EFFECT_LEAF] = {
    animation: createAnimation('gfx/enemies/plainsboss/leaf.png', {...r(40, 37), hitBox: r(30, 37)}),
    advanceEffect: (state, effectIndex) => {
        const effect = state.effects[effectIndex];
        /*if (effect.vy > 20) {
            return updateEffect(state, effectIndex, {xScale: -(effect.xScale || 1), vx: -effect.vx, vy: -2});
        }*/
        const xFactor = Math.cos(effect.animationTime / 100);
        const yFactor = Math.sin(effect.animationTime / 100);
        return updateEffect(state, effectIndex, {
            vy: effect.vy + 1.5 - 2 * yFactor * yFactor,
            vx: 5 * xFactor * Math.abs(xFactor),
            xScale: (xFactor > 0) ? 1 : - 1
        });
    },
    props: {
        relativeToGround: true,
        loops: 20,
        vy: 1,
        vx: 0
    },
};
const EFFECT_DOOR_DAMAGE = 'doorDamage';
effects[EFFECT_DOOR_DAMAGE] = {
    animation: createAnimation('gfx/enemies/plainsboss/doorhurt.png', r(103,153), {duration: 20}),
    advanceEffect: (state, effectIndex) => {
        const effect = state.effects[effectIndex];
        return updateEffect(state, effectIndex, {
            vy: effect.vy + 0.5,
            xScale: (effect.xScale * 4 + 1) / 5,
            yScale: (effect.yScale * 4 + 1) / 5,
        });
    },
    props: {
        relativeToGround: true,
        xScale: .1,
        yScale: .1,
    },
};



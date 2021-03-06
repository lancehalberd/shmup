const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ENEMY_FLYING_ANT,
    ENEMY_LOCUST_SOLDIER,
} = require('gameConstants');
const random = require('random');
const { createAnimation, r } = require('animations');
const { getNewLayer, allWorlds, checkpoints, setCheckpoint, setEvent } = require('world');

const WORLD_CITY = 'city';
const CHECK_POINT_CITY_START = 'cityStart';
const CHECK_POINT_CITY_MIDDLE = 'cityMiddle';
const CHECK_POINT_CITY_MIDDLE_TIME = 40000;
const CHECK_POINT_CITY_TRANSITION = 'cityTransition'
const ENEMY_COCKROACH = 'cockroach';
const ENEMY_COCKROACH_SOLDIER = 'cockroachSoldier';

const CITY_DURATION = 90000;
const CITY_EASY_DURATION = 30000;

module.exports = {
    CHECK_POINT_CITY_START,
    WORLD_CITY,
    ENEMY_COCKROACH, ENEMY_COCKROACH_SOLDIER,
    getCityWorld,
};

const { spawnEnemy, createEnemy, addEnemyToState, updateEnemy, enemyData, removeEnemy,
    onHitGroundEffect_spawnMonk, getEnemyDrawBox,
    shoot_bulletAtPlayer,
    ENEMY_FLEA,
} = require('enemies');
const { transitionToRestaurant } = require('areas/cityToRestaurant');
const { enterStarWorld } = require('areas/stars');
const { CHECK_POINT_STARS_3 } = require('areas/stars3');
const { LOOT_NECKLACE } = require('loot');

checkpoints[CHECK_POINT_CITY_START] = function (state) {
    const world = getCityWorld();
    return {...state, world};
};
checkpoints[CHECK_POINT_CITY_MIDDLE] = function (state) {
    const world = getCityWorld();
    // This is 1/3 of the way through the stage.
    world.time = CHECK_POINT_CITY_MIDDLE_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_CITY_TRANSITION] = function (state) {
    const world = getCityWorld();
    world.time = CITY_DURATION - 5000;
    world.y = 0;
    return {...state, world};
};


const {
    nothing,
    easyRoaches,
    powerup,
    normalRoaches,
    lightningBeetle,
} = require('enemyPatterns');
allWorlds[WORLD_CITY] = {
    initialEvent: 'nothing',
    isPortalAvailable(state) {
        return !state.players[0].relics[LOOT_NECKLACE];
    },
    enterStarWorld(state) {
        return enterStarWorld(state, CHECK_POINT_STARS_3, CHECK_POINT_CITY_MIDDLE);
    },
    events: {
        nothing: nothing(1000, 'easyRoaches'),
        easyRoaches: easyRoaches('powerup'),
        powerup: powerup('cockroaches'),
        cockroaches: normalRoaches(CITY_EASY_DURATION, ['fleas', 'lightningBeetle']),
        locust: (state, eventTime) => {
            if (eventTime === 0) {
                state = spawnEnemy(state, ENEMY_LOCUST_SOLDIER, {left: WIDTH, top: random.range(GAME_HEIGHT / 3, 2 * GAME_HEIGHT / 3) });
                return state;
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['cockroaches', 'lightningBeetle']));
            }
        },
        flyingAnts(state, eventTime) {
            if (eventTime === 0) {
                const top = random.range(0, GAME_HEIGHT);
                state = spawnEnemy(state, ENEMY_FLYING_ANT, {left: WIDTH, top});
                state = spawnEnemy(state, ENEMY_FLYING_ANT, {left: WIDTH, top, delay: 50});
                return spawnEnemy(state, ENEMY_FLYING_ANT, {left: WIDTH, top, delay: 100});
            }
            eventTime -= 5000;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['locust', 'lightningBeetle']));
            }
        },
        fleas(state, eventTime) {
            if (state.world.y > 300) {
                return setEvent(state, 'flyingAnts');
            }
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_FLEA, {left: WIDTH});
            }
            eventTime -= 500;
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_FLEA, {left: WIDTH});
            }
            eventTime -= 500;
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_FLEA, {left: WIDTH});
            }
            eventTime -= 1000;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['cat', 'locust']));
            }
        },
        cat: (state, eventTime) => {
            if (state.world.y > 300) {
                return setEvent(state, random.element(['flyingAnts']));
            }
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_TRASH_CAT, {left: WIDTH});
            }
            eventTime -= 3000;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['lightningBeetle', 'cockroaches']));
            }
        },
        lightningBeetle: lightningBeetle(['cockroaches', 'fleas']),
        transitionPrep: (state, eventTime) => {
            if (eventTime > 3000 && state.enemies.length === 0 && state.loot.length === 0) {
                return transitionToRestaurant(state);
            }
        },
    },
    advanceWorld: (state) => {
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 100 * 5;
        const targetX = Math.max(world.targetX, world.x + 1000);
        let targetY = world.targetY;
        if (world.time < 35000) {
            targetY = world.targetY;
        } else if (world.time < CITY_DURATION - 5000) {
            targetY = 0;//world.y;
        } else {
            targetY = 200;
        }
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        if (world.type === WORLD_CITY && world.time >= CITY_DURATION && world.event !== 'transitionPrep') {
            return setEvent(state, 'transitionPrep');
        }
        if (world.time === CHECK_POINT_CITY_MIDDLE_TIME) {
            state = setCheckpoint(state, CHECK_POINT_CITY_MIDDLE);
        }

        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};

function getCityWorld() {
    return {
        type: WORLD_CITY,
        x: 0,
        y: 500,
        vx: 0,
        vy: 0,
        targetX: 1000,
        targetY: 500,
        targetFrames: 50 * 10,
        time: 0,
        bgm: 'city',
        groundHeight: 30,
        ...getCityLayers(),
    };
}
const skyLoop = createAnimation('gfx/scene/city/3bcityskybox.png', r(400, 300));
const sunset = createAnimation('gfx/scene/city/sunsettransition.png', r(400, 300));
const groundLoop = createAnimation('gfx/scene/city/3bgroundloop.png', r(200, 60));
const cityScapeLoop = createAnimation('gfx/scene/city/cityscape.png', r(460, 300));
const alleyLoop = createAnimation('gfx/scene/city/alley.png', r(320, 600));

const dumpsterAnimation = createAnimation('gfx/scene/city/dumpster.png', r(200, 150));
const litterAnimation = createAnimation('gfx/scene/city/trash1.png', r(100, 100));
const trashbagAnimation = createAnimation('gfx/scene/city/trash2.png', r(100, 100));

/*
I also made the new window, both for entering the restaurant and for the base of the spider boss.
The window entering the restaurant has lines that are where different light bulbs go.
I also made strings to appear in the alley with little lightning sparks to animate over the broken bulbs over and over,
harming anything it is near. I am unsure if we should make the bulbs destroyable, as if the Knight has that power,
they may accidentally kill themselves a lot.
Anyway, the point of the bulbs around the window is to funnel the Knight into the open area,
and not too high as to clip through the wall.

Part way through, they travel down to ground floor and see a window - entering the window transitions them into the restaurant.
In the restaurant, occasionally there can be ground as well (the table).
I am unsure how you want to have it if a robes falls on the table but then reaches the end of the table - do they then fall off?
Do they stop? Alternatively, we can treat the groundloop as a "bar" and never have it end with only minor alterations to the sprite.

*/
function getCityLayers() {
    return {
    background: getNewLayer({
        xFactor: 0.05, yFactor: 0.01, yOffset: 0, maxY: 0,
        spriteData: {
            sky: {animation: skyLoop, scale: 2, next: ['sky']},
        },
    }),
    sunset: getNewLayer({
        xFactor: 0.05, yFactor: 0.01, yOffset: 0, unique: true,
        spriteData: {
            sunset: {
                animation: sunset, scale: 2, vy: -0.5,
                accelerate(state, layerName, spriteIndex) {
                    let world = state.world;
                    let layer = world[layerName];
                    let sprites = [...layer.sprites];
                    const sprite = sprites[spriteIndex];
                    const left = 0;//-state.world.time / 200;
                    const top = state.world.time / 100;
                    sprites[spriteIndex] = {...sprite, left, top};
                    layer = {...layer, sprites};
                    world = {...world, [layerName]: layer};
                    return {...state, world};
                },
            },
        },
    }),
    cityScape: getNewLayer({
        xFactor: 0.2, yFactor: 0.5, yOffset: -300,
        spriteData: {
            cityScape: { animation: cityScapeLoop, scale: 2, next: ['cityScape'], offset: 0 },
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: 0,
        spriteData: {
            pavement: { animation: groundLoop, next: ['pavement'], offset: 0},
        },
    }),
    wall: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -54,
        spriteData: {
            wall: { animation: alleyLoop, next: ['wall'], offset: 0},
        },
    }),
    dumpster: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -48,
        spriteData: {
            dumpster: { animation: dumpsterAnimation, scale: 2, next: ['trash'], offset: [-200, -50, 100] },
            trash: { animation: [trashbagAnimation, litterAnimation], scale: 2, next: ['trash', 'trash', 'lastTrash'], offset: [20, 80, 120], yOffset: [3, 5] },
            lastTrash: { animation: [trashbagAnimation, litterAnimation], scale: 2, next: ['dumpster'], offset: [150, 200], yOffset: [3, 5] },
        },
    }),
    forestEdge: getNewLayer({
        xFactor: 1, yFactor: 1, maxY: 0,
        spriteData: {},
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['background', 'sunset', 'cityScape', 'ground', 'wall', 'dumpster', 'forestEdge'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: [],
    };
}

/*
Here are the new enemies for 3B.
I imagine 3B will have a lot of previous enemies - flies in strange swarms and other normal flying ant mobs.
Unique enemies are cockroaches - who can be programmed with really erratic fast behavior moving diagonally back and forth.
There are also fleas, who are super small, but they only appear when close to the ground or restaurant tables.

I am unsure if fleas should kill the Knight outright, or have an effect where they just attach to the Knight and
can only be knocked off by slashing. Perhaps also they are immune to ranged attacks.

When attached to the Knight, she can move slower and slower, or even lose height, s
imilar to the Mario 3 flowers dropped by Goombas. Otherwise, they can just be normal jumping enemies.

Lastly is the trash cat (drawn at 1/2 scale, or even 1/3 scale, if it doesn't look large enough).
The trash cat is immune to any attacks, and only appears in the alley ground.
I don't imagine there will be too many of these cats, and they will pop out and slash when the knight gets close.
*/
const ENEMY_TRASH_CAT = 'trashCat';
const trashCatGeometry = {
    ...r(80, 100),
    hitboxes: [],
    scaleX: 2, scaleY: 2,
};
const swipeAnimation = createAnimation('gfx/enemies/trashcat.png', trashCatGeometry,
    {cols: 3, x: 3, frameMap: [0, 1, 2, 2, 2, 0]}
);
swipeAnimation.frames[1].damageBoxes = [{left: 10, top: 10, width: 60, height: 60}];
enemyData[ENEMY_TRASH_CAT] = {
    animation: createAnimation('gfx/enemies/trashcat.png', trashCatGeometry,
        {cols: 2, frameMap: [0, 0, 0, 0, 1, 1, 1], duration: 12}
    ),
    peekAnimation: createAnimation('gfx/enemies/trashcat.png', trashCatGeometry,
        {cols: 1, x: 2}
    ),
    swipeAnimation,
    getAnimation(state, enemy) {
        if (enemy.mode === 'swipe') return this.swipeAnimation;
        if (enemy.mode === 'peek') return this.peekAnimation;
        return this.animation;
    },
    updateState(state, enemy) {
        let { mode, modeTime, animationTime } = enemy;
        if (mode === 'normal') {
            if (modeTime + Math.random() * 3000 > 4000) {
                mode = 'peek';
                modeTime = animationTime = 0;
                state = {...state, sfx: {...state.sfx, meow: true}};
            }
        } else if (mode === 'peek') {
            if (modeTime >= 500) {
                const target = state.players[0].sprite;
                const drawBox = getEnemyDrawBox(state, enemy);
                if (target.left + target.width > drawBox.left - 20 &&
                    target.left < drawBox.left + drawBox.width + 20) {
                    mode = 'swipe';
                    modeTime = animationTime = 0;
                } else if (modeTime > 4000) {
                    mode = 'normal';
                    modeTime = animationTime = 0;
                }
            }
        } else if (mode === 'swipe') {
            const attackDuration = this.swipeAnimation.frames.length * this.swipeAnimation.frameDuration * FRAME_LENGTH;
            if (modeTime >= attackDuration) {
                mode = 'recover';
                modeTime = animationTime = 0;
            }
        }
        modeTime += FRAME_LENGTH;
        return updateEnemy(state, enemy, {mode, modeTime, animationTime});
    },
    props: {
        life: 3,
        mode: 'normal',
        modeTime: 0,
        grounded: true,
        vx: 0,
    },
};

const cockroachGeometry = {
    ...r(65, 60),
    hitbox: {left: 10, top: 20, width: 50, height: 30},
};
const cockroachSoldierGeometry = {
    ...r(65, 60),
    hitbox: {left: 10, top: 5, width: 50, height: 65},
};
enemyData[ENEMY_COCKROACH] = {
    animation: createAnimation('gfx/enemies/flies/cockroachsheet.png', cockroachGeometry,
        {cols: 3, x: 5, frameMap: [0, 2, 1]}
    ),
    deathAnimation: createAnimation('gfx/enemies/flies/cockroachsheet.png', cockroachGeometry,
        {cols: 1, x: 4}
    ),
    // Falls and can only move up in bursts.
    accelerate(state, enemy) {
        let { vy } = enemy;
        const target = state.players[0].sprite;
        const drawBox = getEnemyDrawBox(state, enemy);
        vy = Math.min(vy + enemy.fallAcceleration, 8);
        if (vy > enemy.bounceSpeed && drawBox.top > target.top) {
            vy = -enemy.verticalSpeed;
        }
        return {...enemy, vy};
    },
    props: {
        life: 3,
        vx: -4,
        verticalSpeed: 6,
        fallAcceleration: 0.2,
        bounceSpeed: 4,
        score: 40,
    },
};

enemyData[ENEMY_COCKROACH_SOLDIER] = {
    ...enemyData[ENEMY_COCKROACH],
    animation: createAnimation('gfx/enemies/flies/cockroachsheet.png', cockroachSoldierGeometry,
        {cols: 3}
    ),
    deathAnimation: createAnimation('gfx/enemies/flies/cockroachsheet.png', cockroachSoldierGeometry,
        {cols: 1, x: 3}
    ),
    onDeathEffect(state, enemy) {
        const cockroach = createEnemy(state, ENEMY_COCKROACH, {
            left: enemy.left,
            top: enemy.top,
            animationTime: 20,
            verticalSpeed: 8,
        });
        // Only add the old enemy back to the state if it hasn't already been removed.
        if (state.idMap[enemy.id]) {
            // Delete the current enemy from the state so it can be
            // added on top of the mount enemy.
            state = removeEnemy(state, enemy);
            state = addEnemyToState(state, cockroach);
            return addEnemyToState(state, enemy);
        }
        return addEnemyToState(state, cockroach);
    },
    onHitGroundEffect: onHitGroundEffect_spawnMonk,
    shoot: shoot_bulletAtPlayer,
    props: {
        life: 5,
        vx: -3,
        verticalSpeed: 4,
        fallAcceleration: 0.1,
        bounceSpeed: 2,
        bulletSpeed: 6,
        shotCooldownFrames: [16, 16, 125],
        bulletX: 1,
        bulletY: 0.25,
        score: 40,
    },
};

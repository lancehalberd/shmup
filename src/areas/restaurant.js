const {
    FRAME_LENGTH, WIDTH,
} = require('gameConstants');
const random = require('random');
const { createAnimation, r } = require('animations');
const { advanceWorld, getNewLayer, allWorlds, checkpoints, updateLayerSprite } = require('world');
const { ENEMY_BROWN_SPIDER, ENEMY_JUMPING_SPIDER } = require('enemies/spiders');
/*

Here are the background assets for 3b! The first order is the transitions from both possibilities of stage 2 into the city.
There is a lot of vertical movement possibility to 3b, both in travelling in the brick alley and also when above the roof of
the alley and seeing the cityscape. There is the ground all the way to the floor of the alley
From 2B to 3B, it is the same transition from 1 to 2B where the screen moves faster than the Knight,
and the Knight appears at the other side of the tunnel. From 2A to 3B,
the forest merely ends and the Knight is flying above the city skyline.

*/

const setEvent = (state, event) => {
    // FRAME_LENGTH will be added to eventTime before the event is processed next, so we
    // set it to -FRAME_LENGTH so it will be 0 on the first frame.
    return {...state, world: {...state.world, eventTime: -FRAME_LENGTH, event}};
};

// Add check points for:
const CHECK_POINT_RESTAURANT_START = 'restaurantStart';
const CHECK_POINT_RESTAURANT_END = 'restaurantEnd';
const CHECK_POINT_RESTAURANT_BOSS = 'restaurantBoss';
const WORLD_RESTAURANT = 'restaurant';

module.exports = {
    CHECK_POINT_RESTAURANT_START,
    CHECK_POINT_RESTAURANT_BOSS,
    WORLD_RESTAURANT,
    getRestaurantWorld,
};
const { spawnEnemy, addEnemyToState, createEnemy, ENEMY_FLEA } = require('enemies');
const { transitionToRestaurantBoss } = require('areas/restaurantBoss');
const { enterStarWorld } = require('areas/stars');
const { CHECK_POINT_STARS_3 } = require('areas/stars3');
const { LOOT_NECKLACE } = require('loot');

checkpoints[CHECK_POINT_RESTAURANT_START] = function (state) {
    const world = getRestaurantWorld();
    world.time = RESTAURANT_START_TIME;
    return {...state, world};
};
checkpoints[CHECK_POINT_RESTAURANT_END] = function (state) {
    const world = getRestaurantWorld();
    // Don't show the beginning of the bar when spawning near the end of the level.
    world.ground.firstElements = ['barMiddle'];
    world.ground.xOffset = 0;
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 135000;
    return {...state, world};
};
checkpoints[CHECK_POINT_RESTAURANT_BOSS] = function (state) {
    const world = getRestaurantWorld();
    world.time = 150000;
    state = {...state, world};
    return transitionToRestaurantBoss(bossPrepTransition(advanceWorld(state)));
};

// Update the ground layer to remove the table and prevent any more sprites from spawning
// in that layer.
function bossPrepTransition(state) {
    return {
        ...state,
        world: {
            ...state.world,
            ground: {
                ...state.world.ground,
                firstElements: false,
                spriteData: {
                    barStart: {animation: barStartAnimation, scale: 2, next: ['barEnd'], offset: 0},
                    barMiddle: {animation: barMiddleAnimation, scale: 2, next: ['barEnd'], offset: 0},
                    barEnd: {animation: barEndAnimation, scale: 2, next: false, offset: 0},
                },
            },
            candles: {
                ...state.world.candles,
                firstElements: false,
                spriteData: {
                    candle: {animation: candleAnimation, scale: 2, next: ['flame'], offset: -100},
                    flame: {animation: flameBurnAnimation, onHit: onHitFlame, scale: 2, next: false, offset: [150, 250]},
                },
            },
        },
    };
}

const RESTAURANT_START_TIME = 95000;
const RESTAURANT_DURATION = 150000;

function checkToSpawnSpiders(state, eventTime) {
    if (eventTime !== 0) return state;
    if (Math.random() > (state.world.time - RESTAURANT_START_TIME) / (RESTAURANT_DURATION - RESTAURANT_START_TIME)) {
        return state;
    }
    let spider;
    if (random.chance(0.5)) {
        spider = createEnemy(state, ENEMY_BROWN_SPIDER, {
            left: random.range(500, WIDTH),
            top: -55,
            mode: 'enter',
            targetY: 400,
        });
    } else {
        spider = createEnemy(state, ENEMY_JUMPING_SPIDER, {
            left: random.range(600, 750),
            top: -55,
            grounded: true, hanging: false, mode: 'jumping',
        });
        state = addEnemyToState(state, spider);
        spider = createEnemy(state, ENEMY_JUMPING_SPIDER, {
            left: random.range(600, 750),
            top: -55,
            grounded: true, hanging: false, mode: 'jumping',
            delay: 100,
        });
    }
    return addEnemyToState(state, spider);
}

const {
    nothing, easyRoaches, normalRoaches,
    powerup, normalFlies,
    lightningBeetle, bossPowerup,
} = require('enemyPatterns');
allWorlds[WORLD_RESTAURANT] = {
    initialEvent: 'nothing',
    isPortalAvailable(state) {
        return !state.players[0].relics[LOOT_NECKLACE];
    },
    enterStarWorld(state) {
        return enterStarWorld(state, CHECK_POINT_STARS_3, CHECK_POINT_RESTAURANT_END);
    },
    events: {
        nothing: nothing(2000, 'easyRoaches'),
        easyRoaches: easyRoaches('powerup'),
        powerup: powerup('cockroaches'),
        cockroaches: normalRoaches(0, ['fleas', 'flies']),
        fleas(state, eventTime) {
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_FLEA, {left: WIDTH});
            }
            eventTime -= 1000;
            if (eventTime === 0) {
                return spawnEnemy(state, ENEMY_FLEA, {left: WIDTH});
            }
            eventTime -= 2000;
            if (eventTime >= 0) {
                return setEvent(state, random.element(['flies', 'lightningBeetle']));
            }
        },
        flies: normalFlies(0, ['fleas', 'lightningBeetle']),
        lightningBeetle: lightningBeetle(['cockroaches', 'flies']),
        bossPrep: (state, eventTime) => {
            if (eventTime === 0) return bossPrepTransition(state);
            return setEvent(state, 'bossPowerup');
        },
        bossPowerup: bossPowerup(CHECK_POINT_RESTAURANT_END, transitionToRestaurantBoss),
    },
    advanceWorld: (state) => {
        let world = state.world;
        if (world.event !== 'bossPrep' && world.event !== 'nothing') state = checkToSpawnSpiders(state, state.world.eventTime || 0);
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 90 * 5;
        const targetX = Math.max(world.targetX, world.x + 1000);
        let targetY = 200;
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        if (world.type === WORLD_RESTAURANT && world.time >= RESTAURANT_DURATION &&
            world.event !== 'bossPrep' && world.event !== 'bossPowerup'
        ) {
            return setEvent(state, 'bossPrep');
        }

        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
};

function getRestaurantWorld() {
    return {
        type: WORLD_RESTAURANT,
        x: 0,
        y: 200,
        vx: 0,
        vy: 0,
        targetX: 1000,
        targetY: 200,
        targetFrames: 50 * 10,
        time: 0,
        bgm: 'bgm/alley.mp3',
        groundHeight: 243,
        ...getRestaurantLayers(),
    };
}

/*

In the restaurant, occasionally there can be ground as well (the table).
I am unsure how you want to have it if a robes falls on the table but then reaches the end of the table - do they then fall off?
Do they stop? Alternatively, we can treat the groundloop as a "bar" and never have it end with only minor alterations to the sprite.

*/
const flameGeometry = r(100, 100, {
    hitbox: {left:45, top:27, width: 10, height: 8}
});
const candleAnimation = createAnimation('gfx/scene/city/candle.png', r(100, 100), {cols: 1, x: 6});
const flameBurnAnimation = createAnimation('gfx/scene/city/candle.png', flameGeometry, {cols: 4});
const flameExtinguishAnimation = createAnimation('gfx/scene/city/candle.png', flameGeometry,
    {cols: 4, x: 4, frameMap: [0, 1, 3]}, {loop: false}
);
const tableAnimation = createAnimation('gfx/scene/city/table.png', r(400, 300));
const barStartAnimation = createAnimation('gfx/scene/city/table.png', r(350, 300));
const barMiddleAnimation = createAnimation('gfx/scene/city/table.png', r(200, 300), {left: 50});
const barEndAnimation = createAnimation('gfx/scene/city/table.png', r(50, 300), {left: 350});

function onHitFlame(state, layerName, spriteIndex, attack) {
    const sprite = state.world[layerName].sprites[spriteIndex];
    const animation = attack.melee ? flameExtinguishAnimation : flameBurnAnimation;
    if (animation === sprite.animation) return state;
    return updateLayerSprite(state, layerName, spriteIndex, {animation, animationTime: 0});
}
function getRestaurantLayers() {
    return {
    background: getNewLayer({
        xFactor: 0, yFactor: 0, yOffset: 0, maxY: 0, unique: true,
        spriteData: {
            background: {animation: createAnimation('gfx/scene/city/restaurant.png', r(400, 300)), scale: 2},
        },
    }),
    tables: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -200,
        firstElements: ['table1', 'table2'],
        spriteData: {
            table1: {animation: tableAnimation, scale: 2, next: ['candle1'], offset: -320},
            table2: {animation: tableAnimation, scale: 2, next: ['candle2'], offset: [-100, -200]},
            candle1: {animation: candleAnimation, scale: 2, next: ['flame1'], offset: -98, yOffset: -20},
            candle2: {animation: candleAnimation, scale: 2, next: ['flame2'], offset: -98, yOffset: -20},
            flame1: {animation: flameBurnAnimation, onHit: onHitFlame, scale: 2, next: ['candle2'], offset: 150, yOffset: -20},
            flame2: {animation: flameBurnAnimation, onHit: onHitFlame, scale: 2, next: ['table1', 'table2'], offset: 400, yOffset: -20},
        },
    }),
    ground: getNewLayer({
        xFactor: 1, yFactor: 1, xOffset: 600, yOffset: -200,
        firstElements: ['barStartAnimation'],
        spriteData: {
            barStartAnimation: {animation: barStartAnimation, scale: 2, next: ['barMiddle'], offset: 0},
            barMiddle: {animation: barMiddleAnimation, scale: 2, next: ['barMiddle'], offset: 0},
            // barEndAnimation is only used during the transition to the boss.
        },
    }),
    candles: getNewLayer({
        xFactor: 1, yFactor: 1, yOffset: -245, xOffset: 600,
        firstElements: ['candle'],
        spriteData: {
            candle: {animation: candleAnimation, scale: 2, next: ['flame'], offset: -100},
            flame: {animation: flameBurnAnimation, onHit: onHitFlame, scale: 2, next: ['candle'], offset: [150, 250]},
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: ['background', 'ground', 'candles'],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: [],
    };
}


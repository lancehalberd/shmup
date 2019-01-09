const {
    FRAME_LENGTH, GAME_HEIGHT, WIDTH,
    ATTACK_BULLET, ENEMY_MONK, LOOT_FLAME_COIN,
} = require('gameConstants');
const { ENEMY_HORNET, ENEMY_HORNET_KNIGHT } = require('enemies/hornets');
const random = require('random');
const { createAnimation, r, requireImage, getFrame } = require('animations');
const {
    getNewLayer, allWorlds, updateLayerSprite,
    checkpoints, setCheckpoint, setEvent, advanceWorld,
    clearLayers,
} = require('world');

const WORLD_CIRCUS = 'circus';
const CHECK_POINT_CIRCUS_START = 'circusStart';
const CHECK_POINT_CIRCUS_MIDDLE = 'circusMiddle';
const CHECK_POINT_CIRCUS_MIDDLE_TIME = 40000;
const CHECK_POINT_CIRCUS_END = 'circusEnd';
const CHECK_POINT_CIRCUS_BOSS = 'circusBoss';
const CIRCUS_DURATION = 120000;
const CIRCUS_EASY_DURATION = 30000;
const SAFE_HEIGHT = GAME_HEIGHT;

const ENEMY_FIRE_RING = 'fireRing';
const ENEMY_BUBBLE_MACHINE = 'bubbleMachine';
const ENEMY_CLAW = 'claw';
const ENEMY_GRASSHOPPER = 'grasshopper';
const ENEMY_GRASSHOPPER_MOUNT = 'grasshopperMount';
const ENEMY_STILTS_MONK = 'stiltsMonk';
const ENEMY_DEAD_STILTS = 'deadStilts';
const ENEMY_BALLOON_MONK = 'balloonMonk';

module.exports = {
    CHECK_POINT_CIRCUS_START,
    WORLD_CIRCUS,
    ENEMY_GRASSHOPPER,
    getCircusWorld,
};

const { updatePlayer, getHeroHitbox } = require('heroes');
const { addLootToState, createLoot } = require('loot');
const {
    updateEnemy, getEnemyHitbox, removeEnemy,
    enemyData, shoot_bulletAtPlayer,
    createEnemy, addEnemyToState,
    spawnEnemy, damageEnemy, setMode,
    addBullet, renderEnemyFrame,
} = require('enemies');
const { transitionToCircusBoss } = require('areas/circusBoss');
const {
    addEnemyAttackToState, createAttack,
} = require('attacks');
const { ENEMY_BUBBLE, ENEMY_BUBBLE_SHOT } = require('areas/beachBoss');

checkpoints[CHECK_POINT_CIRCUS_START] = function (state) {
    const world = getCircusWorld();
    return advanceWorld(advanceWorld({...state, world}));
};
checkpoints[CHECK_POINT_CIRCUS_MIDDLE] = function (state) {
    const world = getCircusWorld();
    // This is 1/3 of the way through the stage.
    world.time = CHECK_POINT_CIRCUS_MIDDLE_TIME;
    return advanceWorld(advanceWorld({...state, world}));
};
checkpoints[CHECK_POINT_CIRCUS_END] = function (state) {
    const world = getCircusWorld();
    // This is just enough time for a few powerups + large enemies before the boss fight.
    world.time = 100000;
    return advanceWorld(advanceWorld({...state, world}));
};
checkpoints[CHECK_POINT_CIRCUS_BOSS] = function (state) {
    const world = getCircusWorld();
    world.time = 120000;
    state = clearLayers({...state, world}, ['stands', 'smallTents']);
    // Advance world once to add background, and a second time to position it.
    state = advanceWorld(state);
    return transitionToCircusBoss(advanceWorld(state));
};

const {
    nothing, normalFlies, powerup,
    explodingBeetle, lightningBeetle,
    bossPowerup,
    singleEnemy, singleEasyHardEnemy, getTop
} = require('enemyPatterns');
function spawnRing(state, top, left) {
    const scale = Math.max(1.2, 2.5 - state.world.time / 100000);

    const ring = createEnemy(state, ENEMY_FIRE_RING, {top, left, scale});
    state = addEnemyToState(state, ring);

    const loot = createLoot(LOOT_FLAME_COIN);
    loot.width = 2;
    loot.left = left + scale * 50 - 1;
    loot.top = top + 5 * scale;
    loot.height = 90 * scale;
    loot.sourceId = ring.id;
    return addLootToState(state, loot);
}
allWorlds[WORLD_CIRCUS] = {
    initialEvent: 'nothing',
    events: {
        transition: (state, eventTime) => {
            state = updatePlayer(state, 0, {}, {targetLeft: -100, targetTop: 300});
            if (eventTime === 1000) {
                state = updatePlayer(state, 0, {}, {targetLeft: 100, targetTop: 300});
                return setEvent(state, 'nothing');
            }
            return state;
        },
        easyRings(state, eventTime) {
            if (eventTime === 0) {
                const baseHeight = random.element([200, 300, 400]);
                for (let i = 0; i < 4; i++) {
                    state = spawnRing(state, baseHeight - 50 + Math.random() * 100, WIDTH + 150 * i);
                }
                return state;
            }
            if (eventTime >= 8000) {
                return setEvent(state, ['stilts', 'balloons']);
            }
        },
        hardRings(state, eventTime) {
            if (eventTime === 0) {
                const baseHeight = random.element([200, 300, 400]);
                for (let i = 0; i < 4; i++) {
                    state = spawnRing(state, baseHeight - 75 + Math.random() * 150, WIDTH + 150 * i);
                }
                return state;
            }
            if (eventTime >= 6000) {
                return setEvent(state, 'bubbleMachine');
            }
        },
        bubbleMachine(state, eventTime) {
            if (eventTime === 0) {
                let bubbleDelay = 800;
                if (state.world.time > CIRCUS_EASY_DURATION && Math.random() < 0.6) {
                    bubbleDelay = 100;
                }
                if (Math.random() < 0.5) {
                    return spawnEnemy(state, ENEMY_BUBBLE_MACHINE, {
                        left: WIDTH - 80, top: GAME_HEIGHT, exactCoords: true,
                        flipped: true, bubbleDelay,
                    });
                }
                return spawnEnemy(state, ENEMY_BUBBLE_MACHINE, {
                    left: 0, top: GAME_HEIGHT, exactCoords: true, bubbleDelay,
                });
            }
            if (eventTime >= 5000) {
                return setEvent(state, ['stilts', 'balloons']);
            }
        },
        nothing: nothing(1000, 'easyRings'),
        powerup: powerup(['shellMonk', 'urchin']),
        flies: normalFlies(CIRCUS_EASY_DURATION, ['urchin', 'burrowMonk']),
        hornet: singleEasyHardEnemy(ENEMY_HORNET, ENEMY_HORNET_KNIGHT, CIRCUS_EASY_DURATION, 1000, ['flies']),
        grasshopper: singleEnemy(ENEMY_GRASSHOPPER, 2000, ['explodingBeetle', 'lightningBeetle']),
        stilts(state, eventTime) {
            if (eventTime === 0) {
                let top = getTop(state, random.element([5, 6, 7]) / 8);
                return spawnEnemy(state, ENEMY_STILTS_MONK, {left: WIDTH, top, exactCoords: true});
            }
            eventTime -= 2000;
            if (eventTime >= 0) {
                return setEvent(state, ['balloons', 'grasshopper']);
            }
        },
        balloons(state, eventTime) {
            if (eventTime === 0) {
                let top = getTop(state, random.element([1, 2, 3]) / 8);
                return spawnEnemy(state, ENEMY_BALLOON_MONK, {left: WIDTH, top, exactCoords: true});
            }
            eventTime -= 2000;
            if (eventTime >= 0) {
                return setEvent(state, ['stilts', 'grasshopper']);
            }
        },
        explodingBeetle: explodingBeetle(['hardRings']),
        lightningBeetle: lightningBeetle(['hardRings']),
        bossPowerup: bossPowerup(CHECK_POINT_CIRCUS_END, transitionToCircusBoss),
    },
    advanceWorld(state) {
        state = this.updateSunrise(state);
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        const targetFrames = 70 * 6;
        const targetX = Math.max(world.targetX, world.x + 1000);
        let targetY = world.y;
        // This area looks like it would be good for movement, but actually looks really bad.
        //if (state.world.time % 30000 < 15000) targetY = 300;
        //else targetY = 0;
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};
        state = {...state, world};

        if (world.type === WORLD_CIRCUS && world.time >= CIRCUS_DURATION && world.event !== 'bossPowerup') {
            return setEvent(state, 'bossPowerup');
        }
        if (world.time === CHECK_POINT_CIRCUS_MIDDLE_TIME) {
            state = setCheckpoint(state, CHECK_POINT_CIRCUS_MIDDLE);
        }
        if (world.time === CIRCUS_DURATION - 19000) {
            state = clearLayers(state, ['stands', 'smallTents']);
            world = state.world;
            const standSprites = state.world.stands.sprites;
            const lastStand = standSprites[standSprites.length - 1];
            const limit = lastStand ? lastStand.left + lastStand.width : WIDTH;
            state.enemies.filter(e => e.type === ENEMY_CLAW && e.left > limit).forEach(enemy => {
                state = removeEnemy(state, enemy);
            });
        }

        if (!world.event) world = {...world, event: allWorlds[world.type].initialEvent, eventTime: 0};
        else world = {...world, eventTime: world.eventTime + FRAME_LENGTH};
        state = {...state, world};
        return allWorlds[world.type].events[world.event](state, state.world.eventTime || 0) || state;
    },
    // Fade the sunrise graphic in from 1 to 0 as it moves off the top of the screen.
    updateSunrise(state) {
        if (state.world.circus.sprites[0]) {
            state = updateLayerSprite(state, 'circus', 0, {left: -state.world.time / 100});
        }
        let sunrise = state.world.sunrise.sprites[0];
        if (!sunrise) return state;
        const start = GAME_HEIGHT, end = GAME_HEIGHT - sunrise.height;
        const top = Math.max(end, start - state.world.time / 50);
        // This will fade from 1 to 0 as sunrise.top moves from start to end.
        const alpha = Math.min(1, (sunrise.top - end) / (-1400 - end));
        if (top < -650 && state.world.mgLayerNames.includes('nightSky')) {
            const mgLayerNames = [...state.world.mgLayerNames];
            mgLayerNames.splice(mgLayerNames.indexOf('nightSky'), 1, 'daySky');
            state = {...state, world: {...state.world, mgLayerNames}};
        }
        return updateLayerSprite(state, 'sunrise', 0, {left: 0, top, alpha});
    },
};

function getCircusWorld() {
    return {
        type: WORLD_CIRCUS,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 1000,
        targetY: 0,
        targetFrames: 50 * 10,
        time: 0,
        bgm: 'bgm/circus.mp3',
        ...getCircusLayers(),
    };
}

const nightSky = createAnimation('gfx/scene/sky/sky.png', r(400, 250));
const skyLoop = createAnimation('gfx/scene/circus/4Bsky.png', r(400, 250));
const sunriseAnimation = createAnimation('gfx/scene/circus/4bsunrisetransition.png', r(400, 1200));
const circusLoop = createAnimation('gfx/scene/circus/4bbackground.png', r(800, 300));
const balloonAnimation = {
    frames: [
        r(50, 50, {image: requireImage('gfx/scene/circus/balloon1.png')}),
        r(50, 50, {image: requireImage('gfx/scene/circus/balloon2.png')}),
    ],
    frameDuration: 24,
};
const tentAnimation = createAnimation('gfx/scene/circus/tent.png', r(300, 200));
const bigTentAnimation = createAnimation('gfx/scene/circus/tent.png', r(300, 150));
const stand1Animation = createAnimation('gfx/scene/circus/stand1.png', r(600, 300));
const stand2Animation = createAnimation('gfx/scene/circus/stand2.png', r(600, 300));
const cageAnimation = createAnimation('gfx/scene/circus/cages.png', r(591, 300));
function getCircusLayers() {
    return {
    nightSky: getNewLayer({
        xFactor: 0, yFactor: 0, yOffset: 0, xOffset: 0, unique: true,
        spriteData: {
            nightSky: {animation: nightSky, scale: 2.5},
        },
    }),
    daySky: getNewLayer({
        xFactor: 0, yFactor: 0, yOffset: 0, xOffset: 0, unique: true,
        spriteData: {
            sky: {animation: skyLoop, scale: 2.5},
        },
    }),
    sunrise: getNewLayer({
        xFactor: 0, yFactor: 1, yOffset: 0, xOffset: 0, unique: true,
        spriteData: {
            sky: {animation: sunriseAnimation, scale: 2},
        },
    }),
    circus: getNewLayer({
        xFactor: 0, yFactor: 0, yOffset: 0, unique: true,
        spriteData: {
            circus: {animation: circusLoop, scale: 2},
        },
    }),
    balloons: getNewLayer({
        xFactor: 0.1, yFactor: 0.1, yOffset: 50,
        spriteData: {
            tinyBalloons: { animation: balloonAnimation, scale: 1, vy: -0.3, next: ['balloons', 'bigBalloons'], offset: [25, 100, 150], yOffset: [-200, -300, -400] },
            balloons: { animation: balloonAnimation, scale: 2, vy: -0.5, next: ['tinyBalloons', 'bigBalloons'], offset: [50, 100, 150], yOffset: [-100, -160, -240] },
            bigBalloons: { animation: balloonAnimation, scale: 3, vy: -0.5, next: ['tinyBalloons', 'ballons'], offset: [50, 100, 150], yOffset: [0, -40, -80] },
        },
    }),
    closeBalloons: getNewLayer({
        xFactor: 0.5, yFactor: 0.5, yOffset: 100,
        spriteData: {
            balloons: { animation: balloonAnimation, scale: 5, vy: -0.5, next: ['balloons'], offset: [50], yOffset: [0, 10, 20] },
        },
    }),
    smallTents: getNewLayer({
        xFactor: 0.2, yFactor: 1, yOffset: 50,
        spriteData: {
            tent: { animation: tentAnimation, scale: 0.8, offset: 800 },
        },
    }),
    stands: getNewLayer({
        xFactor: 1, yFactor: 1, xOffset: WIDTH, yOffset: 0, firstElements: ['stand1'],
        spriteData: {
            stand1: {animation: stand1Animation, scale: 2, next: ['stand2'], offset: 300},
            stand2: {animation: stand2Animation, scale: 2, next: ['beforeCage'], offset: 300},
            beforeCage: {animation: cageAnimation, onAdded: addCageClaws, scale: 2, next: ['tent'], offset: 100},
            tent: {animation: bigTentAnimation, scale: 4, next: ['afterCage'], offset: 100},
            afterCage: {animation: cageAnimation, onAdded: addCageClaws, scale: 2, next: ['stand1'], offset: 300},
        },
    }),
    // Background layers start at the top left corner of the screen.
    bgLayerNames: [],
    // Midground layers use the bottom of the HUD as the top of the screen,
    // which is consistent with all non background sprites, making hit detection simple.
    mgLayerNames: [
        'nightSky', 'sunrise', 'circus',
        'smallTents', 'balloons',
        'closeBalloons',
        'stands'
    ],
    // Foreground works the same as Midground but is drawn on top of game sprites.
    fgLayerNames: [],
    };
}
function addCageClaws(state, cageSprite) {
    let slots = [1, 2, 3, 4, 5];
    let numberOfClaws = state.world.time < CIRCUS_EASY_DURATION ? 2 : 3;
    for (let i = 0; i < numberOfClaws; i++) {
        let slot = random.removeElement(slots);
        state = spawnEnemy(state, ENEMY_CLAW, {
            top: GAME_HEIGHT / 2 + i * 50,
            // (25px bars, 56px gaps) scale x2
            left: cageSprite.left + 50 + 162 * slot - 20,
            vx: 0,
            flipped: Math.random() < 0.5,
            important: true,
        });
    }
    return state;
}

const fireRingGeometry = r(100, 100, {
    hitboxes: [],
    damageBoxes: [
        {left: 45, top: 0, width: 10, height: 10},
        {left: 45, top: 90, width: 10, height: 10},
    ],
});
const backRing = createAnimation('gfx/scene/circus/flamecirclesheet.png', fireRingGeometry, {x: 1});
const frontRing = createAnimation('gfx/scene/circus/flamecirclesheet.png', fireRingGeometry, {x: 2});
const backFlameAnimation = createAnimation('gfx/scene/circus/flamecirclesheet.png', fireRingGeometry, {x: 3, cols: 6, frameMap: [1, 3, 5]});
const frontFlameAnimation = createAnimation('gfx/scene/circus/flamecirclesheet.png', fireRingGeometry, {x: 3, cols: 6, frameMap: [0, 2, 4]});
enemyData[ENEMY_FIRE_RING] = {
    // This is just the back ring.
    animation: backRing,
    drawOver(context, state, enemy) {
        const frame = getFrame(backFlameAnimation, enemy.animationTime);
        const scaleX = (frame.scaleX || 1) * (enemy.scaleX || 1) * (enemy.scale || 1);
        const scaleY = (frame.scaleY || 1) * (enemy.scaleY || 1) * (enemy.scale || 1);
        context.fillStyle = '#621';
        context.fillRect(
            enemy.left + scaleX * (enemy.width / 2 - 3),
            enemy.top + scaleY * enemy.height, scaleX * 4, GAME_HEIGHT);
        context.save();
        // Draw a glowing film in the loop if the player hasn't collected the bonus
        // from the loop yet.
        if (!enemy.collected) {
            context.globalAlpha = 0.5 + 0.25 * Math.cos(state.world.time / 200);
            context.fillStyle = 'white';
            context.beginPath();
            let x = enemy.left + scaleX * enemy.width / 2;
            let y = enemy.top + scaleY * enemy.height / 2;
            context.ellipse(x, y, 13 * scaleX, 47 * scaleY, 0, 0, Math.PI * 2);
            context.fill();
        }
        context.globalAlpha = 0.5;
        renderEnemyFrame(context, state, enemy, frame);
        context.restore();
    },
    renderForeground(context, state, enemy) {
        let frame = getFrame(frontRing, enemy.animationTime);
        renderEnemyFrame(context, state, enemy, frame);
        frame = getFrame(frontFlameAnimation, enemy.animationTime);
        context.save();
        context.globalAlpha = 0.5;
        renderEnemyFrame(context, state, enemy, frame);
        context.restore();
    },
    props: {
        life: 100,
        hanging: true,
        vx: 0,
        hasForeground: true, // Allow us to draw the ring over the player.
        difficulty: 0,
    },
};

const bubbleMachineGeometry = r(150, 100, {
    hitbox: {left: 0, top: 0, height: 100, width: 140},
    hitboxes: []
});
enemyData[ENEMY_BUBBLE_MACHINE] = {
    animation: createAnimation('gfx/enemies/bubblemachine.png', bubbleMachineGeometry),
    updateState(state, enemy) {
        const hitbox = getEnemyHitbox(state, enemy);
        const dx = hitbox.left < WIDTH / 2 ? 1 : -1;
        if (enemy.top > GAME_HEIGHT - hitbox.height) {
            return updateEnemy(state, enemy, {top: enemy.top - 2, left: dx > 0 ? 0 : WIDTH - hitbox.width});
        }
        let vx = enemy.vx * 0.9;
        if (hitbox.left + hitbox.width < 0 || hitbox.left > WIDTH) {
            return removeEnemy(state, enemy);
        }
        if (enemy.animationTime % enemy.bubbleDelay === 0) {
            const bubble = createEnemy(state, random.element([ENEMY_BUBBLE_SHOT, ENEMY_BUBBLE, ENEMY_BUBBLE]), {
                left: hitbox.left + hitbox.width / 2 + 40 * dx, top: hitbox.top + 40,
                vx: 5 * Math.random() * dx,
                vy: -2 - 2 * Math.random(),
                scaleX: 0.2,
                scaleY: 0.2,
                sourceId: enemy.id,
                sourceOffset: [hitbox.width / 2, 42],
            });
            bubble.left -= bubble.width / 2;
            bubble.height -= bubble.height / 2;
            state = addEnemyToState(state, bubble);
            vx -= 1.5 * dx;
        }
        return updateEnemy(state, enemy, {vx});
    },
    props: {
        life: 100,
        bubbleDelay: 800,
        vx: 0,
        difficulty: 4,
        doNotFlip: true,
    },
};

const clawGeometry = r(76, 95, {
    scaleX: 2, scaleY: 2,
    damageBoxes: [{left: 10, top: 10, width: 56, height: 75, }],
    hitboxes: []
});
enemyData[ENEMY_CLAW] = {
    animation: createAnimation('gfx/enemies/cageclaw.png', clawGeometry),
    attackAnimation: createAnimation('gfx/enemies/cageclaw2.png', clawGeometry),
    getAnimation(state, enemy) {
        if (enemy.mode === 'swiping' || enemy.mode === 'pause') return this.attackAnimation;
        return this.animation;
    },
    updateState(state, enemy) {
        const hitbox = getEnemyHitbox(state, enemy);
        const heroHitbox = getHeroHitbox(state.players[0]);
        const range = 250;
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.mode === 'swiping') {
            if (hitbox.top + hitbox.height > GAME_HEIGHT) {
                return setMode(state, enemy, 'pause', {vy: 0});
            }
            return updateEnemy(state, enemy, {vy: Math.min(15, enemy.vy + 1)});
        } else if (enemy.mode === 'raising') {
            if (hitbox.top < 0) {
                return setMode(state, enemy, 'waiting', {vy: 0});
            }
            return updateEnemy(state, enemy, {vy: Math.min(8, enemy.vy - 1)});
        } else if (enemy.mode === 'waiting') {
            if (enemy.modeTime < 500) return state;
            if (heroHitbox.left + heroHitbox.width + range > hitbox.left &&
                heroHitbox.left - range < hitbox.left + hitbox.width) {
                return setMode(state, enemy, 'swiping');
            }
        } else if (enemy.mode === 'pause') {
            if (enemy.modeTime >= 500) {
                return setMode(state, enemy, 'raising');
            }
        }
        return state;
    },
    props: {
        life: 100,
        vx: 0,
        mode: 'raising',
        modeTime: 0,
        hanging: true,
        difficulty: 2,
    },
};

const grasshopperGeometry = r(110, 100, {
    hitboxes: [
        {left: 28, top: 54, width: 65, height: 23},
        {left: 15, top: 30, width: 20, height: 35},
    ],
});
enemyData[ENEMY_GRASSHOPPER_MOUNT] = {
    animation: createAnimation('gfx/enemies/grasshoppersheet.png', grasshopperGeometry, {x: 5}),
    props: {
        life: 0,
        difficulty: 0,
    },
};
enemyData[ENEMY_GRASSHOPPER] = {
    animation: createAnimation('gfx/enemies/grasshoppersheet.png', grasshopperGeometry, {x: 3, cols: 2, duration: 1}),
    deathAnimation: createAnimation('gfx/enemies/grasshoppersheet.png', grasshopperGeometry, {x: 1}),
    monkAnimation: createAnimation('gfx/enemies/grasshoppersheet.png', grasshopperGeometry, {x: 6}),
    updateState(state, enemy) {
        if (enemy.dead) return state;
        const hitbox = getEnemyHitbox(state, enemy);
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.mode === 'targeting') {
            if (enemy.modeTime >= 1000) {
                let flipped = Math.random() < 0.5;
                return setMode(state, enemy, 'moving', {
                    flipped,
                    targetX: !flipped ?
                        WIDTH / 2 + 200 + Math.random() * 100 :
                        WIDTH / 2 - 100 - Math.random() * 100,
                    targetY: hitbox.top + hitbox.height / 2 > GAME_HEIGHT / 2 ?
                        GAME_HEIGHT / 2 - 50 - 100 * Math.random() :
                        GAME_HEIGHT / 2 + 50 + 100 * Math.random(),
                    targetFrames: 50,
                });
            }
            return updateEnemy(state, enemy, {vy: enemy.vy * 0.9, vx : enemy.vx * 0.9});
        } else if (enemy.mode === 'moving') {
            const tvx = (enemy.targetX - (hitbox.left + hitbox.width / 2)) / enemy.targetFrames,
                tvy = (enemy.targetY - (hitbox.top + hitbox.height / 2)) / enemy.targetFrames;
            state = updateEnemy(state, enemy, {
                vx: (enemy.vx + tvx) / 2,
                vy: (enemy.vy + tvy) / 2,
                targetFrames: enemy.targetFrames - 1,
            });
            enemy = state.idMap[enemy.id];
            if (enemy.targetFrames <= 0) {
                return setMode(state, enemy, 'shooting')
            }
        } else if (enemy.mode === 'shooting') {
            state = updateEnemy(state, enemy, {vy: enemy.vy * 0.9, vx: enemy.vx * 0.9});
            enemy = state.idMap[enemy.id];
            if (enemy.modeTime % 400 === 0) {
                let theta;
                if (hitbox.left + hitbox.width / 2 < WIDTH / 2) {
                    if (hitbox.top + hitbox.height / 2 < GAME_HEIGHT / 2) theta = 0;
                    else theta = -Math.PI / 2;
                } else {
                    if (hitbox.top + hitbox.height / 2 < GAME_HEIGHT / 2) theta = Math.PI / 2;
                    else theta = -Math.PI;
                }
                for (let i = 0; i < 3; i++) {
                    const dt = (enemy.modeTime / 400 - 1) * Math.PI / 6 + i * Math.PI / 8;
                    state = this.shootBullet(state, enemy, theta + dt);
                }
                return state;
            }
            if (enemy.modeTime >= 1500) {
                return setMode(state, enemy, 'targeting');
            }
        }
        return state;
    },
    shootBullet(state, enemy, theta) {
        const flipped = enemy.flipped;
        const bullet = createAttack(ATTACK_BULLET, {
            vx: Math.cos(theta) * 5,
            vy: Math.sin(theta) * 5,
            left: flipped ? enemy.left + enemy.width - 15 : enemy.left + 15,
            top: enemy.top + 45,
        });
        bullet.left -= bullet.width / 2;
        bullet.top -= bullet.height / 2;
        return addEnemyAttackToState(state, bullet);
    },
    drawOver(context, state, enemy) {
        if (enemy.dead) return;
        const frame = getFrame(this.monkAnimation, enemy.animationTime);
        renderEnemyFrame(context, state, enemy, frame);
    },
    onDeathEffect(state, enemy) {
        const deadMonk = createEnemy(state, ENEMY_GRASSHOPPER_MOUNT, {
            dead: true, life: 0, vx: enemy.vx - 3, vy: enemy.vy + 5,
            left: enemy.left, top: enemy.top,
        });
        return addEnemyToState(state, deadMonk);
    },
    props: {
        life: 25,
        vx: -10,
        mode: 'targeting',
        modeTime: 0,
        difficulty: 3,
        doNotFlip: true,
    },
};

const stiltsMonkGeometry = r(80, 400, {
    hitbox: {left: 23, top: 10, width: 28, height: 50},
});
enemyData[ENEMY_DEAD_STILTS] = {
    animation: createAnimation('gfx/enemies/monks/robestiltssheet.png', stiltsMonkGeometry, {x: 1}),
    props: {
        life: 0,
        difficulty: 0,
    },
};
enemyData[ENEMY_STILTS_MONK] = {
    animation: createAnimation('gfx/enemies/monks/robestiltssheet.png', stiltsMonkGeometry, {y: 1, cols: 3, frameMap: [0, 1, 2, 1]}),
    attackAnimation: createAnimation('gfx/enemies/monks/robestiltssheet.png', stiltsMonkGeometry, {x: 2}),
    deathAnimation: createAnimation('gfx/enemies/monks/robestiltssheet.png', stiltsMonkGeometry),
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.mode === 'shooting') return this.attackAnimation;
        return this.animation;
    },
    updateState(state, enemy) {
        if (enemy.dead) return state;
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];

        if (enemy.mode === 'walking') {
            let frame = (enemy.animationTime / (this.animation.frameDuration * FRAME_LENGTH)) % this.animation.frames.length;
            if (enemy.modeTime >= 1500 && (frame === 0)) {
                return setMode(state, enemy, 'shooting');
            }
            return updateEnemy(state, enemy, {vx: state.world.vx - 1});
        } else if (enemy.mode === 'shooting') {
            if (enemy.modeTime % 600 === 0) {
                for (let i = 0; i < 4; i++) {
                    const theta = -Math.PI / 2 - Math.PI / 4 + i * Math.PI / 2 / 3;
                    state = this.shootBullet(state, enemy, theta);
                }
                return state;
            }
            if (enemy.modeTime >= 1500) {
                return setMode(state, enemy, 'walking');
            }
            return updateEnemy(state, enemy, {vx: 0});
        }
        return state;
    },
    shootBullet(state, enemy, theta) {
        const hitbox = getEnemyHitbox(state, enemy);
        const bullet = createAttack(ATTACK_BULLET, {
            vx: Math.cos(theta) * 5 - state.world.vx,
            vy: Math.sin(theta) * 5,
            left: hitbox.left + hitbox.width / 2,
            top: hitbox.top,
        });
        bullet.left -= bullet.width / 2;
        bullet.top -= bullet.height / 2;
        return addEnemyAttackToState(state, bullet);
    },
    onDeathEffect(state, enemy) {
        const deadStilts = createEnemy(state, ENEMY_DEAD_STILTS, {
            dead: true, life: 0, vx: enemy.vx - 3, vy: enemy.vy + 5,
            left: enemy.left, top: enemy.top,
        });
        return addEnemyToState(state, deadStilts);
    },
    props: {
        life: 5,
        mode: 'walking',
        modeTime: 0,
        hanging: true,
        difficulty: 2,
    },
};

const balloonMonkGeometry = r(75, 250, {
    hitbox: {left: 16, top: 215, width: 40, height: 30},
});
enemyData[ENEMY_BALLOON_MONK] = {
    animation: createAnimation('gfx/enemies/monks/balloonrobesheet.png', balloonMonkGeometry, {y: 2, rows: 2}),
    attackAnimation: createAnimation('gfx/enemies/monks/balloonrobesheet.png', balloonMonkGeometry, {y: 1}),
    deathAnimation: createAnimation('gfx/enemies/monks/balloonrobesheet.png', balloonMonkGeometry),
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if ((enemy.animationTime % 2000) > 400 && (enemy.animationTime % 2000) < 600) return this.attackAnimation;
        return this.animation;
    },
    updateState(state, enemy) {
        if (enemy.dead) return state;
        state = updateEnemy(state, enemy, { vy: Math.cos(enemy.animationTime / 1000) * 0.7 - 0.5 });
        enemy = state.idMap[enemy.id];
        if (enemy.animationTime % 2000 === 500) {
            for (let i = 0; i < 3; i++) {
                const theta = Math.PI * enemy.left / WIDTH - Math.PI / 4 + i * Math.PI / 2 / 2;
                state = this.shootBullet(state, enemy, theta);
            }
        }
        return state;
    },
    shootBullet(state, enemy, theta) {
        const hitbox = getEnemyHitbox(state, enemy);
        const bullet = createAttack(ATTACK_BULLET, {
            vx: Math.cos(theta) * 5 - state.world.vx,
            vy: Math.sin(theta) * 5,
            left: hitbox.left + hitbox.width / 2,
            top: hitbox.top,
        });
        bullet.left -= bullet.width / 2;
        bullet.top -= bullet.height / 2;
        return addEnemyAttackToState(state, bullet);
    },
    props: {
        life: 5,
        modeTime: 0,
        hanging: true,
        difficulty: 2,
    },
};

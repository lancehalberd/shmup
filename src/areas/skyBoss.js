
const {
    FRAME_LENGTH, HEIGHT, WIDTH, GAME_HEIGHT,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r, getFrame, requireImage, getHitBox } = require('animations');
const { allWorlds, getNewLayer, updateLayerSprite, updateLayerSprites, applyCheckpointToState } = require('world');

const WORLD_SKY_BOSS = 'skyBoss';
const BOSS_DURATION = 80000;

const sunriseAnimation = createAnimation('gfx/scene/beach/sunrisetransition.png', r(400, 800))

function transitionToSkyBoss(state) {
    const world = {
        ...state.world,
        type: WORLD_SKY_BOSS,
        // Replace the moon layer with the sunrise.
        mgLayerNames: ['background', 'sunrise', 'clouds', 'fastClouds'],
        sunrise: getNewLayer({
            xFactor: 0.01, yFactor: 0.5, unique: true,
            spriteData: {
                sunrise: {
                    animation: sunriseAnimation, scale: 2, alpha: 0, next: ['sunrise'], offset: [0],
                },
            },
        }),
        time: 0,
        targetFrames: 50 * 5,
    };
    return {...state, world};
}
allWorlds[WORLD_SKY_BOSS] = {
    // Fade the sunrise graphic in from 0 to 1 as it moves towards the top of the screen.
    updateSunrise(state) {
        let sunrise = state.world.sunrise.sprites[0];
        if (!sunrise) return state;
        if (!state.world.transitionedToBeachAt) {
            const top = Math.max(GAME_HEIGHT - sunrise.height, GAME_HEIGHT + 400 - state.world.time / 50);
            const alpha = (GAME_HEIGHT - sunrise.top) / GAME_HEIGHT;
            state = updateLayerSprite(state, 'sunrise', 0, {left: 0, top, alpha});
            if (top + sunrise.height <= GAME_HEIGHT) {
                state = this.startBeachTransition(state);
            }
        } else {
            const top = GAME_HEIGHT - sunrise.height - (GAME_HEIGHT - state.world.y);
            state = updateLayerSprite(state, 'sunrise', 0, {left: 0, top});
            if (top + sunrise.height <= 0) {
                const seagull = state.enemies.filter(enemy => enemy.type === ENEMY_SEAGULL)[0];
                if (state.world.transitionedToBeachAt && (state.world.time - state.world.transitionedToBeachAt >= 10000 || !seagull)) {
                    state = this.finishBeachTransition(state);
                }
            }
        }
        return state;
    },
    // We actually start the beach mid boss fight, so we need an unusual transition here where we
    // apply the beach check point, but keep everything from the boss fight.
    startBeachTransition(state) {
        const skyWorld = state.world;
        state = applyCheckpointToState(state, CHECK_POINT_BEACH_START, false);
        state = {...state, bgm: 'bgm/boss.mp3', world: {
            ...state.world,
            y: GAME_HEIGHT,
            type: skyWorld.type,
            bgm: 'bgm/boss.mp3',
            lifebars: skyWorld.lifebars,
            time: skyWorld.time,
            sunrise: skyWorld.sunrise,
            clouds: {...skyWorld.clouds, yFactor: 1, yOffset: skyWorld.clouds.yOffset - GAME_HEIGHT},
            fastClouds: {...skyWorld.fastClouds, yFactor: 1, yOffset: skyWorld.fastClouds.yOffset - GAME_HEIGHT},
            mgLayerNames: [...state.world.mgLayerNames, 'sunrise', 'clouds', 'fastClouds'],
            transitionedToBeachAt: skyWorld.time,
        }};
        return state;
    },
    finishBeachTransition(state) {
        const beachWorld = getBeachWorld();
        return {
            ...state,
            bgm: beachWorld.bgm,
            world: {
                ...state.world,
                type: beachWorld.type,
                bgm: beachWorld.bgm,
                sunrise: undefined,
                clouds: undefined,
                fastClouds: undefined,
                mgLayerNames: [...beachWorld.mgLayerNames],
                lifebars: undefined,
                time: 0
            }
        };
    },
    advanceWorld(state) {
        state = this.updateSunrise(state);
        let world = state.world;
        let {targetFrames, targetX, targetY} = world;
        // 20s before the end of the level raise screen so we can transition to the sunrise graphics
        // during the boss fight.
        if (!world.transitionedToBeachAt) {
            targetFrames = 70 * 5;
            targetX = Math.max(world.targetX, world.x + 1000);
            targetY = world.y;
        } else {
            targetFrames = 70 * 5;
            targetX = Math.max(world.targetX, world.x + 1000);
            targetY = -100;
        }
        const time = world.time + FRAME_LENGTH;
        world = {...world, targetX, targetY, targetFrames, time};

        if (time === 500) {
            const lifebars = {};
            let newEnemy = createEnemy(state, ENEMY_SEAGULL, {
                left: WIDTH + 1000,
                top: -100,
            });
            if (state.demo) {
                newEnemy = createEnemy(state, ENEMY_DEMO_EMPRESS);
                state = {...state, finished: true};
            }
            lifebars[newEnemy.id] = {
                left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: world.time,
            };
            state = addEnemyToState(state, newEnemy);
            world = {...world, lifebars, bgm: 'bgm/boss.mp3'};
            state = {...state, bgm: world.bgm};
        }
        if (!world.transitionedToBeachAt && time % 8000 === 0) {
            let newEnemy = createEnemy(state, ENEMY_LIGHTNING_BEETLE, {
                left: WIDTH,
                top: random.range(1, 4) * GAME_HEIGHT / 5,
            });
            state = addEnemyToState(state, newEnemy);
        }

        if (
            !world.transitionedToBeachAt && time % 10000 === 0 &&
            state.enemies.filter(enemy => enemy.type === ENEMY_BLUE_BIRD_SOLDIER).length < 2
        ) {
            let newEnemy = createEnemy(state, random.element([ENEMY_BLUE_BIRD_SOLDIER]), {
                left: WIDTH,
                top: random.range(1, 4) * GAME_HEIGHT / 5,
            });
            state = addEnemyToState(state, newEnemy);
        }

        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToSkyBoss,
};

const {
    enemyData, createEnemy, addEnemyToState, updateEnemy, getEnemyDrawBox, removeEnemy,
    ENEMY_DEMO_EMPRESS,
} = require('enemies');
const { ATTACK_LIGHTNING_BOLT, ENEMY_LIGHTNING_BEETLE } = require('enemies/beetles');

/*
Transition to 4A at the end of the sunrise

Spawn additional enemies that shoot from the right edge

Make seagull fall when it is damaged by lightning. (set no hitboxes so it doesn't damage player)
*/

const ENEMY_SEAGULL = 'seagull';
const seagullGeometry = r(200, 102,
    {//hitBox: {left: 39, top: 63, width: 117, height: 40},
    hitBoxes: [
        {width: 45, height: 10, left: 40, top: 80},
        {width: 50, height: 15, left: 90, top: 60},
    ],
    scaleX: 3, scaleY: 3
});


const seagullDiveGeometry = r(200, 102,
    {hitBoxes: [
        {left: 118, top: 58, width: 20, height: 40},
        {left: 85, top: 28, width: 30, height: 30},
        {left: 55, top: 5, width: 30, height: 23},
    ],
    scaleX: 3, scaleY: 3},
);
const seagullFallingGeometry = r(200, 102,
    {hitBoxes: [], scaleX: 3, scaleY: 3},
);
enemyData[ENEMY_SEAGULL] = {
    animation: createAnimation('gfx/enemies/birds/seagull.png', seagullGeometry, {rows: 4}),
    flapAnimation: createAnimation('gfx/enemies/birds/seagull.png', seagullGeometry, {y: 8, rows: 5, frameMap: [0, 1, 2, 3, 3, 4, 2]}),
    diveAnimation: createAnimation('gfx/enemies/birds/seagull.png', seagullDiveGeometry, {y: 13}),
    deadAnimation: createAnimation('gfx/enemies/birds/seagull.png', seagullFallingGeometry, {y: 11}),
    getAnimation(state, enemy) {
        if (enemy.dead || enemy.mode === 'falling') return this.deadAnimation;
        if (enemy.mode === 'dive') return this.diveAnimation;
        if (enemy.mode === 'flap') return this.flapAnimation;
        return this.animation;
    },
    onDamageEffect(state, enemy, attack) {
        if (!attack || attack.damage < 1000) return state;
        state = {...state, sfx: {...state.sfx, 'seagullScreech': true}};
        return updateEnemy(state, enemy, {mode: 'falling', modeTime: 0});
    },
    updateState(state, enemy) {
        let {vx, vy, targetX, targetY, mode, modeTime, top, left} = enemy;
        const drawBox = getEnemyDrawBox(state, enemy);
        // Seagull flees if it gets close to being defeated.
        if (mode === 'prepare' && enemy.life <= 1000) {
            state = {...state, world: {...state.world, lifebars: {}}};
            return removeEnemy(state, enemy);
        }
        if (mode ==='dive') {
            if (modeTime === FRAME_LENGTH) {
                state = {...state, sfx: {...state.sfx, 'seagullScreech': true}};
            }
        } else if (mode === 'flap') {
            const dx = vx < 0 ? -1 : 1;
            let xScale = -dx;
            const gustX = drawBox.left + (0.5 + dx / 2) * drawBox.width;
            if (modeTime === FRAME_LENGTH * this.flapAnimation.frameDuration * 2) {
                let gust = createEffect(EFFECT_GUST, {top: drawBox.top + 100, left: gustX - dx * 320, vx: dx * 15, xScale});
                gust.left -= (0.5 - dx / 2) * gust.width;
                state = addEffectToState(state, gust);
                gust = createEffect(EFFECT_GUST, {top: drawBox.top + 200, left: gustX - dx * 420, vx: dx * 15, xScale});
                gust.left -= (0.5 - dx / 2) * gust.width;
                state = addEffectToState(state, gust);
                state = {...state, sfx: {...state.sfx, 'seagullScreech': true}};
            } else if (modeTime === FRAME_LENGTH * this.flapAnimation.frameDuration * 5) {
                // Add feather attack here.
                let scaleX = dx * -2;
                let scaleY = 2;
                let feather = createAttack(ATTACK_FEATHER, {left: gustX - dx * 250, top: drawBox.top + 100, scaleX, scaleY});
                feather.left -= (0.5 - dx / 2) * feather.width;
                feather.top -= feather.height / 2;
                feather.vx = 15 * dx;
                feather.vy = 5;
                state = addEnemyAttackToState(state, feather);
                feather = createAttack(ATTACK_FEATHER, {left: gustX - dx * 200, top: drawBox.top + 200, scaleX, scaleY});
                feather.left -= (0.5 - dx / 2) * feather.width;
                feather.top -= feather.height / 2;
                feather.vx = 10 * dx;
                feather.vy = 10;
                state = addEnemyAttackToState(state, feather);
                feather = createAttack(ATTACK_FEATHER, {left: gustX - dx * 300, top: drawBox.top + 200, scaleX, scaleY});
                feather.left -= (0.5 - dx / 2) * feather.width;
                feather.top -= feather.height / 2;
                feather.vx = 5 * dx;
                feather.vy = 15;
                state = addEnemyAttackToState(state, feather);
            } else if (modeTime === FRAME_LENGTH * this.flapAnimation.frameDuration * 6) {
                let gust = createEffect(EFFECT_GUST, {top: drawBox.top + 125, left: gustX - dx * 320, vx: dx * 25, xScale});
                gust.left -= (0.5 - dx / 2) * gust.width;
                state = addEffectToState(state, gust);
                gust = createEffect(EFFECT_GUST, {top: drawBox.top + 275, left: gustX - dx * 360, vx: dx * 25, xScale});
                gust.left -= (0.5 - dx / 2) * gust.width;
                state = addEffectToState(state, gust);
            }
        }
        return state;
    },
    accelerate(state, enemy) {
        let {vx, vy, targetX, targetY, mode, modeTime, top, left, animationTime} = enemy;
        const drawBox = getEnemyDrawBox(state, enemy);
        const heroHitBox = getHeroHitBox(state.players[0]);
        if (mode === 'prepare') {
            const prepTime = state.world.type === WORLD_BEACH ? 10000 : 1000;
            if (modeTime === 1000) {
                mode = 'attack';
                modeTime = 0;
            }
        } else if (mode === 'approach') {
            if (
                (vx < 0 && drawBox.left + drawBox.width < WIDTH + 100) ||
                (vx > 0 && drawBox.left > -100)
            ) {
                vy = 0;
                vx *= 0.01;
                mode = 'flap';
                modeTime = 0;
                animationTime = 0;
            }
        } else if (mode === 'flap') {
            const dx = vx < 0 ? -1 : 1;
            if (modeTime === FRAME_LENGTH * this.flapAnimation.frameDuration * this.flapAnimation.frames.length) {
                mode = 'glide';
                modeTime = 0;
                vx = dx * enemy.speed;
            }
        } else if (mode === 'attack') {
            if (state.world.time > 5000 && random.chance(0.3)) {
                vx = (left > WIDTH / 2) ? -enemy.speed : enemy.speed;
                const dx = vx < 0 ? -1 : 1;
                vy = enemy.speed / 2;
                top = -400;
                const factor = (GAME_HEIGHT * random.range(1, 2) / 6 - (drawBox.height / 2 - 400)) / vy;
                left = (2 - dx) * WIDTH / 4 - factor * vx - drawBox.width / 2;
                mode = 'approach';
                modeTime = 0;
            } else if (!state.world.ground && state.world.time > 10000 && random.chance(0.3)) {
                vx = (left > WIDTH / 2) ? -enemy.speed : enemy.speed;
                vy = 1.5 * enemy.speed;
                top = -800;
                const factor = (heroHitBox.top + heroHitBox.height / 2 - (drawBox.height / 2 - 800)) / vy;
                left = heroHitBox.left + heroHitBox.width / 2 - factor * vx - drawBox.width / 2;
                mode = 'dive';
                modeTime = 0;
            } else {
                vx = (left > WIDTH / 2) ? -enemy.speed : enemy.speed;
                vy = 0;
                top = Math.min(GAME_HEIGHT * 1 / 3, heroHitBox.top + heroHitBox.height / 2 - 350);
                left = (vx > 0) ? -200 - drawBox.width : WIDTH + 200;
                mode = 'glide';
                modeTime = 0;
            }
        } else if (mode === 'glide') {
            vy = ((left + drawBox.width / 2 - WIDTH / 2) * vx < 0) ? 4 : -3;
            if ((vx > 0 && left > WIDTH + 200) || (vx < 0 && left + drawBox.width < -200)) {
                //console.log(enemy.left + drawBox.width, enemy.left - WIDTH);
                mode = 'prepare';
                modeTime = 0;
            }
        } else if (mode === 'dive') {
            if (top > GAME_HEIGHT) {
                mode = 'prepare';
                modeTime = 0;
            }
        } else if (mode === 'falling') {
            vy++;
            if (modeTime > 2000) {
                mode = 'prepare';
                modeTime = 0;
            }
        }
        modeTime += FRAME_LENGTH;
        return {...enemy, targetX, targetY, vx, vy, mode, modeTime, top, left, animationTime};
    },
    drawOver(context, state, enemy) {
        if (!state.world.ground) return;

    },
    props: {
        life: 10000,
        speed: 16,
        weakness: {[ATTACK_LIGHTNING_BOLT]: 1000},
        boss: true,
        permanent: true,
        mode: 'attack',
        flipped: true,
    },
};

const { getHeroHitBox } = require('heroes');
const { EFFECT_GUST, ENEMY_BLUE_BIRD, ENEMY_BLUE_BIRD_SOLDIER } = require('areas/sky');
const { CHECK_POINT_BEACH_START, WORLD_BEACH, getBeachWorld } = require('areas/beach');
const { createEffect, addEffectToState } = require('effects');
const { attacks, createAttack, addEnemyAttackToState } = require('attacks');
const ATTACK_FEATHER = 'feather';

attacks[ATTACK_FEATHER] = {
    animation: createAnimation('gfx/enemies/birds/feather.png', r(50, 47)),
    props: {
        sfx: 'sfx/throwhit.mp3',
    },
};

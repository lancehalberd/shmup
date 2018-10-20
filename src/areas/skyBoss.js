
const {
    FRAME_LENGTH, HEIGHT, WIDTH,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r, getFrame, requireImage, getHitBox } = require('animations');
const { allWorlds, getNewLayer } = require('world');

const WORLD_SKY_BOSS = 'skyBoss';
const BOSS_DURATION = 80000;

function transitionToSkyBoss(state) {
    const world = {
        ...state.world,
        type: WORLD_SKY_BOSS,
        // Remove the moon layer.
        mgLayerNames: ['background', 'clouds', 'fastClouds'],
        // Set the next background image to the sunrise graphics
        background: getNewLayer({
            xFactor: 0.1, yFactor: 0.5, yOffset: 0, maxY: 0,
            spriteData: {
                sky: {animation: createAnimation('gfx/scene/sky/sky.png', r(400, 400)), scale: 2},
            },
        }),
        time: 0,
        targetFrames: 50 * 5,
    };
    return {...state, world};
}
allWorlds[WORLD_SKY_BOSS] = {
    advanceWorld: (state) => {
        let world = state.world;
        // For now just set the targetFrame and destination constantly ahead.
        // Later we can change this depending on the scenario.
        let {targetFrames, targetX, targetY} = world;
        // 20s before the end of the level raise screen so we can transition to the sunrise graphics
        // during the boss fight.
        if (world.time < BOSS_DURATION - 20000) {
            targetFrames = 70 * 5;
            targetX = Math.max(world.targetX, world.x + 1000);
            targetY = world.y;
        } else if (world.time === BOSS_DURATION - 20000) {
            targetFrames = 20000 / FRAME_LENGTH;
            targetY = 0;
            targetX = world.x + 3000;
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

        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToSkyBoss,
};

const {
    enemyData, createEnemy, addEnemyToState, updateEnemy, getEnemyDrawBox,
    ENEMY_DEMO_EMPRESS,
} = require('enemies');
const { ATTACK_LIGHTNING_BOLT } = require('enemies/beetles');


/*
Seagull Boss - the idea is this happens during transition to day time.
Start the camera high on the night sky background (so there are no tree tops).
The sunset background overtakes the night sky and eventually turns into the 4A backgrounds.
The Seagull is chasing the whole time, sometimes swooping in, flying off screen, dropping feathers,
diving, flapping wind gusts.
There can be some enemies that spawn on the right side of the screen to also shoot at you.
During the last part when on the beach, there are rocks to spawn across the sand ground loop.
*/

const ENEMY_SEAGULL = 'seagull';
const seagullGeometry = r(200, 102,
    {hitBox: {left: 39, top: 63, width: 117, height: 40}, scaleX: 3, scaleY: 3},
);
enemyData[ENEMY_SEAGULL] = {
    animation: createAnimation('gfx/enemies/birds/seagull.png', seagullGeometry, {rows: 4}),
    accelerate: (state, enemy) => {
        let {vx, vy, targetX, targetY, mode, modeTime, top, left} = enemy;
        switch (mode) {
            case 'prepare':
                if (modeTime === 1000) {
                    mode = 'attack';
                    modeTime = 0;
                }
                break;
            case 'attack': {
                vx = (left > WIDTH) ? -enemy.speed : enemy.speed;
                top = state.players[0].sprite.top - 250;
                mode = 'glide';
                modeTime = 0;
                break;
            }
            case 'glide': {
                const drawBox = getEnemyDrawBox(state, enemy);
                vy = ((left + drawBox.width / 2 - WIDTH / 2) * vx < 0) ? 3 : -3;
                if ((vx > 0 && left > WIDTH + 200) || (vx < 0 && left + drawBox.width < -200)) {
                    //console.log(enemy.left + drawBox.width, enemy.left - WIDTH);
                    mode = 'prepare';
                    modeTime = 0;
                    vx = 0;
                }
                break;
            }
        }
        modeTime += FRAME_LENGTH;
        return {...enemy, targetX, targetY, vx, vy, mode, modeTime, top, left};
    },
    props: {
        life: 10000,
        speed: 20,
        weakness: {[ATTACK_LIGHTNING_BOLT]: 1000},
        boss: true,
        permanent: true,
        mode: 'attack',
        flipped: true,
    },
};

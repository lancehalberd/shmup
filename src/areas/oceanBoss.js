
const {
    FRAME_LENGTH, HEIGHT, WIDTH,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r, getFrame, requireImage, getHitBox } = require('animations');
const { allWorlds, getNewLayer } = require('world');

const WORLD_OCEAN_BOSS = 'oceanBoss';
const BOSS_DURATION = 80000;

function transitionToOceanBoss(state) {
    const world = {
        ...state.world,
        type: WORLD_OCEAN_BOSS,
        time: 0,
        targetFrames: 50 * 5,
    };
    return {...state, world};
}
allWorlds[WORLD_OCEAN_BOSS] = {
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
            let newEnemy = createEnemy(ENEMY_SEAGULL, {
                left: WIDTH + 1000,
                top: -100,
            });
            lifebars[newEnemy.id] = {
                left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: world.time,
            };
            state = addEnemyToState(state, newEnemy);
            world = {...world, lifebars, bgm: 'bgm/boss.mp3'};
            state = {...state, bgm: world.bgm};
        }
        const seagull = state.enemies.filter(enemy => enemy.type === ENEMY_SEAGULL)[0];
        if (time > 500 && !seagull) {
            return transitionToCastle(state);
        }

        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToOceanBoss,
};
const { transitionToCastle } = require('areas/oceanToCastle');

const { enemyData, createEnemy, addEnemyToState, updateEnemy } = require('enemies');
const { ATTACK_LIGHTNING_BOLT } = require('enemies/beetles');

const ENEMY_SEAGULL = 'seagull';
const seagullGeometry = r(200, 102,
    {hitBox: {left: 39, top: 63, width: 117, height: 40}},
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
                top = state.players[0].sprite.top - 150;
                mode = 'glide';
                modeTime = 0;
                break;
            }
            case 'glide':
                vy = ((left + enemy.width / 2 - WIDTH / 2) * vx < 0) ? 3 : -3;
                if ((vx > 0 && left > WIDTH + 200) || (vx < 0 && left + enemy.width < -200)) {
                    mode = 'prepare';
                    modeTime = 0;
                    vx = 0;
                }
                break;
        }
        modeTime += FRAME_LENGTH;
        return {...enemy, targetX, targetY, vx, vy, mode, modeTime, top, left};
    },
    props: {
        life: 10000,
        speed: 15,
        weakness: {[ATTACK_LIGHTNING_BOLT]: 1000},
        boss: true,
        permanent: true,
        mode: 'attack',
        flipped: true,
    },
};

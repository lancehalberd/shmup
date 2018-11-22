
const {
    FRAME_LENGTH, HEIGHT, WIDTH,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r, getFrame, requireImage, getHitBox } = require('animations');
const { allWorlds, getNewLayer } = require('world');

const WORLD_SEWER_BOSS = 'sewerBoss';
const BOSS_DURATION = 80000;

function transitionToSewerBoss(state) {
    const world = {
        ...state.world,
        type: WORLD_SEWER_BOSS,
        time: 0,
        targetFrames: 50 * 5,
    };
    return {...state, world};
}
allWorlds[WORLD_SEWER_BOSS] = {
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
            lifebars[newEnemy.id] = {
                left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: world.time,
            };
            state = addEnemyToState(state, newEnemy);
            world = {...world, lifebars, bgm: 'bgm/boss.mp3'};
            state = {...state, bgm: world.bgm};
        }
        const seagull = state.enemies.filter(enemy => enemy.type === ENEMY_SEAGULL)[0];
        if (time > 500 && !seagull) {
            return transitionToZoo(state);
        }

        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToSewerBoss,
};
const { transitionToZoo } = require('areas/sewerToZoo');

const { enemyData, createEnemy, addEnemyToState, updateEnemy } = require('enemies');
const { ATTACK_LIGHTNING_BOLT } = require('enemies/beetles');
/*
Here is the snake boss! There are some lines I'll probably fix up in the future, but the shape is all
the same. I put the whole snake in a sheet, but the sizes of each part is different.
There also is a new sewer background - to switch between the two. The only difference is the lack of
 the hole on the first one, and the second is sort of an interlude to stick between them here and
 there. I think I'll make more sewer background assets once we get there and see the water in effect,
 as I am not sure what can be put in the background (or foreground) without getting in the way just yet.

The snake boss has multiple attacks:
1. Rats. Rats climb up and down and slightly to the right on the screen. Unlike how they act in the
rest of the sewer, these rats rarely (or never) attack the Knight, but still deal contact damage,
making it harder to hug the left side of the screen where they are spawning in.

2. Biting. The snake can bite high and low, and when doing so, attacks nearly half the upper or lower
art of the screen. If the snake hits a rat this way, I figure the rat can die and the snake gets some
ife back.

3. Tail. The tail is really long, but I figure it actually stays pretty flush with the snake's face
usually, but can extend out toward the knight now and again. Eventually, it returns back to being
flush with the snake's head and hits the water, which erupts in a sort of wave across the screen,
overlaying a new top water sprite and making the bottom half of the boss arena deadly.

*/
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

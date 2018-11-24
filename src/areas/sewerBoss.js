
const {
    FRAME_LENGTH, HEIGHT, WIDTH,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r, getFrame, requireImage, getHitBox } = require('animations');
const { allWorlds, getNewLayer } = require('world');

const WORLD_SEWER_BOSS = 'sewerBoss';
const BOSS_DURATION = 80000;

const bossBackground = createAnimation('gfx/scene/sewer/snekback.png', r(400, 500));
function transitionToSewerBoss(state) {
    const world = {
        ...state.world,
        type: WORLD_SEWER_BOSS,
        time: 0,
        targetFrames: 50 * 5,
        bgm: 'bgm/boss.mp3',
        background: {
            ...state.world.background,
            sprites: state.world.background.sprites.filter(s => s.left <= WIDTH),
            firstElements: false,
            spriteData: {
                sewerSnake: {animation: bossBackground, scale: 2, next: false},
            },
        },
    };
    // The snake background will shortly be added right after the current last background sprite.
    // Since the snake background is the width of the screen, the new target x is the right edge
    // of this last sprite.
    const lastBackgroundSprite = world.background.sprites.slice(-1)[0];
    // It is safe to edit world in place here since we just created the object above.
    world.targetX = world.x + lastBackgroundSprite.left + lastBackgroundSprite.width;
    world.targetY = 150;
    return {...state, world};
}
allWorlds[WORLD_SEWER_BOSS] = {
    advanceWorld: (state) => {
        if (state.world.time === 500) {
            state = spawnBoss(state);
        }
        state = checkIfBossDefeated(state);
        state = {
            ...state,
            world: {
                ...state.world,
                targetFrames: state.world.targetFrames + 0.5,
                time: state.world.time + FRAME_LENGTH,
            }
        };
        return state;
    },
};
function spawnBoss(state) {
    const snakeBackground = state.world.background.sprites.slice(-1)[0];
    const snake = createEnemy(state, ENEMY_SNAKE, {top: snakeBackground.top + 322, left: snakeBackground.left + 360});
    state = addEnemyToState(state, snake);
    const lifebars = {};
    lifebars[snake.id] = {
        left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: state.world.time,
    };
    return {...state,
        bgm: 'bgm/boss.mp3',
        world: {...state.world, lifebars, bgm: 'bgm/boss.mp3'}
    };
}
function checkIfBossDefeated(state) {
    const snake = state.enemies.filter(enemy => enemy.type === ENEMY_SNAKE)[0];
    if (state.world.time > 500 && !snake) {
        return transitionToCircus(state);
    }
    return state
}

module.exports = {
    transitionToSewerBoss,
};
const { transitionToCircus } = require('areas/sewerToCircus');

const { enemyData, createEnemy, addEnemyToState, updateEnemy } = require('enemies');
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


Add Snake Boss
The snake has the ability to eat rats that are moving from left to right on the screen to regain health
The snake can also hit the ground with their tail, causing a wave of water to go across the bottom half of the screen
The snake can bite both high and low, as well as stab forward with their tail

*/
function snakeAnimation(frames, hitBoxes) {
    return {
        frames: frames.map(frame => {
            const bodyBox = new Rectangle(snakeHitBox).moveTo(
                frame.width - snakeHitBox.width,
                frame.height - snakeHitBox.height,
            );
            return {
                ...frame,
                hitBoxes: [
                    ...hitBoxes,
                    ...snakeBodyHitBoxes.map(hitBox => new Rectangle(hitBox).translate(bodyBox.left, bodyBox.top))
                ],
                hitBox: bodyBox,
            }
        }),
        frameDuration: 12,
    }
}
const ENEMY_SNAKE = 'snake';
// Sheet with all snake graphics in it.
const snakeSheet = {image: requireImage('gfx/enemies/snake/snakesheet.png'), scaleX: 2, scaleY: 2};
// HitBox shared by all snake body frames to align them correctly. The left/top need to be set
// so that this box is always touching the bottom right edges of the snake body.
const snakeHitBox = {width: 100, height: 150};
// These should be set to be relative to the snakeHitBox for each frame.
const snakeBodyHitBoxes = [
    {left: 49, top: 24, width: 20, height: 55},
    {left: 11, top: 70, width: 30, height: 55},
    {left: 40, top: 118, width: 60, height: 30},
];
const snakeDeathFrame = {...snakeSheet, left: 0, top: 0, width: 123, height: 150};
const snakeHurtFrame = {...snakeSheet, left: 266, top: 0, width: 174, height: 213};

const snakeOpenMouthFrame1 = {...snakeSheet, left: 0, top: 291, width: 191, height: 181};
const snakeOpenMouthFrame2 = {...snakeSheet, left: 191, top: 291, width: 191, height: 181};

const snakeNormalFrame = {...snakeSheet, left: 0, top: 472, width: 198, height: 167};
const snakeTongueFrame1 = {...snakeSheet, left: 198, top: 472, width: 207, height: 167};
const snakeTongueFrame2 = {...snakeSheet, left: 0, top: 639, width: 222, height: 167};
const snakeTongueFrame3 = {...snakeSheet, left: 222, top: 639, width: 224, height: 167};
const snakeNormalHitBoxes = [
    {left: 0, top: 62, width: 70, height: 10},
    {left: 31, top: 42, width: 60, height: 20},
    {left: 86, top: 25, width: 35, height: 15},
    {left: 112, top: 4, width: 40, height: 20},
];

const snakeBiteLowFrame1 = {...snakeSheet, left: 0, top: 806, width: 354, height: 165};
const snakeBiteLowFrame2 = {...snakeSheet, left: 0, top: 971, width: 357, height: 153};
const snakeBiteLowFrame3 = {...snakeSheet, left: 0, top: 1124, width: 357, height: 153};
const snakeBiteLowFrame4 = {...snakeSheet, left: 0, top: 1277, width: 357, height: 153};
const snakeBiteLowHitBoxes = [
    {left: 12, top: 85, width: 30, height: 15},
    {left: 28, top: 67, width: 45, height: 15},
    {left: 69, top: 51, width: 60, height: 15},
    {left: 131, top: 34, width: 60, height: 15},
    {left: 195, top: 18, width: 60, height: 15},
    {left: 231, top: 11, width: 75, height: 10},
    {left: 307, top: 2, width: 20, height: 20},
];

const snakeBiteHighFrame1 = {...snakeSheet, left: 0, top: 1430, width: 363, height: 177};
const snakeBiteHighFrame2 = {...snakeSheet, left: 0, top: 1607, width: 363, height: 177};
const snakeBiteHighFrame3 = {...snakeSheet, left: 0, top: 1784, width: 364, height: 178};

enemyData[ENEMY_SNAKE] = {
    animation: snakeAnimation(
        [snakeNormalFrame, snakeTongueFrame1, snakeTongueFrame2, snakeTongueFrame3, snakeTongueFrame2, snakeTongueFrame1],
        snakeNormalHitBoxes,
    ),
    accelerate: (state, enemy) => {
        return enemy;
    },
    props: {
        life: 10000,
        hanging: true,
        vx: 0, vy: 0,
        boss: true,
        permanent: true,
        mode: 'attack',
        doNotFlip: true,
    },
};

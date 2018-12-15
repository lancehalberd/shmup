
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
        state = checkToSpawnRats(state);
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
    const snake = createEnemy(state, ENEMY_SNAKE, {
        top: snakeBackground.top + 231, left: snakeBackground.left + 350
    });
    state = addEnemyToState(state, snake);
    const snakeTail = createEnemy(state, ENEMY_SNAKE_TAIL, {
        top: snakeBackground.top + 650, left: snakeBackground.left + 34
    });
    state = addEnemyToState(state, snakeTail);
    const lifebars = {};
    lifebars[snake.id] = {
        left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: state.world.time,
    };
    return {...state,
        bgm: 'bgm/boss.mp3',
        world: {...state.world, lifebars, bgm: 'bgm/boss.mp3'}
    };
}
function checkToSpawnRats(state) {
    if (state.world.time < 10000 || state.world.time % 6000) return state;
    const rats = state.enemies.filter(enemy => enemy.type === ENEMY_RAT);
    if (rats.length >= 3) return state;
    const rat = createEnemy(state, ENEMY_RAT, {
        passive: true,
        top: -100,
        direction: 'down',
        left: -15,
    });
    // Increase left position until an empty column is found.
    while (rats.some(oldRat => oldRat.left === rat.left)) rat.left += 50;
    return addEnemyToState(state, rat);
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
const { ENEMY_RAT } = require('areas/sewer');

const { enemyData, createEnemy, addEnemyToState, updateEnemy,
    isIntersectingEnemyHitBoxes, getEnemyHitBox, removeEnemy,
    damageEnemy,
} = require('enemies');
const { getHeroHitBox } = require('heroes');
/*

1. Rats. Rats climb up and down and slightly to the right on the screen. Unlike how they act in the
rest of the sewer, these rats rarely (or never) attack the Knight, but still deal contact damage,
making it harder to hug the left side of the screen where they are spawning in.

3. Tail. The tail is really long, but I figure it actually stays pretty flush with the snake's face
usually, but can extend out toward the knight now and again. Eventually, it returns back to being
flush with the snake's head and hits the water, which erupts in a sort of wave across the screen,
overlaying a new top water sprite and making the bottom half of the boss arena deadly.


Add Snake Boss
The snake has the ability to eat rats that are moving from left to right on the screen to regain health
The snake can also hit the ground with their tail, causing a wave of water to go across the bottom half of the screen
The snake can stab forward with their tail

*/

const ENEMY_SNAKE = 'snake';
const snakeBodyHitBoxes = [
    {left: 173, top: 70, width: 20, height: 71},
    {left: 135, top: 131, width: 30, height: 55},
    {left: 164, top: 179, width: 60, height: 30},
];

const snakeNormalGeometry = r(224, 213, {
    scaleX: 2, scaleY: 2,
    hitBoxes: [
        ...snakeBodyHitBoxes,
        {left: 25, top: 110, width: 70, height: 10},
        {left: 62, top: 87, width: 60, height: 20},
        {left: 117, top: 70, width: 35, height: 15},
        {left: 143, top: 49, width: 40, height: 20},
    ]
});
const snakeHissGeometry = r(224, 213, {
    scaleX: 2, scaleY: 2,
    hitBoxes: [
        ...snakeBodyHitBoxes,
        {left: 54, top: 77, width: 25, height: 15},
        {left: 35, top: 63, width: 70, height: 15},
        {left: 67, top: 45, width: 105, height: 18},
        {left: 110, top: 33, width: 50, height: 15},
    ]
});
const snakeHurtGeometry = r(224, 213, {
    scaleX: 2, scaleY: 2,
    hitBoxes: [
        ...snakeBodyHitBoxes,
        {left: 55, top: 0, width: 30, height: 47},
        {left: 85, top: 22, width: 25, height: 30},
        {left: 117, top: 70, width: 35, height: 15},
        {left: 143, top: 49, width: 40, height: 20},
    ]
});

const biteBodyHitBoxes = snakeBodyHitBoxes.map(hitBox => {
    return {...hitBox, left: hitBox.left + 140, top: hitBox.top - 35}
});
const snakeBiteLowGeometry = r(364, 178, {
    scaleX: 2, scaleY: 2,
    hitBoxes: [
        ...biteBodyHitBoxes,
        {left: 8, top: 115, width: 50, height: 8},
        {left: 33, top: 93, width: 45, height: 20},
        {left: 70, top: 77, width: 60, height: 15},
        {left: 130, top: 61, width: 60, height: 15},
        {left: 190, top: 45, width: 60, height: 15},
        {left: 255, top: 33, width: 80, height: 15},
    ]
});
const snakeBiteHighGeometry = r(364, 178, {
    scaleX: 2, scaleY: 2,
    hitBoxes: [
        ...biteBodyHitBoxes,
        {left: 6, top: 16, width: 65, height: 20},
        {left: 40, top: 2, width: 100, height: 30},
        {left: 155, top: 5, width: 90, height: 30},
        {left: 257, top: 15, width: 80, height: 25},
    ]
});

enemyData[ENEMY_SNAKE] = {
    animation: createAnimation('gfx/enemies/snake/base.png', snakeNormalGeometry,
        {x: 2, cols: 4, frameMap: [0, 0, 0, 0, 0, 1, 2, 3, 2, 1]}
    ),
    hissAnimation: createAnimation('gfx/enemies/snake/base.png', snakeHissGeometry,
        {x: 6, cols: 3}, {loop: false},
    ),
    hurtAnimation: createAnimation('gfx/enemies/snake/base.png', snakeHurtGeometry),
    deathAnimation: createAnimation('gfx/enemies/snake/base.png', snakeNormalGeometry, {x: 1}),
    biteHighAnimation: createAnimation('gfx/enemies/snake/bite.png', snakeBiteHighGeometry,
        {y: 4, rows: 3, frameMap: [0, 1, 2, 2, 2, 0], loop: false}
    ),
    biteLowAnimation: createAnimation('gfx/enemies/snake/bite.png', snakeBiteLowGeometry,
        {rows: 4, frameMap: [0, 1, 2, 3, 3, 3, 0], loop: false}
    ),
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.mode === 'hiss') return this.hissAnimation;
        if (enemy.mode === 'biteHigh') return this.biteHighAnimation;
        if (enemy.mode === 'biteLow') return this.biteLowAnimation;
        return this.animation;
    },
    bite(state, enemy) {
        // Reposition for the bite animation, which is much wider than the normal animation.
        state = updateEnemy(state, enemy, {left: enemy.left - 2 * 140, top: enemy.top + 2 * 35});
        enemy = state.idMap[enemy.id];
        const hitBox = getHeroHitBox(state.players[0]);
        if (hitBox.top + hitBox.height / 2 <= 150) return this.setMode(state, enemy, 'biteHigh');
        return this.setMode(state, enemy, 'biteLow');
    },
    updateState(state, enemy) {
        if (enemy.dead) return state;
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.mode === 'bide') {
            if (enemy.modeTime >= 5000) {
                state = this.setMode(state, enemy, 'hiss');
            }
        } else if (enemy.mode === 'hiss') {
            if (enemy.modeTime >= 1000) {
                state = this.bite(state, enemy);
            }
        }if (enemy.mode === 'biteHigh' || enemy.mode === 'biteLow') {
            const animation = this.getAnimation(state, enemy);
            if (enemy.modeTime === animation.frameDuration * FRAME_LENGTH / 2) {
                // Sort rats right to left so that it will eat the one closest to it if there are two in range.
                const rats = state.enemies.filter(enemy => enemy.type === ENEMY_RAT).sort((A, B) => B.left - A.left);
                for (const rat of rats) {
                    if (isIntersectingEnemyHitBoxes(state, enemy, getEnemyHitBox(state, rat))) {
                        state = removeEnemy(state, rat);
                        state = updateEnemy(state, enemy, {life: Math.min(enemy.maxLife, enemy.life + enemy.maxLife / 10)});
                        enemy = state.idMap[enemy.id];
                        break;
                    }
                }
            }
            if (enemy.modeTime >= animation.frameDuration * animation.frames.length * FRAME_LENGTH) {
                // Reposition for the non bite animation.
                state = updateEnemy(state, enemy, {left: enemy.left + 2 * 140, top: enemy.top - 2 * 35});
                enemy = state.idMap[enemy.id];
                state = this.setMode(state, enemy, 'bide');
            }
        }
        return state;
    },
    setMode(state, enemy, mode) {
        return updateEnemy(state, enemy, {mode, modeTime: 0, animationTime: 0});
    },
    props: {
        life: 500,
        enrageAt: 400,
        hanging: true,
        vx: 0, vy: 0,
        boss: true,
        permanent: true,
        mode: 'bide',
        modeTime: 0,
        doNotFlip: true,
    },
};


const snakeTailGeometry = r(382, 218, {
    scaleX: 2,
    scaleY: 2,
});
const snakeTailAnimation = createAnimation('gfx/enemies/snake/snaketail.png', snakeTailGeometry, {cols: 2, duration: 12});
snakeTailAnimation.frames[0].hitBoxes = [
    {"left":305,"top":166,"width":75,"height":22},
    {"left":227,"top":164,"width":79,"height":9},
    {"left":220,"top":142,"width":14,"height":21},
    {"left":211,"top":114,"width":9,"height":28},
    {"left":207,"top":80,"width":10,"height":34},
    {"left":215,"width":8,"top":55,"height":24},
    {"left":225,"width":6,"top":32,"height":23},
    {"left":232,"width":7,"top":21,"height":12},
    {"left":247,"width":5,"top":11,"height":5},
    {"left":241,"width":4,"top":16,"height":5},
];
snakeTailAnimation.frames[1].hitBoxes = [
    {"left":305,"top":166,"width":75,"height":22},
    {"left":227,"top":164,"width":79,"height":9},
    {"left":220,"top":142,"width":14,"height":21},
    {"left":211,"top":114,"width":9,"height":28},
    {"left":207,"top":80,"width":10,"height":34},
    {"left":215,"width":8,"top":55,"height":24},
    {"left":222,"width":6,"top":32,"height":23},
    {"left":229,"width":7,"top":20,"height":12},
    {"left":241,"width":5,"top":9,"height":5},
    {"left":237,"width":4,"top":16,"height":5},
];

const snakeTailSlamGeometry = r(382, 218, {
    scaleX: 2,
    scaleY: 2,
    hitBoxes: [
        {left: 206, top: 35, width: 80, height: 30},
        {left: 293, top: 40, width: 50, height: 15},
        {left: 357, top: 33, width: 24, height: 13},
    ]
});
const stabAnimation = createAnimation('gfx/enemies/snake/tailhit.png', snakeTailGeometry, {x: 2, cols: 2});
stabAnimation.frames[0].hitBoxes = [
    {left: 3, top: 36, width: 380, height: 10},
    {left: 225, top: 23, width: 157, height: 10},
];
stabAnimation.frames[1].hitBoxes = [
    {left: 5, top: 20, width: 375, height: 10},
    {left: 242, top: 37, width: 140, height: 10},
];

const ENEMY_SNAKE_TAIL = 'snakeTail';
enemyData[ENEMY_SNAKE_TAIL] = {
    animation: snakeTailAnimation,
    slamAnimation: createAnimation('gfx/enemies/snake/snaketail.png', snakeTailSlamGeometry, {x: 1, frameDuration: 20}),
    stabAnimation,
    getAnimation(state, enemy) {
        if (enemy.dead) return this.animation;
        if (enemy.mode === 'slam') return this.slamAnimation;
        if (enemy.mode === 'stab') return this.stabAnimation;
        return this.animation;
    },
    updateState(state, enemy) {
        if (enemy.dead) return state;
        state = updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
        enemy = state.idMap[enemy.id];
        if (enemy.mode === 'normal') {
            if (enemy.modeTime >= 2000) {
                return this.setMode(state, enemy, random.element(['slam', 'stab']));
            }
        } else  if (enemy.mode === 'slam') {
            if (enemy.modeTime >= this.slamAnimation.frameDuration * this.slamAnimation.frames.length * FRAME_LENGTH) {
                return this.setMode(state, enemy, 'normal');
            }
        } else if (enemy.mode === 'stab') {
            if (enemy.modeTime >= 1000) {
                return this.setMode(state, enemy, 'normal');
            }
        }
        return state;
    },
    setMode(state, enemy, mode) {
        return updateEnemy(state, enemy, {mode, modeTime: 0, animationTime: 0});
    },
    onDamageEffect(state, enemy, attack) {
        const snake = state.enemies.filter(enemy => enemy.type === ENEMY_SNAKE)[0];
        state = damageEnemy(state, snake.id, {playerIndex: 0, damage: attack.damage});
        // The tail never takes damage. Alternatively, we could make it defeatable and have it
        // respawn after a while or when the snake enrages.
        state = updateEnemy(state, enemy, {life: enemy.maxLife});
        return state;
    },
    props: {
        life: 10000,
        mode: 'normal',
        modeTime: 0,
        doNotFlip: true,
        hanging: true,
        vx: 0, vy: 0,
        boss: true,
        permanent: true,
    }
}
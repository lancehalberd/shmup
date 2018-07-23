
const {
    FRAME_LENGTH, WIDTH, HEIGHT, GAME_HEIGHT,
    EFFECT_EXPLOSION,
} = require('gameConstants');
const random = require('random');
const { drawImage } = require('draw');
const { createAnimation, r, getFrame, requireImage } = require('animations');
const { getNewSpriteState } = require('sprites');
const { allWorlds, getHazardHeight, getGroundHeight, getNewLayer } = require('world');
const { enterStarWorldEnd } = require('areas/stars');

const WORLD_FOREST_LOWER_BOSS = 'forestLowerBoss';
/*
Add frog boss -
Main Phase can be made harder with adding flying ants.
Make tongue hurt player
Use tongue graphics

After the frog loses 40% health or 30 seconds pass:
Move the frog to the water and set mode to water

Spawn water bug enemies that scoot in the water ( no unmounted form)

*/

function transitionToForestLowerBoss(state) {
    const world = {
        ...state.world,
        type: WORLD_FOREST_LOWER_BOSS,
        time: 0,
        targetFrames: 50 * 5,
    };
    return {...state, world};
}


const layerNamesToClear = ['foreground', 'largeTrunks'];
function clearLayers(state) {
    let world = state.world;
    for (const layerName of layerNamesToClear) {
        const sprites = world[layerName].sprites.filter(sprite => sprite.left < WIDTH);
        world = {...world, [layerName]: {...world[layerName], spriteData: false, sprites}};
    }
    return {...state, world};
}

const poolAnimation = createAnimation('gfx/enemies/frog/frogbase_pool.png', r(800, 600));
const waterfallAnimation = {
    frames: [
        {...r(800, 600), image: requireImage('gfx/enemies/frog/frogbase_water1.png')},
        {...r(800, 600), image: requireImage('gfx/enemies/frog/frogbase_water2.png')},
    ],
    frameDuration: 10,
};
allWorlds[WORLD_FOREST_LOWER_BOSS] = {
    advanceWorld: (state) => {
        let world = state.world;
        const pool = state.world.pool && state.world.pool.sprites[0];
        const time = world.time + FRAME_LENGTH;
        if (pool) {
            // Slow the scroll rate as we close in on the pool.
            if (world.targetFrames < 50) {
                world = {...world, targetFrames: world.targetFrames + 0.6};
            }
        } else {
            // Until the pool spawns, the screen scrolls to the right at a constant speed.
            const targetFrames = 70 * 5;
            const targetX = Math.max(world.targetX, world.x + 1000);
            const targetY = world.y;
            world = {...world, targetX, targetY, targetFrames};
        }
        world = {...world, time};
        if (time === 500) {
            const lifebars = {};
            let frog = createEnemy(ENEMY_FROG, {left: WIDTH});
            const hitBox = getEnemyHitBox(frog).translate(-frog.left, -frog.top);
            frog.top = getGroundHeight(state) - (hitBox.top + hitBox.height);
            lifebars[frog.id] = {
                left: 100, top: 40, width: 600, height: 8, startTime: world.time,
            };
            world = {...world, lifebars, spawnsDisabled: true};
            // This controls the bgm music for the area (this will start if the player unpauses).
            world.bgm = 'bgm/boss.mp3';
            // This actually starts playing the new bgm music.
            state = {...state, bgm: world.bgm};
            state = addEnemyToState(state, frog);
        }
        // const frog = state.enemies.filter(enemy => enemy.type === ENEMY_FROG)[0];
        if (startPoolPhase(state) && !pool) {
            world = {...world,
                pool: getNewLayer({
                    xFactor: 1, yFactor: 1,
                    spriteData: {},
                }),
                mgLayerNames: [...world.mgLayerNames, 'pool'],
            };
            world.pool.sprites = [
                getNewSpriteState({
                    ...poolAnimation.frames[0],
                    top: -36,
                    left: 2 * WIDTH,
                    animation: poolAnimation,
                }),
                getNewSpriteState({
                    ...waterfallAnimation.frames[0],
                    top: -36,
                    left: 2 * WIDTH,
                    animation: waterfallAnimation,
                }),
            ];
            world.targetFrames = 400;
            world.targetX = world.x + 2 * WIDTH;
            world.bgm = 'bgm/boss.mp3';
            state = {...state, bgm: world.bgm, world};
            state = clearLayers(state);
            world = state.world;
        }
        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToForestLowerBoss,
};

const {
    enemyData, createEnemy, addEnemyToState, damageEnemy,
    getEnemyHitBox, getEnemyCenter,
} = require('enemies');
const {
    getHeroCenter,
} = require('heroes');

function startPoolPhase(state) {
    if (state.world.time >= 30000) return true;
    const frog = state.enemies.filter(enemy => enemy.type === ENEMY_FROG)[0];
    return frog && frog.life <= frog.lowLife;
}
const ENEMY_FROG = 'frog';
const frogRect = r(250, 220, {hitBox: {left: 30, top: 45, width:200, height: 105}});
const swimmingFrogRect = r(251, 113);
const offscreenHitBox = {left: 0, top: 1000, width: 1, height: 1};
enemyData[ENEMY_FROG] = {
    animation: createAnimation('gfx/enemies/frog/frog15.png', frogRect),
    attackAnimation: createAnimation('gfx/enemies/frog/frog16.png', frogRect),
    crouchingAnimation: createAnimation('gfx/enemies/frog/frog17.png', frogRect),
    submergedAnimation: {
        frames: [
            {...swimmingFrogRect, hitBox: offscreenHitBox, image: requireImage('gfx/enemies/frog/frog9.png')},
            {...swimmingFrogRect, hitBox: offscreenHitBox, image: requireImage('gfx/enemies/frog/frog11.png')},
            {...swimmingFrogRect, hitBox: offscreenHitBox, image: requireImage('gfx/enemies/frog/frog12.png')},
            {...swimmingFrogRect, hitBox: offscreenHitBox, image: requireImage('gfx/enemies/frog/frog13.png')},
        ],
        frameDuration: 10,
    },
    jumpingAnimation: {
        frames: [
            {...frogRect, image: requireImage('gfx/enemies/frog/frog18.png')},
            {...frogRect, image: requireImage('gfx/enemies/frog/frog19.png')},
        ],
        frameDuration: 20,
        loop: false,
    },
    getAnimation(enemy) {
        if (enemy.mode === 'submerged') return this.submergedAnimation;
        if (enemy.mode === 'attacking' || enemy.mode === 'retracting') {
            return this.attackAnimation;
        }
        if (enemy.mode === 'crouching') return this.crouchingAnimation;
        return enemy.vy < 0 ? this.jumpingAnimation: this.animation;
    },
    // needs death soundfx
    deathSound: 'sfx/hornetdeath.mp3',
    accelerate: (state, enemy) => {
        let {mode, vx, vy, modeTime, inPond} = enemy;
        let tongues = [...enemy.tongues];
        const poolPhase = startPoolPhase(state);
        const pool = state.world.pool && state.world.pool.sprites[0];
        const playerSprite = state.players[0].sprite;
        modeTime += FRAME_LENGTH;
        const hitBox = getEnemyHitBox(enemy);
        const [targetX, targetY] = getHeroCenter(state.players[0]);
        // This line was used to test the tongue works for erratic targets.
        // Making sure it doesn't bend at awkward angles.
        //const [targetX, targetY] = [random.range(0, 800), random.range(0, 600)];
        window.targetX = targetX;
        window.targetY = targetY;
        function extendTongueTowardsPlayer() {
            const secondLastTongue = tongues[tongues.length - 2];
            const lastTongue = tongues[tongues.length - 1];
            const angle = (
                Math.atan2(lastTongue[1] - secondLastTongue[1], lastTongue[0] - secondLastTongue[0]) + 2 * Math.PI
            ) % (2 * Math.PI);
            let dx = targetX - (enemy.left + lastTongue[0]);
            let dy = targetY - (enemy.top + lastTongue[1]);
            const desiredAngle = (Math.atan2(dy, dx) + 2 * Math.PI) % (2 * Math.PI);
            let chosenAngle = angle;
            if (desiredAngle > angle) {
                if (desiredAngle - angle < Math.PI) {
                    chosenAngle = Math.min(desiredAngle, angle + Math.PI / 12);
                } else {
                    chosenAngle = angle - Math.PI / 12;
                    if (chosenAngle < 0) {
                        chosenAngle += Math.PI * 2;
                        chosenAngle = Math.max(chosenAngle, desiredAngle);
                    }
                }
            } else {
                if (angle - desiredAngle < Math.PI) {
                    chosenAngle = Math.max(desiredAngle, angle - Math.PI / 12);
                } else {
                    chosenAngle = angle + Math.PI / 12;
                    if (chosenAngle > Math.PI * 2) {
                        chosenAngle -= Math.PI * 2;
                        chosenAngle = Math.min(chosenAngle, desiredAngle);
                    }
                }
            }
            //const mag = Math.sqrt(dx * dx + dy * dy);
            tongues.push([
                lastTongue[0] + 50 * Math.cos(chosenAngle),
                lastTongue[1] + 50 * Math.sin(chosenAngle),
            ]);
        }

        const dx = (targetX - getEnemyCenter(enemy)[0]) || 1;
        switch (mode) {
            case 'attacking':
                if (modeTime % 60) break;
                if (tongues.length < 10) {
                    extendTongueTowardsPlayer();
                } else {
                    mode = 'retracting';
                    modeTime = 0;
                }
                break;
            case 'retracting':
                if (modeTime % 40) break;
                tongues.pop();
                if (tongues.length < 3) {
                    tongues = [];
                    mode = 'crouching';
                    modeTime = 0;
                }
                break;
            case 'normal': {
                if (poolPhase) {
                    mode = 'crouching';
                    modeTime = 0;
                    break;
                }
                if (modeTime < 400) break;
                if (hitBox.left >= WIDTH / 2) {
                    mode = 'attacking';
                    modeTime = 0;
                    tongues = [[43, 86], [17, 78]];
                    // Mirror the starting tongue coords if the frogs sprite is flipped (facing right).
                    if (vx > 0) tongues = tongues.map(t => [enemy.width - t[0], t[1]]);
                    extendTongueTowardsPlayer();
                } else {
                    mode = 'crouching';
                    modeTime = 0;
                }
                break;
            }
            case 'crouching': {
                if (modeTime < 500 && !poolPhase) {
                    // Make the frog face the player but not move while crouching.
                    vx = dx * 0.01 / Math.abs(dx);
                } else if (!poolPhase || enemy.left <= WIDTH - 80) {
                    // Jump at the player after 1 second of crouching
                    // The speed is proportional to the distance from the player
                    // in the range [3, 12], and in the direction of the player.
                    vx = Math.max(3, Math.min(Math.abs(dx) / 10, 20)) * dx / Math.abs(dx);
                    // Reduce velocity jumping left, since this is against the movement of
                    // the screen.
                    if (vx < 0) vx *= 0.6;
                    // Keep hopping right once the frog is at low health until it gets to
                    // the pool.
                    if (poolPhase) vx = 10;

                    console.log({targetY, GAME_HEIGHT, vx, poolPhase});
                    if (targetY > 2*GAME_HEIGHT/3 && Math.abs(vx) < 13) {
                        vy = -10;
                    } else if (targetY > GAME_HEIGHT/3 && Math.abs(vx) < 18 && !poolPhase) {
                        vy = -18;
                    } else {
                        vy = -25;
                    }
                    mode = 'jumping';
                    modeTime = 0;
                }
                break;
            }
            case 'jumping': {
                if (hitBox.bottom >= getGroundHeight(state)) {
                    vx = poolPhase ? 0.01 : dx * 0.01 / Math.abs(dx);
                    if (pool && enemy.left >= WIDTH && pool.left <= WIDTH + 100) {
                        enemy = {
                            ...enemy,
                            // We use this to allow the frog to be positioned
                            // below the ground level.
                            stationary: true,
                            left: pool.left + 280 + random.range(0, 20),
                            top: 440,
                        };
                        mode = 'submerged';
                        modeTime = 0;
                    } else {
                        mode = 'normal';
                        modeTime = 0;
                    }
                }
                break;
            }
            case 'submerged': {
                vx = 0;
                break;
            }
        }
        //console.log({mode, tongues});
        return {...enemy, vx, vy, mode, modeTime, tongues, inPond};
    },
    drawOver(context, enemy) {
        if (!enemy || enemy.dead || !enemy.tongues.length) return;
        context.beginPath();
        context.lineWidth = 8;
        context.strokeStyle = 'red';
        context.moveTo(enemy.left + enemy.tongues[0][0], enemy.top + enemy.tongues[0][1]);
        for (let i = 1; i < enemy.tongues.length; i++) {
            context.lineTo(enemy.left + enemy.tongues[i][0], enemy.top + enemy.tongues[i][1]);
        }
        context.stroke();
    },
    props: {
        life: 400,
        lowLife: 240,
        score: 1000,
        boss: true,
        grounded: true,
        mode: 'normal',
        permanent: true,
        modeTime: 0,
        tongues: [],
    },
};

const { effects, createEffect, addEffectToState, updateEffect } = require('effects');



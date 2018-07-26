
const {
    FRAME_LENGTH, WIDTH, HEIGHT, GAME_HEIGHT,
    EFFECT_EXPLOSION,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { drawImage } = require('draw');
const { createAnimation, r, getFrame, requireImage } = require('animations');
const { getNewSpriteState } = require('sprites');
const { allWorlds, getHazardHeight, getGroundHeight, getNewLayer } = require('world');
const { enterStarWorldEnd } = require('areas/stars');

const WORLD_FOREST_LOWER_BOSS = 'forestLowerBoss';
/*
Add frog boss -
Main Phase can be made harder with adding flying ants.

* Spawn water bug enemies that scoot in the water ( no unmounted form)
* Spawn flying ants from the ant hole

Frog: It ribbits here and there and flashes red more often the lower it gets to dying.
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
    getEnemyHitBox, getEnemyCenter, renderEnemyFrame,
} = require('enemies');
const {
    getHeroHitBox,
    damageHero,
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
const swimmingHitBox = {left: 12, top: 17, width: 150, height: 80};
// This image was originally designed to be placed on top of the swimming frog.
// It needs to be moved down about 18 pixels when drawn on the land frog.
const tongueStartAnimation = createAnimation('gfx/enemies/frog/tongue1.png', swimmingFrogRect);
const tongueMiddleAnimation = createAnimation('gfx/enemies/frog/tongue2.png', r(60, 20));
const tongueEndAnimation = createAnimation('gfx/enemies/frog/tongue3.png', r(60, 20));
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
    swimmingAnimation: {
        frames: [
            {...swimmingFrogRect, hitBox: swimmingHitBox, image: requireImage('gfx/enemies/frog/frog3.png')},
            {...swimmingFrogRect, hitBox: swimmingHitBox, image: requireImage('gfx/enemies/frog/frog4.png')},
            {...swimmingFrogRect, hitBox: swimmingHitBox, image: requireImage('gfx/enemies/frog/frog5.png')},
        ],
        frameDuration: 10,
    },
    // This is drawn on top of the swimmingAnimation/swimmingAttackAnimation
    ripplesAnimation: {
        frames: [
            {...swimmingFrogRect, image: requireImage('gfx/enemies/frog/frog1.png')},
            {...swimmingFrogRect, image: requireImage('gfx/enemies/frog/frog2.png')},
        ],
        frameDuration: 10,
    },
    swimmingAttackAnimation: createAnimation('gfx/enemies/frog/frog6.png', {...swimmingFrogRect, hitBox: swimmingHitBox}),
    submergingAnimation: {
        frames: [
            {...swimmingFrogRect, hitBox: swimmingHitBox, image: requireImage('gfx/enemies/frog/frog7.png')},
            {...swimmingFrogRect, hitBox: offscreenHitBox, image: requireImage('gfx/enemies/frog/frog8.png')},
            {...swimmingFrogRect, hitBox: offscreenHitBox, image: requireImage('gfx/enemies/frog/frog9.png')},
        ],
        frameDuration: 10,
        loop: false,
    },
    emergingAnimation: createAnimation('gfx/enemies/frog/frog14.png', {...swimmingFrogRect, hitBox: offscreenHitBox}),
    getAnimation(enemy) {
        if (enemy.mode === 'attacking' || enemy.mode === 'retracting') {
            return this.attackAnimation;
        }
        if (enemy.mode === 'crouching') return this.crouchingAnimation;

        if (enemy.mode === 'swimming') return this.swimmingAnimation;
        if (enemy.mode === 'swimmingAttacking' || enemy.mode === 'swimmingRetracting') {
            return this.swimmingAttackAnimation;
        }
        if (enemy.mode === 'submerging') return this.submergingAnimation;
        if (enemy.mode === 'submerged') return this.submergedAnimation;
        if (enemy.mode === 'emerging') return this.emergingAnimation;
        return enemy.vy < 0 ? this.jumpingAnimation: this.animation;
    },
    // needs death soundfx
    deathSound: 'sfx/hornetdeath.mp3',
    accelerate: (state, enemy) => {
        let {mode, vx, vy, modeTime, inPond, animationTime} = enemy;
        let tongues = [...enemy.tongues];
        const poolPhase = startPoolPhase(state);
        const pool = state.world.pool && state.world.pool.sprites[0];
        const playerSprite = state.players[0].sprite;
        modeTime += FRAME_LENGTH;
        const hitBox = getEnemyHitBox(enemy);
        const heroHitBox = getHeroHitBox(state.players[0]);
        const [targetX, targetY] = heroHitBox.getCenter();
        // This line was used to test the tongue works for erratic targets.
        // Making sure it doesn't bend at awkward angles.
        //const [targetX, targetY] = [random.range(0, 800), random.range(0, 600)];
        window.targetX = targetX;
        window.targetY = targetY;
        function extendTongueTowardsPlayer() {
            const secondLastTongue = tongues[tongues.length - 2];
            const lastTongue = tongues[tongues.length - 1];
            const deltaAngle = Math.max(0, Math.PI / 10 - Math.PI * (tongues.length - 3) / (10 * 7));
            const angle = (
                Math.atan2(lastTongue[1] - secondLastTongue[1], lastTongue[0] - secondLastTongue[0]) + 2 * Math.PI
            ) % (2 * Math.PI);
            let dx = targetX - (enemy.left + lastTongue[0]);
            let dy = targetY - (enemy.top + lastTongue[1]);
            const desiredAngle = (Math.atan2(dy, dx) + 2 * Math.PI) % (2 * Math.PI);
            let chosenAngle = angle;
            if (desiredAngle > angle) {
                if (desiredAngle - angle < Math.PI) {
                    chosenAngle = Math.min(desiredAngle, angle + deltaAngle);
                } else {
                    chosenAngle = angle - deltaAngle;
                    if (chosenAngle < 0) {
                        chosenAngle += Math.PI * 2;
                        chosenAngle = Math.max(chosenAngle, desiredAngle);
                    }
                }
            } else {
                if (angle - desiredAngle < Math.PI) {
                    chosenAngle = Math.max(desiredAngle, angle - deltaAngle);
                } else {
                    chosenAngle = angle + deltaAngle;
                    if (chosenAngle > Math.PI * 2) {
                        chosenAngle -= Math.PI * 2;
                        chosenAngle = Math.min(chosenAngle, desiredAngle);
                    }
                }
            }
            //const mag = Math.sqrt(dx * dx + dy * dy);
            tongues.push([
                lastTongue[0] + 55 * Math.cos(chosenAngle),
                lastTongue[1] + 55 * Math.sin(chosenAngle),
            ]);
        }

        const dx = (targetX - getEnemyCenter(enemy)[0]) || 1;
        switch (mode) {
            case 'attacking':
            case 'swimmingAttacking':
                if (modeTime < 200 || modeTime % 60) break;
                if (!tongues.length) {
                    if (mode === 'swimmingAttacking')
                        tongues = [[43, 66], [10, 66]];
                    else
                        tongues = [[43, 84], [10, 84]];
                    // Mirror the starting tongue coords if the frogs sprite is flipped (facing right).
                    if (vx > 0) tongues = tongues.map(t => [enemy.width - t[0], t[1]]);
                }
                if (tongues.length < 14) {
                    extendTongueTowardsPlayer();
                } else if (mode === 'swimmingAttacking') {
                    mode = 'swimmingRetracting';
                    animationTime = modeTime = 0;
                } else {
                    mode = 'retracting';
                    animationTime = modeTime = 0;
                }
                break;
            case 'retracting':
            case 'swimmingRetracting':
                if (modeTime < 500 || modeTime % 40) break;
                tongues.pop();
                if (tongues.length < 3) {
                    tongues = [];
                    if (mode === 'swimmingRetracting') {
                        mode = 'submerging';
                        animationTime = modeTime = 0;
                    } else {
                        mode = 'crouching';
                        animationTime = modeTime = 0;
                    }
                }
                break;
            case 'normal': {
                if (poolPhase) {
                    mode = 'crouching';
                    animationTime = modeTime = 0;
                    break;
                }
                if (modeTime < 400) break;
                if (hitBox.left >= WIDTH / 2) {
                    mode = 'attacking';
                    animationTime = modeTime = 0;
                } else {
                    mode = 'crouching';
                    animationTime = modeTime = 0;
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

                    if (targetY > 2*GAME_HEIGHT/3 && Math.abs(vx) < 13 && !poolPhase) {
                        vy = -10;
                    } else if (targetY > GAME_HEIGHT/3 && Math.abs(vx) < 18) {
                        vy = -18;
                    } else {
                        vy = -25;
                    }
                    mode = 'jumping';
                    animationTime = modeTime = 0;
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
                            left: pool.left + 480 + random.range(0, 20),
                            top: 440,
                        };
                        mode = 'submerged';
                        animationTime = modeTime = 0;
                        vx = -0.01;
                    } else {
                        mode = 'normal';
                        animationTime = modeTime = 0;
                    }
                }
                break;
            }
            case 'swimming': {
                if (modeTime >= 1000) {
                    mode = 'swimmingAttacking';
                    animationTime = modeTime = 0;
                }
                break;
            }
            case 'submerging':
                if (modeTime >= 400) {
                    mode = 'submerged';
                    animationTime = modeTime = 0;
                }
                break;
            case 'submerged': {
                if (modeTime >= 1000) {
                    mode = 'emerging';
                    animationTime =  modeTime = 0;
                }
                break;
            }
            case 'emerging': {
                if (modeTime >= 200) {
                    mode = 'swimming';
                    animationTime = modeTime = 0;
                }
                break;
            }
        }
        //console.log({mode, tongues});
        return {...enemy, vx, vy, mode, modeTime, animationTime, tongues, inPond};
    },
    // Make the tongue damage the player.
    updateState(state, enemy) {
        let lastPoint;
        const tongues = enemy.tongues;
        const heroHitBox = getHeroHitBox(state.players[0]);
        for (let i = 1; i < tongues.length; i++) {
            let point = {x: enemy.left + tongues[i][0], y: enemy.top + tongues[i][1]};
            if (lastPoint) {
                // This hitbox is a crude estimation for the tongues actual position.
                const L = Math.min(point.x, lastPoint.x), R = Math.max(point.x, lastPoint.x);
                const T = Math.min(point.y, lastPoint.y), B = Math.max(point.y, lastPoint.y);
                const sectionBox = new Rectangle(L, T, R - L, B - T);
                if (sectionBox.overlapsRectangle(heroHitBox)) {
                    return damageHero(state, 0);
                }
            }
            lastPoint = point;
        }
        return state;
    },
    drawOver(context, enemy) {
        if (!enemy || enemy.dead) return;
        if (enemy.mode.includes('swimming')) {
            const frame = getFrame(this.ripplesAnimation, enemy.animationTime);
            // Use render enemy frame to transform the animation to match
            // the position+orientation of the enemy correctly.
            renderEnemyFrame(context, enemy, frame);
        }
        if (!enemy.tongues.length) return;
        let frame = getFrame(tongueStartAnimation, enemy.animationTime);
        if (enemy.mode.includes('swimming')) {
            renderEnemyFrame(context, enemy, frame);
        } else {
            enemy.top += 18;
            renderEnemyFrame(context, enemy, frame);
            enemy.top -= 18;
            // drawImage(context, frame.image, frame, new Rectangle(enemy).translate(0, 18));
        }
        for (let i = 2; i < enemy.tongues.length; i++) {
            context.save();
            const dx = enemy.tongues[i][0] - enemy.tongues[i - 1][0];
            const dy = enemy.tongues[i][1] - enemy.tongues[i - 1][1];
            context.translate(
                enemy.left + (enemy.tongues[i][0] + enemy.tongues[i - 1][0]) / 2,
                enemy.top + (enemy.tongues[i][1] + enemy.tongues[i - 1][1]) / 2,
            );
            context.rotate(Math.atan2(dy, dx) + Math.PI);
            const animation = (i < enemy.tongues.length - 1) ? tongueMiddleAnimation : tongueEndAnimation;
            let frame = getFrame(animation, enemy.animationTime);
            drawImage(context, frame.image, frame, new Rectangle(frame).moveCenterTo(0, 0));
            context.restore();
        }
        // This draws the exact path the tongue is supposed to use. You can uncomment this to
        // check if there are any issues with the code for rendering the tongue.
        /*context.beginPath();
        context.lineWidth = 3;
        context.strokeStyle = 'blue';
        context.moveTo(enemy.left + enemy.tongues[0][0], enemy.top + enemy.tongues[0][1]);
        for (let i = 1; i < enemy.tongues.length; i++) {
            context.lineTo(enemy.left + enemy.tongues[i][0], enemy.top + enemy.tongues[i][1]);
        }
        context.stroke();*/
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



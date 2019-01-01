
const {
    FRAME_LENGTH, WIDTH, GAME_HEIGHT,
    ATTACK_DEFEATED_ENEMY, ATTACK_BULLET,
    ENEMY_FLYING_ANT, ENEMY_MONK,
    EFFECT_EXPLOSION,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { drawImage } = require('draw');
const { createAnimation, r, getFrame, requireImage, getHitbox } = require('animations');
const { getNewSpriteState } = require('sprites');
const { allWorlds, getGroundHeight, getNewLayer } = require('world');

const WORLD_FOREST_LOWER_BOSS = 'forestLowerBoss';

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
            let frog = createEnemy(state, ENEMY_FROG, {left: WIDTH});
            const hitbox = getEnemyHitbox(state, frog).translate(-frog.left, -frog.top);
            frog.top = getGroundHeight(state) - (hitbox.top + hitbox.height);
            lifebars[frog.id] = {
                left: 100, top: 40, width: 600, height: 8, startTime: world.time,
            };
            world = {...world, lifebars, spawnsDisabled: true};
            // This controls the bgm music for the area (this will start if the player unpauses).
            world.bgm = 'bgm/boss.mp3';
            // This actually starts playing the new bgm music.
            state = {...state, bgm: world.bgm, world};
            state = addEnemyToState(state, frog);
            world = state.world;
        }
        const frog = state.enemies.filter(enemy => enemy.type === ENEMY_FROG)[0];
        const grate = state.enemies.filter(enemy => enemy.type === ENEMY_GRATE)[0];
        if (pool && !grate) {
            return transitionToCity(state);
        }
        if (pool && !frog) {
            return transitionToSewer(state);
        }
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

            const lifebars = {...world.lifebars};
            let grate = createEnemy(state, ENEMY_GRATE, {left: 2 * WIDTH, top: -36});
            lifebars[grate.id] = {
                left: 100, top: 52, width: 600, height: 8, startTime: world.time,
            };
            world = {...world, lifebars, lastSpawnTime: world.time};
            state = {...state, world};
            state = addEnemyToState(state, grate);
            state = clearLayers(state);
            world = state.world;
        }
        // Once the pool exists, start spawning flying ants every 3
        // seconds from the anthole (or offscreen before it is onscreen).
        if (pool && !(world.lastSpawnTime + 3000 > world.time)) {
            world = {...world, lastSpawnTime: world.time};
            const fly = createEnemy(state, ENEMY_FLYING_ANT, {
                left: pool.left + 430,
                top: pool.top + 500,
            });
            fly.left = Math.min(WIDTH, fly.left - fly.width / 2);
            if (fly.left === WIDTH) {
                fly.vx = -6;
            } else {
                fly.vy = Math.random() * 5 - 10;
                fly.vx = Math.random() * 10 - 5;
            }
            fly.top = fly.top - fly.height;
            state = addEnemyToState(state, fly);
        }
        const waterMonks = state.enemies.filter(enemy => enemy.type === ENEMY_WATER_MONK);
        if (pool && pool.left + 200 < WIDTH && waterMonks.length < 3 &&
            world.lastSpawnTime + 1000 === world.time && random.chance(0.8)
        ) {
            const waterMonk = createEnemy(state, ENEMY_WATER_MONK, {left: WIDTH, top: GAME_HEIGHT});
            state = addEnemyToState(state, waterMonk);
        }
        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToForestLowerBoss,
};
const { transitionToCity } = require('areas/forestLowerToCity');
const { transitionToSewer } = require('areas/forestLowerToSewer');

const {
    enemyData, createEnemy, addEnemyToState, getDefaultEnemyAnimation,
    getEnemyHitbox, getEnemyCenter, renderEnemyFrame, updateEnemy, removeEnemy,
} = require('enemies');
const {
    getHeroHitbox, getHeroHitboxes,
    damageHero,
} = require('heroes');

function startPoolPhase(state) {
    if (state.world.time >= 30000) return true;
    const frog = state.enemies.filter(enemy => enemy.type === ENEMY_FROG)[0];
    return frog && frog.life <= frog.lowLife;
}
const ENEMY_FROG = 'frog';
// Frames when the frog is on dry land.
const landFrogRect = r(250, 220);
const landFrogHitbox = {left: 30, top: 45, width:200, height: 105};
const landFrogGeometry = {
    ...landFrogRect,
    hitbox: landFrogHitbox,
    hitboxes: [
        {left: 37, top: 39, width: 75, height: 88},
        {left: 112, top: 57, width: 61, height: 77},
        {left: 173, top: 83, width: 45, height: 65},
    ],
};
const jumpingFrogGeometry = {
    ...landFrogRect,
    hitbox: landFrogHitbox,
    hitboxes: [
        {left: 31, top: 17, width: 72, height: 59},
        {left: 74, top: 43, width: 100, height: 72},
        {left: 169, top: 68, width: 47, height: 75},
    ],
};
// Frames when the frog is swimming mostly above the water.
const swimmingFrogRect = r(251, 113);
const swimmingFrogGeometry = {
    ...swimmingFrogRect,
    hitbox: {left: 15, top: 17, width: 210, height: 80},
    hitboxes: [
        {left: 15, top: 20, width: 100, height: 83},
        {left: 118, top: 32, width: 45, height: 72},
        {left: 163, top: 69, width: 52, height: 30},
    ],
};
// Frames when only the frog's head is sticking out of the water.
const divingFrogGeometry = {
    ...swimmingFrogRect,
    hitbox: {left: 57, top: 53, width: 100, height: 55},
    hitboxes: [
        {left: 60, top: 49, width: 60, height: 50},
        {left: 125, top: 79, width: 16, height: 23}
    ],
};
// When the frog is completely underwater. No actual hitboxes.
const submergedFrogGeometry = {
    ...swimmingFrogRect,
    hitbox: {left: 45, top: 75, width: 205, height: 30},
    hitboxes: [],
};
// This image was originally designed to be placed on top of the swimming frog.
// It needs to be moved down about 18 pixels when drawn on the land frog.
const tongueStartAnimation = createAnimation('gfx/enemies/frog/tongue1.png', swimmingFrogRect);
const tongueMiddleAnimation = createAnimation('gfx/enemies/frog/tongue2.png', r(60, 20));
const tongueEndAnimation = createAnimation('gfx/enemies/frog/tongue3.png', r(60, 20));
enemyData[ENEMY_FROG] = {
    animation: createAnimation('gfx/enemies/frog/frog15.png', landFrogGeometry),
    attackAnimation: createAnimation('gfx/enemies/frog/frog16.png', landFrogGeometry),
    crouchingAnimation: createAnimation('gfx/enemies/frog/frog17.png', landFrogGeometry),
    jumpingAnimation: {
        frames: [
            {...jumpingFrogGeometry, image: requireImage('gfx/enemies/frog/frog18.png')},
            {...jumpingFrogGeometry, image: requireImage('gfx/enemies/frog/frog19.png')},
        ],
        frameDuration: 20,
        loop: false,
    },
    swimmingAnimation: {
        frames: [
            {...swimmingFrogGeometry, image: requireImage('gfx/enemies/frog/frog3.png')},
            {...swimmingFrogGeometry, image: requireImage('gfx/enemies/frog/frog4.png')},
            {...swimmingFrogGeometry, image: requireImage('gfx/enemies/frog/frog5.png')},
        ],
        frameDuration: 10,
    },
    swimmingAttackAnimation: createAnimation('gfx/enemies/frog/frog6.png', swimmingFrogGeometry),
    // This is drawn on top of the swimmingAnimation/swimmingAttackAnimation
    ripplesAnimation: {
        frames: [
            {...swimmingFrogRect, image: requireImage('gfx/enemies/frog/frog1.png')},
            {...swimmingFrogRect, image: requireImage('gfx/enemies/frog/frog2.png')},
        ],
        frameDuration: 10,
    },
    submergingAnimation: {
        frames: [
            {...divingFrogGeometry, image: requireImage('gfx/enemies/frog/frog7.png')},
            {...divingFrogGeometry, image: requireImage('gfx/enemies/frog/frog8.png')},
            {...divingFrogGeometry, image: requireImage('gfx/enemies/frog/frog9.png')},
        ],
        frameDuration: 10,
        loop: false,
    },
    emergingAnimation: createAnimation('gfx/enemies/frog/frog14.png', divingFrogGeometry),
    submergedAnimation: {
        frames: [
            {...submergedFrogGeometry, image: requireImage('gfx/enemies/frog/frog9.png')},
            {...submergedFrogGeometry, image: requireImage('gfx/enemies/frog/frog11.png')},
            {...submergedFrogGeometry, image: requireImage('gfx/enemies/frog/frog12.png')},
            {...submergedFrogGeometry, image: requireImage('gfx/enemies/frog/frog13.png')},
        ],
        frameDuration: 10,
    },
    getAnimation(state, enemy) {
        if (enemy.dead) return this.submergingAnimation;
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
    updateState(state, enemy) {
        if (enemy.dead) return state;
        state = this.updateTongues(state, enemy);
        enemy = state.idMap[enemy.id];
        // These don't handle killing the frog on land. Probably that isn't possible to trigger.
        if (enemy.snaredForFinisher) {
            // Leave the frog as is if it is snared during any frames where it is visible.
            if (enemy.mode === 'swimming' || enemy.mode === 'swimmingAttacking' || enemy.mode === 'swimmingRetracting')  {
                return state;
            }
            // Let the frog animate through emerging while snared.
            if (enemy.mode === 'emerging') {
                if (enemy.modeTime >= 200) {
                    return updateEnemy(state, enemy, {mode: 'swimming', animationTime: 0});
                }
                return updateEnemy(state, enemy, {modeTime: enemy.modeTime + FRAME_LENGTH});
            }
            // Force the frog to emerge if it is not visible or emerging already.
            return updateEnemy(state, enemy, {mode: 'emerging', modeTime: 0, animationTime: 0});
        }

        let {mode, vx, vy, modeTime, inPond, animationTime} = enemy;
        let tongues = [...enemy.tongues];
        const poolPhase = startPoolPhase(state);
        const pool = state.world.pool && state.world.pool.sprites[0];
        modeTime += FRAME_LENGTH;
        const hitbox = getEnemyHitbox(state, enemy);
        const heroHitbox = getHeroHitbox(state.players[0]);
        const [targetX, targetY] = heroHitbox.getCenter();
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

        const dx = (targetX - getEnemyCenter(state, enemy)[0]) || 1;
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
                    if (vx > 0) {
                        if (mode === 'swimmingAttacking')
                            tongues = tongues.map(t => [enemy.width - t[0] - hitbox.left + enemy.left, t[1]]);
                        else
                            tongues = tongues.map(t => [enemy.width - t[0], t[1]]);
                    }
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
                        // Frog gains life on eating a fly.
                        if (enemy.caughtFly) {
                            enemy = {
                                ...enemy,
                                caughtFly: false,
                                life: Math.min(enemy.maxLife, enemy.life + 40),
                            };
                        }
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
                if (hitbox.left >= WIDTH / 2) {
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
                        vy = -16;
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
                if (hitbox.bottom >= getGroundHeight(state)) {
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
                if (modeTime >= 1500) {
                    mode = 'emerging';
                    animationTime =  modeTime = 0;
                    if (enemy.left > pool.left + 350) {
                        vx = -0.0001;
                    } else {
                        vx = 0.0001;
                    }
                } else {
                    // Swim to the opposite half of the screen of the player, so that on
                    // emerging, the tongue can attack toward the player.
                    if (targetX < pool.left + 350) {
                        vx = Math.min(5, Math.max(pool.left + 500 - enemy.left, 0));
                    } else {
                        vx = Math.max(-5, Math.min(pool.left + 200 - enemy.left, 0));
                    }
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
        return updateEnemy(state, enemy, {vx, vy, mode, modeTime, animationTime, tongues, inPond});
    },
    onDeathEffect(state, enemy) {
        let delay = 4;
        for (let i = 0; i < 5; i++) {
            const explosion = createEffect(EFFECT_EXPLOSION, {
                sfx: 'sfx/explosion.mp3',
                delay,
            });
            delay += random.range(4, 8);
            if (i % 3 === 2) delay += 5;
            explosion.width *= 2;
            explosion.height *= 2;
            explosion.left = enemy.left + (enemy.width - explosion.width ) / 2 + random.range(-25, 25);
            explosion.top = enemy.top + (enemy.height - explosion.height ) / 2 + random.range(-25, 25);
            state = addEffectToState(state, explosion);
        }
        return updateEnemy(state, enemy, {ttl: 500});
    },
    // Make the tongue damage the player.
    updateTongues(state, enemy) {
        if (!enemy.tongues || enemy.tongues.length < 3) return state;
        const points = enemy.tongues.map(t => ({x: enemy.left + t[0], y: enemy.top + t[1]}));
        const heroHitboxes = getHeroHitboxes(state.players[0]);
        // Check if the frog caught a flying ant (the tip of its tongue hits an ant).
        if (enemy.mode === 'swimmingAttacking') {
            const ants = state.enemies.filter(enemy => enemy.type === ENEMY_FLYING_ANT);
            const lastRectangle = Rectangle.defineFromPoints(
                points[points.length - 1], points[points.length - 2]
            );
            for (let ant of ants) {
                if (lastRectangle.overlapsRectangle(getEnemyHitbox(state, ant))) {
                    state = updateEnemy(state, enemy,
                        {mode: 'swimmingRetracting', modeTime: 0, caughtFly: true}
                    );
                    return removeEnemy(state, ant);
                }
            }
        }
        // Check if the player is hitting any of the tongue sections.
        for (let i = 2; i < points.length; i++) {
            // This hitbox is a crude estimation for the tongues actual position.
            const sectionBox = Rectangle.defineFromPoints(points[i], points[i - 1]);
            if (Rectangle.collisionArrays(heroHitboxes, [sectionBox])) {
                return damageHero(state, 0);
            }
        }
        return state;
    },
    drawOver(context, state, enemy) {
        if (!enemy || enemy.dead) return;
        if (enemy.mode.includes('swimming')) {
            const frame = getFrame(this.ripplesAnimation, enemy.animationTime);
            // Use render enemy frame to transform the animation to match
            // the position+orientation of the enemy correctly.
            renderEnemyFrame(context, state, enemy, frame);
        }
        if (!enemy.tongues.length) return;
        let frame = getFrame(tongueStartAnimation, enemy.animationTime);
        if (enemy.mode.includes('swimming')) {
            renderEnemyFrame(context, state, enemy, frame);
        } else {
            // The land frog is a different height than the start tongue animation,
            // so we have to override the draw box for rendering this frame and offset it a little.
            enemy.top += 18;
            const drawBox = new Rectangle(frame);
            renderEnemyFrame(context, state, enemy, frame, drawBox);
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
            if (i === enemy.tongues.length - 1 && enemy.caughtFly) {
                const flyFrame = enemyData[ENEMY_FLYING_ANT].animation.frames[0];
                context.rotate(Math.PI / 12);
                drawImage(context, flyFrame.image, flyFrame, new Rectangle(flyFrame).moveCenterTo(0, 0));
            }
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
        lowLife: 300,
        score: 1000,
        boss: true,
        grounded: true,
        mode: 'normal',
        permanent: true,
        modeTime: 0,
        tongues: [],
        vx: 0,
    },
};
const ENEMY_GRATE = 'grate';
const grateRectangle = r(800, 600, {hitbox: {left: 718, top: 195, width: 30, height: 175}});
enemyData[ENEMY_GRATE] = {
    animation: {
        frames: [
            {...grateRectangle, image: requireImage('gfx/enemies/frog/frogbase_grate1.png')},
            {...grateRectangle, image: requireImage('gfx/enemies/frog/frogbase_grate2.png')},
            {...grateRectangle, image: requireImage('gfx/enemies/frog/frogbase_grate3.png')},
        ],
        frameDuration: 12,
    },
    deathAnimation: createAnimation('gfx/enemies/frog/frogbase_grate3.png', grateRectangle),
    updateState(state, enemy) {
        let animationTime = 0;
        if (enemy.life <= enemy.maxLife / 3) animationTime = 2 * FRAME_LENGTH * 12;
        else if (enemy.life <= 2 * enemy.maxLife / 3) animationTime = FRAME_LENGTH * 12;
        return updateEnemy(state, enemy, {animationTime});
    },
    onDeathEffect(state, enemy) {
        let delay = 6;
        for (let i = 0; i < 7; i++) {
            const explosion = createEffect(EFFECT_EXPLOSION, {
                sfx: 'sfx/explosion.mp3',
                delay,
            });
            delay += random.range(8, 12);
            if (i % 3 === 2) delay += 10;
            const hitbox = getEnemyHitbox(state, enemy);
            explosion.width *= 3;
            explosion.height *= 3;
            explosion.left = hitbox.left + (hitbox.width - explosion.width ) / 2 + random.range(-40, 40);
            explosion.top = hitbox.top + (hitbox.height - explosion.height ) / 2 + random.range(-100, 100);
            state = addEffectToState(state, explosion);
        }
        return updateEnemy(state, enemy, {stationary: false, bounces: 2, vx: 2});
    },
    onHitGroundEffect(state, enemy) {
        if (enemy.bounces > 0) {
            return updateEnemy(state, enemy, {
                vy: -4 - 3 * enemy.bounces,
                bounces: enemy.bounces - 1
            });
        }
        // This prevents onHitGroundEffect from being called again for this enemy.
        return updateEnemy(state, enemy, {hitGround: true});
    },
    onDamageEffect(state, enemy, attack) {
        if (!enemy.life || enemy.life % 5 && attack.damage < 5) return state;
        for (let i = 0; i < 1; i++) {
            const effect = createEffect(EFFECT_GRATE_DAMAGE, {
                top: enemy.top - 40 + Math.random() * 10,
                left: enemy.left - 5 + Math.random() * 10,
            });
            state = addEffectToState(state, effect);
        }
        return state;
    },
    props: {
        life: 1000,
        score: 500,
        stationary: true,
        doNotFlip: true,
        weakness: {[ATTACK_DEFEATED_ENEMY]: 50},
        boss: true,
        noCollisionDamage: true,
    },
};
const ENEMY_WATER_MONK = 'waterMonk';
const ENEMY_DROWNING_MONK = 'drowningMonk';

const waterMonkGeometry = r(60, 40, {hitbox: {left: 0, top: 0, width: 50, height: 20}});
// This drowning monk is created dead when a waterbug is defeated and has a special
// frame for showing the monk sinking in the water.
enemyData[ENEMY_DROWNING_MONK] = {
    ...enemyData[ENEMY_MONK],
    waterDeathAnimation: createAnimation('gfx/enemies/monks/waterbugsheet.png', waterMonkGeometry, {y: 3}),
    getAnimation(state, enemy) {
        const hitbox = getHitbox(this.deathAnimation, 0);
        if (enemy.top + hitbox.top + hitbox.height >= getGroundHeight(state)) {
            return this.waterDeathAnimation;
        }
        return getDefaultEnemyAnimation(state, enemy);
    }
}
enemyData[ENEMY_WATER_MONK] = {
    animation: createAnimation('gfx/enemies/monks/waterbugsheet.png', waterMonkGeometry, {rows: 3}),
    deathAnimation: createAnimation('gfx/enemies/monks/waterbugsheet.png', waterMonkGeometry, {y: 4}),
    deathSound: 'sfx/robedeath1.mp3',
    // Just turn back when they hit the edge of the pool.
    accelerate(state, enemy) {
        const pool = state.world.pool && state.world.pool.sprites[0];
        if (enemy.vx < 0 && enemy.left <= pool.left + 200) {
            return {...enemy, vx: -enemy.vx};
        }
        return enemy;
    },
    shoot(state, enemy) {
        if (enemy.animationTime % 3000) return state;
        for (let i = 0; i < 3; i++) {
            const theta = Math.PI / 3 + i * Math.PI / 6;
            const bullet = createAttack(ATTACK_BULLET, {
                left: enemy.left - enemy.vx + enemy.width / 2,
                top: enemy.top + enemy.vy,
                vx: enemy.bulletSpeed * Math.cos(theta),
                vy: -enemy.bulletSpeed * Math.sin(theta),
            });
            bullet.left -= bullet.width / 2;
            bullet.top -= bullet.height;
            state = addEnemyAttackToState(state, bullet);
        }
        return state;
    },
    onDeathEffect(state, enemy) {
        const drowningMonk = createEnemy(state, ENEMY_DROWNING_MONK, {
            top: enemy.top, left: enemy.left,
            // The rider gets knocked back, but the mount stays in places.
            vx: enemy.vx, vy: enemy.vy,
            life: 0, dead: true, ttl: 1000,
        });
        state = addEnemyToState(state, drowningMonk);
        return updateEnemy(state, enemy, {ttl: 600, vx: 0, vy: 0});
    },
    props: {
        life: 3,
        score: 10,
        grounded: true,
        vx: -2,
        bulletSpeed: 5,
    },
};

const { effects, createEffect, addEffectToState, updateEffect } = require('effects');
const grateDamageGeometry = {...grateRectangle, anchor: {x: 733, y: 277}};
const EFFECT_GRATE_DAMAGE = 'grateDamage';
effects[EFFECT_GRATE_DAMAGE] = {
    animation: createAnimation('gfx/enemies/frog/frogbase_grate_damage.png', grateDamageGeometry, {duration: 20}),
    advanceEffect: (state, effectIndex) => {
        const effect = state.effects[effectIndex];
        return updateEffect(state, effectIndex, {
            vy: effect.vy + 0.5,
            xScale: (effect.xScale * 4 + 1) / 5,
            yScale: (effect.yScale * 4 + 1) / 5,
        });
    },
    props: {
        relativeToGround: true,
        xScale: .1,
        yScale: .1,
    },
};

const { createAttack, addEnemyAttackToState } = require('attacks');


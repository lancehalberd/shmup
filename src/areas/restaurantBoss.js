
const {
    FRAME_LENGTH, HEIGHT, WIDTH,
    ATTACK_SLASH, ATTACK_STAB,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { drawImage } = require('draw');
const { getNewSpriteState } = require('sprites');
const { createAnimation, r, getFrame, requireImage, getHitBox } = require('animations');
const { allWorlds, getNewLayer } = require('world');

const WORLD_RESTAURANT_BOSS = 'restaurantBoss';
const BOSS_DURATION = 80000;

function transitionToRestaurantBoss(state) {
    const world = {
        ...state.world,
        type: WORLD_RESTAURANT_BOSS,
        time: 0,
        targetFrames: 50 * 5,
    };
    return {...state, world};
}
allWorlds[WORLD_RESTAURANT_BOSS] = {
    advanceWorld: (state) => {
        if (state.world.time < 500 && state.world.ground && state.world.ground.sprites.length) {
            state = {
                ...state,
                world: {
                    ...state.world,
                    targetFrames: 50 * 5 / 2,
                    targetX: state.world.x + 1000,
                    time: 0,
                }
            };
        } else if (state.world.ground) {
            state = spawnBossAndArena(state);
        } else {
            state = {
                ...state,
                world: {
                    ...state.world,
                    time: state.world.time + FRAME_LENGTH,
                }
            };
        }
        state = checkToSpawnSpiders(state);
        return checkIfBossDefeated(state);
    },
};

//const windowAnimation = createAnimation('gfx/scene/city/windowsheet.png', r(252, 600), {y: 2});
const windowAnimation = createAnimation('gfx/enemies/spiderboss/basesheet.png', r(250, 600), {left: 550});
const windowAnimationTop = createAnimation('gfx/enemies/spiderboss/basesheet.png', r(250, 600), {left: 550, y: 1});
const windowAnimationSide = createAnimation('gfx/enemies/spiderboss/basesheet.png', r(250, 600), {left: 550, y: 2});
const webBackground = createAnimation('gfx/enemies/spiderboss/webside.png', r(800, 600));


function spawnBossAndArena(state) {
    // Create boss + arena.
    const windowFrame = new Rectangle(windowAnimation.frames[0]).moveTo(0, 0);
    const webFrame = webBackground.frames[0];
    const targetDistance = 500;
    state = {
        ...state,
        bgm: 'bgm/boss.mp3',
        world: {
            ...state.world,
            spawnsDisabled: true,
            maxSpiders: 1,
            bgm: 'bgm/boss.mp3',
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + targetDistance,
            time: 0,
            ground: undefined,
            groundHeight: undefined,
            windowBackground: {
                xFactor: 1, yFactor: 1,
                sprites: [
                    getNewSpriteState({
                        ...windowFrame,
                        top: -36,
                        left: 800 + targetDistance - windowFrame.width,
                        animation: windowAnimation,
                    }),
                ],
            },
            windowForeground: {
                xFactor: 1, yFactor: 1,
                sprites: [
                    getNewSpriteState({
                        ...windowFrame,
                        top: -36,
                        left: 800 + targetDistance - windowFrame.width,
                        animation: windowAnimationSide,
                    }),
                    getNewSpriteState({
                        ...windowFrame,
                        top: -36,
                        left: 800 + targetDistance - windowFrame.width,
                        animation: windowAnimationTop,
                    }),
                    getNewSpriteState({
                        ...webFrame,
                        top: 0,
                        left: 800 + targetDistance - webFrame.width,
                        animation: webBackground,
                    }),
                ],
            },
            mgLayerNames: ['background', 'windowBackground'],
            fgLayerNames: ['windowForeground'],
        }
    };

    const lifebars = {};
    // Add the spider
    let newEnemy = createEnemy(state, ENEMY_SPIDER, {
        left: getSpiderTargetLeft(state),
        top: 160,
    });
    lifebars[newEnemy.id] = {
        left: 100, top: HEIGHT - 12, width: 600, height: 8, startTime: state.world.time,
    };
    state = addEnemyToState(state, newEnemy);
    // Add the spiderweb over the spider to protect it.
    newEnemy = createEnemy(state, ENEMY_SPIDER_WEB, {
        // This is chosen to line up with the window graphic above
        left: 800 + targetDistance - 230,
        top: 115,
    });
    lifebars[newEnemy.id] = {
        left: 100, top: HEIGHT - 24, width: 600, height: 8, startTime: state.world.time,
    };
    state = addEnemyToState(state, newEnemy);
    state = {
        ...state,
        world: {
            ...state.world,
            lifebars,
            // Initially the top spiders as soon as the screen reaches its target.
            spiderSpawnTimer: 5000
        }
    }
    return state;
}
function getSpiderTargetLeft(state) {
    const spiderWidth = enemyData[ENEMY_SPIDER].animation.frames[0].width * spiderGeometry.scaleX;
    return (state.world.targetX - state.world.x) + 800 - spiderWidth - 65;
}
function checkIfBossDefeated(state) {
    const web = state.enemies.filter(enemy => enemy.type === ENEMY_SPIDER_WEB)[0];
    const spider = state.enemies.filter(enemy => enemy.type === ENEMY_SPIDER)[0];
    // It is annoying to prevent the spider from taken damage from melee attacks,
    // so just refill its life until the web is defeated.
    if (web && spider && !web.dead) {
        state = updateEnemy(state, spider, {life: spider.maxLife});
    }
    if (state.world.time > 500 && !spider && random.chance(0.5)) {
        return transitionToBeach(state);
    }
    if (state.world.time > 500 && !spider) {
        return transitionToZoo(state);
    }
    return state
}
const spiderSlots = [[450, 500, 400], [350, 400, 350], [250, 300, 300], [150, 200, 250]];
function checkToSpawnSpiders(state) {
    if (state.world.x !== state.world.targetX) return state;
    const spiders = state.enemies.filter(enemy => enemy.type === ENEMY_BROWN_SPIDER );
    const web = state.enemies.filter(enemy => enemy.type === ENEMY_SPIDER_WEB)[0];
    // Once the web is defeated, the existing spiders will plunge any time they reach the top of the screen.
    if (web && web.dead) {
        for (const spider of spiders) {
            if (spider.top <= 0) {
                state = updateEnemy(state, spider, {mode: 'plunging', targetY: random.range(250, 400)});
            }
        }
    }
    // Do nothing if all spiders are present.
    if (spiders.length >= spiderSlots.length || spiders.length >= state.world.maxSpiders) {
        return {...state, world: {...state.world, spiderSpawnTimer: -1}}
    }
    // If a spider is missing, and the timer hasn't started, start the timer.
    if (!(state.world.spiderSpawnTimer > 0)) {
        return {...state, world: {...state.world, spiderSpawnTimer: 15000}}
    } else {
        state = {...state, world: {...state.world, spiderSpawnTimer: state.world.spiderSpawnTimer - FRAME_LENGTH}};
    }
    // Each spider spawns during the last N seconds, if there isn't one already there.
    if (state.world.spiderSpawnTimer % 1000) return state;
    const slot = spiderSlots[spiderSlots.length - 1 - state.world.spiderSpawnTimer / 1000];
    if (!slot) return state;
    let spider = spiders.some(spider => spider.left >= slot[0] && spider.left <= slot[1]);
    if (spider) return state;
    spider = createEnemy(state, ENEMY_BROWN_SPIDER, {
        left: random.range(slot[0], slot[1]),
        top: -55,
        mode: 'enter',
        targetY: slot[2],
    });
    return addEnemyToState(state, spider);
}

module.exports = {
    transitionToRestaurantBoss,
};
const { transitionToBeach } = require('areas/restaurantToBeach');
const { transitionToZoo } = require('areas/restaurantToZoo');

const { damageHero, getHeroHitBox } = require('heroes');
const {
    enemyData, createEnemy, addEnemyToState, updateEnemy,
    getEnemyDrawBox, renderEnemyFrame
} = require('enemies');
const { ATTACK_LIGHTNING_BOLT } = require('enemies/beetles');

const { ENEMY_BROWN_SPIDER } = require('enemies/spiders');

/*

* Maybe have flies spawn from left to right and get caught in the webs.

* Heroes get caught in web projectile don't regain energy until rescued.
If the web hits the Knight, the Knight goes through the dying animation with the string still there,
however after the 4th frame, they turn into their "wrapped up" sprite and are pulled to the web.
They cannot be used until they are slashed out of place, at which point they switch to their fall sprite and fall of screen,
at which point their normal death cooldown takes place.
You can also have it any death at the boss means they get trapped into the web, but that depends on how hard it needs to be.

* Background webs slow the knight.

* Make fight more difficult when spider is exposed (spawn more spiders?, attacks more often?)
* Maybe spiders that land on the window sill then jump at the player.
  Perhaps many of these spawn when the web is destroyed but then slows down a bit after a while.
  Maybe periodically as you damage the spider, another swarm attacks.

* spider hangs from a vertical spider web so that it isn't just floating when the web is destroyed.

* Spider pokes its head through the web just before attacking as a tell. (two frames given for animation).

*/
const ENEMY_SPIDER = 'spider';
const spiderGeometry = r(69, 111,
    {hitBox: {left: 23, top: 7, width: 20, height: 66},
    scaleX: 2, scaleY: 2
},
);
enemyData[ENEMY_SPIDER] = {
    animation: createAnimation('gfx/enemies/spiderboss/spidersheet.png', spiderGeometry, {x: 4, cols: 2, duration: 12}),
    deathAnimation: createAnimation('gfx/enemies/spiderboss/spidersheet.png', spiderGeometry, {x: 3}),
    attackAnimation: createAnimation('gfx/enemies/spiderboss/spidersheet.png', spiderGeometry, {x: 3, cols: 1, duration: 12}),
    headAnimation: createAnimation('gfx/enemies/spiderboss/spidersheet.png', spiderGeometry, {x: 0, cols: 2}),
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deathAnimation;
        if (enemy.webs && enemy.webs.length) return this.attackAnimation;
        return this.animation;
    },
    accelerate(state, enemy) {
        let { vx } = enemy;
        const targetLeft = getSpiderTargetLeft(state);
        vx += (targetLeft - enemy.left) / 200;
        vx *= 0.99;
        return {...enemy, vx};
    },
    isEnraged(state, enemy) {
        return enemy.mode === 'enraging' ||
            enemy.enragedAttacks > 0 ||
            enemy.life <= enemy.maxLife / 5;
    },
    extendWeb(state, enemy) {
        let { webs, webDx, webDy } = enemy;
        if (!webs || !webs.length) return state;
        // Check if the player is hitting any of the web sections.
        const heroHitBox = getHeroHitBox(state.players[0]);
        for (let i = 1; i < webs.length; i++) {
            // This hitBox is a crude estimation for the webs position.
            const sectionBox = Rectangle.defineFromPoints(webs[i], webs[i - 1]);
            if (sectionBox.overlapsRectangle(heroHitBox)) {
                state = damageHero(state, 0);
                break;
            }
        }
        const lastWeb = webs[0];
        webs = [
            {x: lastWeb.x + 2 * webDx, y: lastWeb.y + 2 * webDy},
            {x: lastWeb.x + webDx, y: lastWeb.y + webDy},
            ...webs,
        ].slice(0, 20);
        return updateEnemy(state, enemy, {webs});
    },
    updateState(state, enemy) {
        if (enemy.mode === 'passive') {
            if (this.isEnraged(state, enemy)) {
                state = this.changeMode(state, enemy, 'attack');
                enemy = state.idMap[enemy.id];
            } else if (enemy.modeTime >= 1000 + 2000 * enemy.life / enemy.maxLife) {
                state = this.changeMode(state, enemy, 'attack');
                enemy = state.idMap[enemy.id];
            }
        } else if (enemy.mode === 'enraging') {
            if (enemy.modeTime >= 1000) {
                state = this.changeMode(state, enemy, 'attack');
                enemy = state.idMap[enemy.id];
            }
        } else if (enemy.mode === 'attack') {
            let fireTime = 1000, stopTime = 2000;
            if (this.isEnraged(state, enemy)) {
                fireTime = 300;
                stopTime = 1000;
            } else if (enemy.life <= enemy.maxLife / 2) {
                fireTime = 800;
                stopTime = 1600;
            }
            if (enemy.modeTime === fireTime) {
                const heroHitBox = getHeroHitBox(state.players[0]);
                const [targetX, targetY] = heroHitBox.getCenter();
                const drawBox = getEnemyDrawBox(state, enemy);
                const web = {
                    x: enemy.left + 18 * spiderGeometry.scaleX,
                    y: enemy.top + 10 * spiderGeometry.scaleY,
                };
                const dx = targetX - web.x;
                const dy = targetY - web.y;
                const mag = Math.sqrt(dx*dx + dy*dy);
                if (mag) {
                    state = updateEnemy(state, enemy, {
                        webs: [web],
                        webDx: 16 * dx / mag,
                        webDy: 16 * dy / mag,
                    });
                    enemy = state.idMap[enemy.id];
                }
            }
            if (enemy.modeTime >= stopTime) {
                state = updateEnemy(state, enemy, {
                    enragedAttacks: enemy.enragedAttacks - 1,
                });
                enemy = state.idMap[enemy.id];
                if (this.isEnraged(state, enemy)) {
                    state = this.changeMode(state, enemy, 'attack');
                } else {
                    state = this.changeMode(state, enemy, 'passive');
                }
                enemy = state.idMap[enemy.id];
            }
        }
        state = this.extendWeb(state, enemy);
        enemy = state.idMap[enemy.id];
        // Tint increases/decrease depending on whether the spider is enraged.
        let tintAmount = enemy.tintAmount
        tintAmount += this.isEnraged(state, enemy) ? 0.02 : -0.04;
        tintAmount = Math.max(0, Math.min(1, tintAmount));
        const maxTint = 0.4 + 0.1 * Math.cos(state.world.time / 100);
        state = updateEnemy(state, enemy, {
            modeTime: enemy.modeTime + FRAME_LENGTH,
            tintAmount,
            tint: {color: 'red', amount: maxTint * enemy.tintAmount},
        });
        // Spider should occassionally stick its head forward then attack.
        return state;
    },
    changeMode(state, enemy, mode) {
        return updateEnemy(state, enemy, {mode, modeTime: 0, animationTime: 0, webs: []});
    },
    drawOver(context, state, enemy) {
        // Draw the head sticking out when appropriate.
        if (enemy.mode === 'attack') {
            const frame = getFrame(this.headAnimation, enemy.animationTime);
            renderEnemyFrame(context, state, enemy, frame);
        }
        if (enemy.webs && enemy.webs.length) {
            context.beginPath();
            context.strokeStyle = 'white';
            context.lineWidth = 5;
            context.moveTo(enemy.webs[0].x, enemy.webs[0].y);
            for (let i = 1; i < enemy.webs.length; i++) context.lineTo(enemy.webs[i].x, enemy.webs[i].y);
            context.stroke();
        }
    },
    drawUnder(context, state, enemy) {
        const web = state.enemies.filter(enemy => enemy.type === ENEMY_SPIDER_WEB)[0];
        if (!web || !web.dead) return;
        // Draw the hanging web behind the spider when the web shield is destroyed.
        const frame = getFrame(hangingWebAnimation, enemy.animationTime);
        const drawBox = getEnemyDrawBox(state, enemy);

        drawImage(context, frame.image, frame, new Rectangle(frame).moveCenterTo(
            drawBox.left + drawBox.width / 2 + 15, drawBox.top + drawBox.height / 2 + 10
        ));
    },
    onDamageEffect(state, enemy, attack) {
        // Ignore damage effects while the web is up.
        const web = state.enemies.filter(enemy => enemy.type === ENEMY_SPIDER_WEB)[0];
        if (web && !web.dead) return state;
        state = updateEnemy(state, enemy, {vx: enemy.vx + 1 });
        enemy = state.idMap[enemy.id];
        // Enraged for 6 attacks every time the spider loses 25% health.
        const prevLife = enemy.life + attack.damage;
        if (prevLife < enemy.maxLife &&
            Math.floor(4 * enemy.life / enemy.maxLife) !== Math.floor(4 * prevLife / enemy.maxLife)) {
            state = updateEnemy(state, enemy, {enragedAttacks: 6, mode: 'enraging', modeTime: 0});
        }
        return state;
    },
    props: {
        life: 500,
        vx: 0,
        vy: 0,
        hanging: true,
        boss: true,
        doNotFlip: true,
        mode: 'passive',
        modeTime: 0,
        enragedAttacks: 0,
        tintAmount: 0,
    },
};
const ENEMY_SPIDER_WEB = 'spiderWeb';
const webGeometry = r(212, 371, {
    hitBoxes: [
        {left:0, top: 0, width: 212, height: 283},
        {left:152, top: 0, width: 60, height: 350},
    ],
});
const hangingWebAnimation = createAnimation('gfx/enemies/spiderboss/webs.png', webGeometry, {y: 3});

enemyData[ENEMY_SPIDER_WEB] = {
    animation: createAnimation('gfx/enemies/spiderboss/webs.png', webGeometry),
    damagedAnimation: createAnimation('gfx/enemies/spiderboss/webs.png', webGeometry, {y: 1}),
    deadAnimation: createAnimation('gfx/enemies/spiderboss/webs.png', webGeometry, {y : 2}),
    getAnimation(state, enemy) {
        if (enemy.dead) return this.deadAnimation;
        if (enemy.life > enemy.maxLife / 2) return this.animation;
        return this.damagedAnimation;
    },
    onDamageEffect(state, enemy, attack) {
        // Immediately trigger spider spawn when the web is hit with a melee attack.x
        if (attack.melee) {
            // Enraged the spider to attack based on how much life the web has left.
            const spider = state.enemies.filter(enemy => enemy.type === ENEMY_SPIDER)[0];
            let enragedAttacks = 2;
            if (enemy.life <= 3 * enemy.maxLife / 4) enragedAttacks++;
            if (enemy.life <= 2 * enemy.maxLife / 4) enragedAttacks++;
            if (enemy.life <= 1 * enemy.maxLife / 4) enragedAttacks++;
            state = updateEnemy(state, spider, {enragedAttacks, mode: 'enraging', modeTime: 0});
            return {...state, world: {
                ...state.world,
                maxSpiders: enragedAttacks - 1,
                spiderSpawnTimer: (spiderSlots.length - 1) * 1000 + FRAME_LENGTH
            }}
        }
        return state;
    },
    onDeathEffect(state, enemy, attack) {
        const spider = state.enemies.filter(enemy => enemy.type === ENEMY_SPIDER)[0];
        state = updateEnemy(state, spider, {enragedAttacks: 6, mode: 'enraging', modeTime: 0});
        return {...state, world: {
            ...state.world,
            maxSpiders: 4,
            spiderSpawnTimer: (spiderSlots.length - 1) * 1000 + FRAME_LENGTH
        }}
    },
    props: {
        life: 8000,
        vx: 0,
        vy: 0,
        stationary: true,
        boss: false,
        doNotFlip: true,
        persist: true,
        permanent: true,
        weakness: {[ATTACK_SLASH]: 1000, [ATTACK_STAB]: 1000},
    },
};

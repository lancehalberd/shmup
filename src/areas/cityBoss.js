
const {
    FRAME_LENGTH, HEIGHT, WIDTH,
} = require('gameConstants');
const random = require('random');
const Rectangle = require('Rectangle');
const { createAnimation, r, getFrame, requireImage, getHitBox } = require('animations');
const { allWorlds, getNewLayer } = require('world');

const WORLD_CITY_BOSS = 'cityBoss';
const BOSS_DURATION = 80000;

function transitionToCityBoss(state) {
    const world = {
        ...state.world,
        type: WORLD_CITY_BOSS,
        time: 0,
        targetFrames: 50 * 5,
    };
    return {...state, world};
}
allWorlds[WORLD_CITY_BOSS] = {
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
        if (time > 500 && !seagull && random.chance(0.5)) {
            return transitionToBeach(state);
        }
        if (time > 500 && !seagull) {
            return transitionToZoo(state);
        }

        state = {...state, world};
        return state;
    },
};

module.exports = {
    transitionToCityBoss,
};
const { transitionToBeach } = require('areas/cityToBeach');
const { transitionToZoo } = require('areas/cityToZoo');

const { enemyData, createEnemy, addEnemyToState, updateEnemy } = require('enemies');
const { ATTACK_LIGHTNING_BOLT } = require('enemies/beetles');
/*
Spider boss on window out of restaurant, guarding whole thing.
Reuse webs, make large spider (4 frames movement? 200x200? 2 frame death) who has web projectiles
that try and pull the Knight to the Spider. If possible, a Knight caught by the Spider will be dead
until the fight is done, with 3 sprites of them caught in the web. Area also full of normal spiders.
Maybe flies? They can be effected by the webs as well.



The 3b boss happens at the end of the restaurant in the city - using the window sprite again, except it is covered in webs.
The webs can slow the Knight, and there can also be other webs around the window sprite.
I figure there can be spiders dropping from the ceiling, as well as numerous flies.
 I thought maybe it would be neat for flies to spawn from the left side of the screen going right and
 then getting caught in the webs, but that may be unfair at first as there would be no warning an enemy
 is coming from that direction now.

My thoughts for the 3b boss is a bit different. I decided to put the boss behind the web,
so the web has to be slashed many times before it is destroyed (giving two life bars).
This forces the player to have to get close to the spider's many allies, as well as have less time to dodge the spider's attack,
which is just a string of web.
If the web hits the Knight, the Knight goes through the dying animation with the string still there,
however after the 4th frame, they turn into their "wrapped up" sprite and are pulled to the web.
They cannot be used until they are slashed out of place, at which point they switch to their fall sprite and fall of screen,
at which point their normal death cooldown takes place.
You can also have it any death at the boss means they get trapped into the web, but that depends on how hard it needs to be.
Overall, aside from movement issues, the majority of threat comes from other spiders spawning (or flies).
Once the web is destroyed after 10 or so slashes, the spider is exposed and can be shot and slashed.
At this point, I figure there can be a bunch more spiders spawning -
the first thing that came in mind is spawning at the window sill dozens of jumping spiders for a while,
though eventually it slows down. I figure the spider boss will still use, perhaps more often, the web attack as well.

This finishes the 3b assets! In terms of first draft assets, this means the stages are half way done! How did you want to go forward?

So I made a sample of the boss with things scaled correctly, and just went ahead and exported the files to that size. Tell me how these things look - if it works well.
Half the spider sprites are the same, but things like the web had to be redone. There is now also two "head" sprite for when the spider pokes their head through the web and moves the mouth around a little.
There is a web straight line for the spider to hang on when the web is gone, and the spider can move back and forth a couple pixels with the web anchored to the same point on top, if it is possible to skew things that way. Otherwise, the spider can stay still if need be.

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

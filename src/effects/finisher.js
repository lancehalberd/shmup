const {
    PRIORITY_FIELD_BOSS,
    r, a,
    requireImage,
    createAnimation,
} = require('animations');

const { MAX_ENERGY } = require('gameConstants');

function advanceFinisher(state, playerIndex) {
    if (getEffectIndex(state, EFFECT_FINISHER_BEAM_START) >= 0) {
        return advanceFinisherBeam(state, playerIndex);
    }
    if (getEffectIndex(state, EFFECT_FINISHER_BALL) >= 0) {
        return advanceFinisherCharge(state, playerIndex);
    }
    return updatePlayer(state, playerIndex, {usingFinisher: false});
}

function advanceFinisherCharge(state, playerIndex) {
    const player = state.players[playerIndex];
    const ballIndex = getEffectIndex(state, EFFECT_FINISHER_BALL);
    const finisherBall = state.effects[ballIndex];
    let baseScale = 0;
    if (finisherBall.xScale >= 2) baseScale = 2;
    else if (finisherBall.xScale >= 1) baseScale = 1;
    const heroType = player.heroes[0];
    let energy = state.players[playerIndex][heroType].energy;
    const heroHitbox = getHeroHitbox(player);
    // Drain energy from the player until it hits 0.
    if (energy > 0) {
        if (energy === MAX_ENERGY) {
            state = {...state, sfx: {...state.sfx, [heroesData[heroType].specialSfx]: true}};
        }
        energy--;
        state = updatePlayer(state, playerIndex, {[heroType]: {...player[heroType], energy}});
    } else if (finisherBall.xScale < 3) {
        return switchHeroes(state, playerIndex);
    } else {
        state = {...state, flashHudUntil: state.world.time + 500};
        state = updatePlayer(state, playerIndex, {
            powerupPoints: 0,
            powerupIndex: 0,
            comboScore: 0,
            powerups: [], ladybugs: [], shootingFinisher: true
        });
        state = updateEffect(state, ballIndex, {done: true});
        const y = heroHitbox.top + heroHitbox.height / 2;
        const x = heroHitbox.left + heroHitbox.width / 2 + 35;
        const finisherBeamStart = createEffect(EFFECT_FINISHER_BEAM_START);
        finisherBeamStart.left = x;
        finisherBeamStart.top = y - finisherBeamStart.height / 2;
        state = addEffectToState(state, finisherBeamStart);
        const finisherBeam = createEffect(EFFECT_FINISHER_BEAM, {xScale: 40});
        finisherBeam.left = x + finisherBeamStart.width;
        finisherBeam.top = y - finisherBeam.height / 2;
        state = addEffectToState(state, finisherBeam);
        state = {...state, sfx: {...state.sfx, shootFinisher: true}};
        return state;
    }
    const xScale = baseScale + (MAX_ENERGY - energy) / MAX_ENERGY;
    const yScale = xScale;
    //console.log(heroHitbox.left + heroHitbox.width / 2, heroHitbox.top + heroHitbox.height / 2);
    /*console.log({
        x: finisherBall.left + finisherBall.xScale * finisherBall.width / 2,
        y: finisherBall.top + finisherBall.yScale * finisherBall.height / 2,
    });*/
    const targetLeft = heroHitbox.left + heroHitbox.width / 2 + 50 - finisherBall.width / 2;
    const targetTop = heroHitbox.top + heroHitbox.height / 2 - finisherBall.height / 2;
    const left = (finisherBall.left + targetLeft) / 2;
    const top = (finisherBall.top + targetTop) / 2;
    state = updateEffect(state, ballIndex, { top, left, xScale, yScale });

    return state;
}

function advanceFinisherBeam(state, playerIndex) {
    const beamStartIndex = getEffectIndex(state, EFFECT_FINISHER_BEAM_START);
    const beamIndex = getEffectIndex(state, EFFECT_FINISHER_BEAM);
    if (state.effects[beamStartIndex].animationTime > 1000) {
        state = updateEffect(state, beamStartIndex, {done: true});
        state = updateEffect(state, beamIndex, {done: true});
        const snaredEnemies = state.enemies.filter(enemy => enemy.snaredForFinisher);
        for (let enemy of snaredEnemies) {
            state = updateEnemy(state, enemy, {dead: true, animationTime: 0, snaredForFinisher: false});
            enemy = state.idMap[enemy.id];
            if (enemyData[enemy.type].onDeathEffect) {
                // This actuall changes the enemy index, so we do it last. In the long term it is probably
                // better to use the unique enemy id instead of the index.
                state = enemyData[enemy.type].onDeathEffect(state, enemy);
            }
        }
        state = {...state, flashHudUntil: false};
        state = updatePlayer(state, playerIndex, {invulnerableFor: 5000});
    }
    return state;
}

function startFinisher(state, playerIndex) {
    const player = state.players[playerIndex];
    const heroHitbox = getHeroHitbox(player);
    for (const heroType of player.heroes) {
        state = updatePlayer(state, playerIndex,
            {[heroType]: {...player[heroType], energy: MAX_ENERGY}}
        );
    }
    const finisherBall = createEffect(EFFECT_FINISHER_BALL,
        {xScale: 0.01, yScale: 0.01,
            top: heroHitbox.top + heroHitbox.height / 2,
            left: heroHitbox.left + heroHitbox.width / 2 + 50,
    });
    finisherBall.top -= finisherBall.height / 2;
    finisherBall.left -= finisherBall.width / 2;
    state = addEffectToState(state, finisherBall);
    state = {...state, sfx: {...state.sfx, chargeFinisher: true}};
    return updatePlayer(state, playerIndex, {usingFinisher: true});
}

function getFinisherPosition(state, effect, enemy) {
    const hitbox = getEnemyHitbox(state, enemy);
    const effectHitbox = getEffectHitbox(effect).translate(-effect.left, -effect.top);
    return {
        top: hitbox.top + hitbox.height / 2 - effectHitbox.top - effectHitbox.height / 2,
        left: hitbox.left - effectHitbox.left - effectHitbox.width / 2 - 200,
    };
}

const EFFECT_FINISHER = 'effectFinisher';

module.exports = {
    advanceFinisher,
    startFinisher,
    getFinisherPosition,
    EFFECT_FINISHER,
};

const { heroesData, updatePlayer, getHeroHitbox, switchHeroes } = require('heroes');
const { enemyData, getEnemyHitbox, updateEnemy } = require('enemies');
const {
    effects, createEffect, addEffectToState,
    updateEffect, getEffectIndex, getEffectHitbox,
} = require('effects');

effects[EFFECT_FINISHER] = {
    animation: createAnimation('gfx/effects/crosshair.png',
        r(150, 100, { hitbox: { left: 46, top: 0, width: 55, height: 55 } }),
        {priority: PRIORITY_FIELD_BOSS},
    ),
    advanceEffect(state, effectIndex) {
        const effect = state.effects[effectIndex];
        const enemy = state.idMap[effect.enemyId];
        state = updateEffect(state, effectIndex, {tint: (state.world.time % 500 > 250) ? {color: 'white', amount: 0.5} : undefined});
        if (!enemy || enemy.dead || enemy.life > 0) {
            return updateEffect(state, effectIndex, {done: true});
        }
        // Move the hitbox to be in front of the enemy.
        return updateEffect(state, effectIndex, getFinisherPosition(state, effect, enemy));
    },
    props: {
        permanent: true,
    },
};

const EFFECT_FINISHER_BALL = 'effectFinisherBall';
effects[EFFECT_FINISHER_BALL] = {
    animation: createAnimation('gfx/attacks/finisherball.png',
        a(r(10, 10), 0.5, 0.5),
        {priority: PRIORITY_FIELD_BOSS},
    ),
    advanceEffect(state, effectIndex) {
        let rotation = (state.effects[effectIndex].rotation || 0) + Math.PI / 20;
        return updateEffect(state, effectIndex, { rotation });
    },
    props: {
        permanent: true,
    },
};

const EFFECT_FINISHER_BEAM_START = 'effectFinisherBeamStart';
effects[EFFECT_FINISHER_BEAM_START] = {
    animation: {
        frames: [
            {...r(20, 30), image: requireImage('gfx/attacks/finisher4.png', PRIORITY_FIELD_BOSS)},
            {...r(20, 30), image: requireImage('gfx/attacks/finisher5.png', PRIORITY_FIELD_BOSS)},
            {...r(20, 30), image: requireImage('gfx/attacks/finisher6.png', PRIORITY_FIELD_BOSS)},
        ],
        frameDuration: 4,
        loop: false,
    },
    props: {
        permanent: true,
    },
};

const EFFECT_FINISHER_BEAM = 'effectFinisherBeam';
effects[EFFECT_FINISHER_BEAM] = {
    animation: {
        frames: [
            {...r(20, 30), image: requireImage('gfx/attacks/finisher1.png', PRIORITY_FIELD_BOSS)},
            {...r(20, 30), image: requireImage('gfx/attacks/finisher2.png', PRIORITY_FIELD_BOSS)},
            {...r(20, 30), image: requireImage('gfx/attacks/finisher3.png', PRIORITY_FIELD_BOSS)},
        ],
        frameDuration: 4,
        loop: false,
    },
    props: {
        permanent: true,
    },
};


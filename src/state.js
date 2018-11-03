const Rectangle = require('Rectangle');

const {
    FRAME_LENGTH,
    EFFECT_DEFLECT_BULLET,
    EFFECT_DAMAGE, EFFECT_BLOCK_ATTACK,
} = require('gameConstants');
const {
    applyCheckpointToState,
    setCheckpoint,
    checkpoints,
    getNewWorld,
    advanceWorld,
} = require('world');

const getNewState = () => (advanceWorld({
    idMap: {},
    players: [getNewPlayerState()],
    deathCooldown: 0,
    enemies: [],
    loot: [],
    effects: [],
    enemyCooldown: 0,
    playerAttacks: [],
    neutralAttacks: [],
    enemyAttacks: [],
    sfx: {},
    title: true,
    titleTime: 0,
    titleIndex: 0,
    stageSelectIndex: -1,
    paused: false,
    gameover: false,
    gameOverTime: 0,
    continueIndex: 0,
    world: getNewWorld(),
    bgm: 'bgm/title.mp3',
    interacted: false,
    checkpoint: null,
    debug: false,
    uniqueEnemyIdCounter: 0,
}));

const TEST_TIME = 0;

const advanceState = (state) => {
    let updatedState = {...state};
    if (updatedState.world.time < TEST_TIME) {
        updatedState.world.time = TEST_TIME;
    }
    if (updatedState.players[0].actions.toggleDebug) {
        updatedState = {...updatedState, debug: !updatedState.debug};
    }
    if (updatedState.instructions) {
        if (updatedState.players[0].actions.confirm) {
            return {...updatedState, instructions: (updatedState.instructions + 1) % 3};
        }
        return updatedState;
    }
    if (updatedState.title) {
        updatedState = {...updatedState, titleTime: updatedState.titleTime + FRAME_LENGTH}
        //return {...require('states/skyBossTransition'), interacted: false};
        //return applyCheckpointToState(setCheckpoint({...updatedState, title: false}, 'fieldStart'));

        const checkpointKeys = Object.keys(checkpoints);
        let titleIndex = updatedState.titleIndex, stageSelectIndex = state.stageSelectIndex;
        if (updatedState.players[0].actions.confirm && titleIndex === 0) {
            let world = updatedState.world;
            if (stageSelectIndex >= 0) {
                updatedState = {...updatedState, title: false};
                const checkpoint = checkpointKeys[stageSelectIndex];
                updatedState = setCheckpoint(updatedState, checkpoint);
                return applyCheckpointToState(updatedState);
            }
            return {...updatedState, title: false, world, bgm: world.bgm};
        }
        if (updatedState.players[0].actions.confirm && titleIndex === 1) {
            return {...updatedState, instructions: 1};
        }
        if (updatedState.players[0].actions.up) titleIndex = (titleIndex + 2 - 1) % 2;
        if (updatedState.players[0].actions.down) titleIndex = (titleIndex + 1) % 2;
        if (updatedState.players[0].actions.left) {
            stageSelectIndex--;
            if (stageSelectIndex < -1) stageSelectIndex = checkpointKeys.length - 1;
        }
        if (updatedState.players[0].actions.right) {
            stageSelectIndex++;
            if (stageSelectIndex >= checkpointKeys.length) stageSelectIndex = -1;
        }
        return {...updatedState, titleIndex, stageSelectIndex};
    }
    if (updatedState.gameover) {
        let continueIndex = updatedState.continueIndex;
        updatedState = {...updatedState, gameOverTime: updatedState.gameOverTime + FRAME_LENGTH};
        if (updatedState.players[0].actions.confirm) {
            if (updatedState.gameOverTime < 1000) {
                return updatedState;
            }
            // This gets set when a player dies at the end of the demo, and is not given
            // an option to continue.
            if (updatedState.finished) {
                return {...getNewState(), interacted: true, finished: false};
            }
            if (continueIndex === 0) { // Continue
                updatedState = updatePlayerOnContinue({...updatedState, gameover: false}, 0);
                return applyCheckpointToState(updatedState);
            } else { // Do not continue, back to title
                return {...getNewState(), interacted: true};
            }
        }
        if (updatedState.players[0].actions.up) {
            continueIndex = (continueIndex + 2 - 1) % 2;
        }
        if (updatedState.players[0].actions.down) {
            continueIndex = (continueIndex + 1) % 2;
        }
        return {...updatedState, continueIndex};
    }
    if (updatedState.deathCooldown > 0) {
        updatedState.deathCooldown -= FRAME_LENGTH;
        if (updatedState.deathCooldown <= 0) {
            return { ...updatedState, gameover: true, gameOverTime: 0, continueIndex: 0, };
        }
    }
    let { paused } = updatedState;
    if (updatedState.players[0].actions.start) {
        paused = !paused;
        if (!paused) {
            let world = updatedState.world;
            updatedState = {...updatedState, world, bgm: world.bgm};
        }
    }
    if (paused) {
        return {...updatedState, paused};
    }
    updatedState.newEffects = [];
    updatedState.newLoot = [];
    updatedState.newEnemies = [];
    updatedState.newPlayerAttacks = [];
    updatedState.newEnemyAttacks = [];
    updatedState.newNeutralAttacks = [];
    const skipSlowMotionFrame = state.slowTimeFor > 0 && (state.slowTimeFor % 40);
    if (state.slowTimeFor) updatedState = {...updatedState, slowTimeFor: state.slowTimeFor - 20};
    if (!skipSlowMotionFrame) {
        updatedState = advanceWorld(updatedState);
    }
    for (let playerIndex = 0; playerIndex < updatedState.players.length; playerIndex++) {
        updatedState = advanceHero(updatedState, playerIndex);
    }
    let currentPlayerAttacks = updatedState.playerAttacks.map(attack => advanceAttack(updatedState, attack)).filter(attack => !attack.done);
    if (!skipSlowMotionFrame) {
        for (let enemy of updatedState.enemies) {
            enemy = updatedState.idMap[enemy.id];
            if (enemy) updatedState = advanceEnemy(updatedState, enemy);
        }
        if (
            !updatedState.players[0].usingFinisher
            && !updatedState.world.suppressAttacks
            && !updatedState.enemies.filter(enemy => enemy.boss && enemy.dead).length
        ) {
            for (let enemy of updatedState.enemies) {
                enemy = updatedState.idMap[enemy.id];
                if (enemyIsActive(updatedState, enemy) && enemyData[enemy.type].shoot && enemy.left > 0) {
                    // Don't shoot while spawning.
                    if (!enemyData[enemy.type].spawnAnimation || enemy.spawned) {
                        updatedState = enemyData[enemy.type].shoot(updatedState, enemy);
                    }
                }
            }
        }
    }

    // Check for enemies hit by attacks.
    for (let i = 0; i < updatedState.enemies.length; i++) {
        let enemy = updatedState.idMap[updatedState.enemies[i].id];
        if (!enemy) continue;
        for (let j = 0; j < currentPlayerAttacks.length && enemyIsActive(updatedState, enemy); j++) {
            const attack = currentPlayerAttacks[j];
            const attackHitBox = getAttackHitBox(state, attack);
            let hitBox = null;
            if (!attack.done && !attack.hitIds[enemy.id]
                && (hitBox = isIntersectingEnemyHitBoxes(updatedState, enemy, attackHitBox))
            ) {
                let hitEffect;
                if (enemyData[enemy.type].isInvulnerable && enemyData[enemy.type].isInvulnerable(updatedState, enemy, attack)) {
                    hitEffect = createEffect(EFFECT_BLOCK_ATTACK, {sfx: 'reflect'});
                    currentPlayerAttacks[j] = {...attack, done: !attack.piercing, hitIds: {...attack.hitIds, [enemy.id]: true}};
                } else {
                    hitEffect = createEffect(EFFECT_DAMAGE, {sfx: 'sfx/hit.mp3'});
                    currentPlayerAttacks[j] = {...attack,
                        damage: attack.piercing ? attack.damage : attack.damage - Math.max(enemy.life, 1),
                        done: !attack.piercing && (attack.damage - Math.max(enemy.life, 1)) < 1,
                        hitIds: {...attack.hitIds, [enemy.id]: true},
                    };
                }
                let x = attack.left + attack.width / 2;
                x = Math.max(hitBox.left, Math.min(hitBox.left + hitBox.width, x));
                hitEffect.left = x - hitEffect.width / 2;
                hitEffect.top = attack.top + (attack.height - hitEffect.height ) / 2;
                updatedState = addEffectToState(updatedState, hitEffect);
                updatedState = damageEnemy(updatedState, enemy.id, attack);
                enemy = updatedState.idMap[updatedState.enemies[i].id];
            }
        }
        for (let j = 0; j < updatedState.players.length; j++) {
            if (enemyIsActive(updatedState, enemy) && !enemy.noCollisionDamage &&
                isIntersectingEnemyHitBoxes(updatedState, enemy, getHeroHitBox(updatedState.players[j]), true)
            ) {
                updatedState = damageHero(updatedState, j);
            }
        }
    }
    currentPlayerAttacks = currentPlayerAttacks.filter(attack => !attack.done);
    updatedState.enemies = updatedState.enemies.filter(enemy => updatedState.idMap[enemy.id]);

    // Advance enemy attacks and check for hitting the player.
    let currentEnemyAttacks = updatedState.enemyAttacks;
    if (!skipSlowMotionFrame) {
        currentEnemyAttacks = currentEnemyAttacks.map(attack => advanceAttack(updatedState, attack)).filter(attack => !attack.done);
    }
    for (let i = 0; i < updatedState.players.length; i++) {
        if (isPlayerInvulnerable(updatedState, i)) continue;
        const playerHitBox = getHeroHitBox(updatedState.players[i]);
        for (let j = 0; j < currentEnemyAttacks.length && !updatedState.players[i].done; j++) {
            const attack = currentEnemyAttacks[j];
            const attackHitBox = getAttackHitBox(state, attack);
            if (Rectangle.collision(playerHitBox, attackHitBox)) {
                updatedState = damageHero(updatedState, i);
                currentEnemyAttacks[j] = {...attack, done: !attack.piercing};
            }
        }
    }
    if (updatedState.players[0].usingFinisher) {
        // Replace any enemy attack with deflected bullets.
        for (let j = 0; j < currentEnemyAttacks.length; j++) {
            const enemyAttack = currentEnemyAttacks[j];
            currentEnemyAttacks[j] = {...enemyAttack, done: true};
            const deflectEffect = createEffect(EFFECT_DEFLECT_BULLET);
            deflectEffect.left = enemyAttack.left + (enemyAttack.width - deflectEffect.width ) / 2;
            deflectEffect.top = enemyAttack.top + (enemyAttack.height - deflectEffect.height ) / 2;
            updatedState = addEffectToState(updatedState, deflectEffect);
        }
    }
    // Player melee attacks can destroy enemy projectiles.
    for (let i = 0; i < currentPlayerAttacks.length; i++) {
        const attack = currentPlayerAttacks[i];
        if (!attack.melee || attack.done) continue;
        const attackHitBox = getAttackHitBox(state, attack);
        for (let j = 0; j < currentEnemyAttacks.length; j++) {
            const enemyAttack = currentEnemyAttacks[j];
            if (Rectangle.collision(attackHitBox, getAttackHitBox(state, enemyAttack))) {
                currentEnemyAttacks[j] = {...enemyAttack, done: true};
                const deflectEffect = createEffect(EFFECT_DEFLECT_BULLET);
                deflectEffect.left = enemyAttack.left + (enemyAttack.width - deflectEffect.width ) / 2;
                deflectEffect.top = enemyAttack.top + (enemyAttack.height - deflectEffect.height ) / 2;
                updatedState = addEffectToState(updatedState, deflectEffect);
            }
        }
    }
    currentEnemyAttacks = currentEnemyAttacks.filter(attack => !attack.done);

    let currentNeutralAttacks = updatedState
    if (!skipSlowMotionFrame) {
        currentNeutralAttacks = currentNeutralAttacks.neutralAttacks.map(attack => advanceAttack(updatedState, attack)).filter(attack => !attack.done);
    }
    for (let i = 0; i < currentNeutralAttacks.length; i++) {
        const attack = currentNeutralAttacks[i];
        const attackHitBox = getAttackHitBox(state, attack);
        for (let j = 0; j < updatedState.players.length; j++) {
            const player = updatedState.players[j];
            const playerKey = `player${j}`;
            if (isPlayerInvulnerable(updatedState, j) || attack.hitIds[playerKey]) continue;
            const playerHitBox = getHeroHitBox(player);
            if (Rectangle.collision(playerHitBox, attackHitBox)) {
                updatedState = damageHero(updatedState, j);
                currentNeutralAttacks[i] = {...attack,
                    damage: attack.piercing ? attack.damage : attack.damage - 1,
                    done: !attack.piercing && (attack.damage - 1) <= 0,
                    hitIds: {...attack.hitIds, [playerKey]: true},
                };
            }
        }
        for (let j = 0; j < updatedState.enemies.length; j++) {
            const enemy = updatedState.idMap[updatedState.enemies[j].id];
            if (!enemyIsActive(updatedState, enemy) || attack.hitIds[enemy.id]) continue;
            if (isIntersectingEnemyHitBoxes(updatedState, enemy, attackHitBox)) {
                currentNeutralAttacks[i] = {...attack,
                    damage: attack.piercing ? attack.damage : attack.damage - Math.max(enemy.life, 1),
                    done: !attack.piercing && (attack.damage - Math.max(enemy.life, 1)) <= 0,
                    hitIds: {...attack.hitIds, [enemy.id]: true},
                };
                updatedState = damageEnemy(updatedState, enemy.id, attack);
            }
        }
    }
    if (!skipSlowMotionFrame) {
        updatedState = advanceAllLoot(updatedState);
        updatedState = advanceAllEffects(updatedState);
    }
    // Make sure enemies array is up to date, and filter out removed enemies.
    updatedState.enemies = updatedState.enemies
        .map(enemy => updatedState.idMap[enemy.id])
        .filter(enemy => enemy);

    // Add new enemies/attacks.
    updatedState.enemies = [...updatedState.enemies, ...updatedState.newEnemies];
    const idMap = {};
    for (const enemy of updatedState.enemies) {
        idMap[enemy.id] = enemy;
    }
    updatedState.playerAttacks = [...currentPlayerAttacks, ...updatedState.newPlayerAttacks];
    updatedState.enemyAttacks = [...currentEnemyAttacks, ...updatedState.newEnemyAttacks];
    updatedState.neutralAttacks = [...currentNeutralAttacks, ...updatedState.newNeutralAttacks];
    updatedState.effects = [...updatedState.effects, ...updatedState.newEffects];
    updatedState.loot = [...updatedState.loot, ...updatedState.newLoot];

    return {...updatedState, idMap, paused: false};
};

const applyPlayerActions = (state, playerIndex, actions) => {
    const players = [...state.players];
    actions.confirm = actions.start || actions.melee || actions.special || actions.switch;
    players[playerIndex] = {...players[playerIndex], actions};
    if (!state.interacted) {
        for (var i in actions) {
            if (actions[i]) return {...state, interacted: true, players};
        }
    }
    return {...state, players};
};

module.exports = {
    getNewState,
    advanceState,
    applyPlayerActions,
};

const {
    advanceAttack, getAttackHitBox,
} = require('attacks');
const { getNewPlayerState, advanceHero, getHeroHitBox, damageHero, isPlayerInvulnerable, updatePlayerOnContinue } = require('heroes');
const {
    enemyData, damageEnemy, advanceEnemy,
    isIntersectingEnemyHitBoxes, enemyIsActive
} = require('enemies');
const { advanceAllLoot } = require('loot');
const { createEffect, addEffectToState, advanceAllEffects } = require('effects');

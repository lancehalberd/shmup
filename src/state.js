const Rectangle = require('Rectangle');

const {
    FRAME_LENGTH,
    EFFECT_DEFLECT_BULLET,
} = require('gameConstants');
const { applyCheckpointToState, getNewWorld, advanceWorld, clearSprites } = require('world');

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
    titleIndex: 0,
    paused: false,
    gameover: false,
    continueIndex: 0,
    world: getNewWorld(),
    bgm: 'bgm/area.mp3',
    interacted: false,
    checkpoint: null,
}));

const TEST_TIME = 0;

const advanceState = (state) => {
    let updatedState = {...state};
    if (state.world.time < TEST_TIME) {
        state.world.time = TEST_TIME;
    }
    if (updatedState.title) {
        let titleIndex = updatedState.titleIndex;
        if (updatedState.players[0].actions.start && titleIndex === 0) {
            let world = updatedState.world;
            return {...updatedState, title: false, world, bgm: world.bgm};
        }
        if (updatedState.players[0].actions.up) {
            titleIndex = (titleIndex + 2 - 1) % 2;
        }
        if (updatedState.players[0].actions.down) {
            titleIndex = (titleIndex + 1) % 2;
        }
        return {...updatedState, titleIndex};
    }
    if (state.gameover) {
        let continueIndex = updatedState.continueIndex;
        if (updatedState.players[0].actions.start) {
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
            return { ...updatedState, gameover: true, continueIndex: 0, };
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
    for (let playerIndex = 0; playerIndex < updatedState.players.length; playerIndex++) {
        updatedState = advanceHero(updatedState, playerIndex);
    }
    updatedState = advanceWorld(updatedState);
    let currentPlayerAttacks = updatedState.playerAttacks.map(attack => advanceAttack(updatedState, attack)).filter(attack => !attack.done);
    for (let enemy of updatedState.enemies) {
        enemy = updatedState.idMap[enemy.id];
        if (enemy) updatedState = advanceEnemy(updatedState, enemy);
    }
    for (let enemy of updatedState.enemies) {
        enemy = updatedState.idMap[enemy.id];
        if (enemy && !enemy.dead && enemyData[enemy.type].shoot && enemy.left > 0) {
            // Don't shoot while spawning.
            if (!enemyData[enemy.type].spawnAnimation || enemy.spawned) {
                updatedState = enemyData[enemy.type].shoot(updatedState, enemy);
            }
        }
    }

    updatedState.sfx = {...updatedState.sfx};
    // Check for enemies hit by attacks.
    for (let i = 0; i < updatedState.enemies.length; i++) {
        let enemy = updatedState.idMap[updatedState.enemies[i].id];
        if (!enemy) continue;
        const enemyHitBox = getEnemyHitBox(enemy);
        for (let j = 0; j < currentPlayerAttacks.length && enemy && !enemy.dead && updatedState.idMap[enemy.id]; j++) {
            const attack = currentPlayerAttacks[j];
            if (!attack.done && !attack.hitIds[enemy.id] && Rectangle.collision(enemyHitBox, attack)) {
                if (enemyData[enemy.type].isInvulnerable && enemyData[enemy.type].isInvulnerable(updatedState, enemy)) {
                    currentPlayerAttacks[j] = {...attack, done: !attack.piercing, hitIds: {...attack.hitIds, [enemy.id]: true}};
                } else {
                    currentPlayerAttacks[j] = {...attack,
                        damage: attack.piercing ? attack.damage : attack.damage - enemy.life,
                        done: !attack.piercing && (attack.damage - enemy.life) <= 0,
                        hitIds: {...attack.hitIds, [enemy.id]: true},
                    };
                }
                updatedState = damageEnemy(updatedState, enemy.id, attack);
                enemy = updatedState.idMap[updatedState.enemies[i].id];
            }
        }
        for (let j = 0; j < updatedState.players.length; j++) {
            if (!isPlayerInvulnerable(updatedState, j) && !updatedState.players[j].done &&
                enemy && updatedState.idMap[enemy.id] && !enemy.dead &&
                Rectangle.collision(enemyHitBox, getHeroHitBox(updatedState.players[j]))
            ) {
                updatedState = damageHero(updatedState, j);
            }
        }
    }
    currentPlayerAttacks = currentPlayerAttacks.filter(attack => !attack.done);
    updatedState.enemies = updatedState.enemies.filter(enemy => updatedState.idMap[enemy.id]);

    // Advance enemy attacks and check for hitting the player.
    let currentEnemyAttacks = updatedState.enemyAttacks.map(attack => advanceAttack(updatedState, attack)).filter(attack => !attack.done);
    for (let i = 0; i < updatedState.players.length; i++) {
        if (isPlayerInvulnerable(updatedState, i)) continue;
        const playerHitBox = getHeroHitBox(updatedState.players[i]);
        for (let j = 0; j < currentEnemyAttacks.length && !updatedState.players[i].done; j++) {
            const attack = currentEnemyAttacks[j];
            if (Rectangle.collision(playerHitBox, attack)) {
                updatedState = damageHero(updatedState, i);
                currentEnemyAttacks[j] = {...attack, done: true};
            }
        }
    }
    // Player melee attacks can destroy enemy projectiles.
    for (let i = 0; i < currentPlayerAttacks.length; i++) {
        const attack = currentPlayerAttacks[i];
        if (!attack.melee || attack.done) continue;
        for (let j = 0; j < currentEnemyAttacks.length; j++) {
            const enemyAttack = currentEnemyAttacks[j];
            if (Rectangle.collision(attack, enemyAttack)) {
                currentEnemyAttacks[j] = {...enemyAttack, done: true};
                const deflectEffect = createEffect(EFFECT_DEFLECT_BULLET);
                deflectEffect.left = enemyAttack.left + (enemyAttack.width - deflectEffect.width ) / 2;
                deflectEffect.top = enemyAttack.top + (enemyAttack.height - deflectEffect.height ) / 2;
                updatedState = addEffectToState(updatedState, deflectEffect);
            }
        }
    }
    currentEnemyAttacks = currentEnemyAttacks.filter(attack => !attack.done);

    let currentNeutralAttacks = updatedState.neutralAttacks.map(attack => advanceAttack(updatedState, attack)).filter(attack => !attack.done);
    for (let i = 0; i < currentNeutralAttacks.length; i++) {
        const attack = currentNeutralAttacks[i];
        for (let j = 0; j < updatedState.players.length; j++) {
            const player = updatedState.players[j];
            const playerKey = `player${j}`;
            if (isPlayerInvulnerable(updatedState, j) || attack.hitIds[playerKey]) continue;
            const playerHitBox = getHeroHitBox(player);
            if (Rectangle.collision(playerHitBox, attack)) {
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
            if (!enemy || enemy.dead || attack.hitIds[enemy.id]) continue;
            const enemyHitBox = getEnemyHitBox(enemy);
            if (Rectangle.collision(enemyHitBox, attack)) {
                currentNeutralAttacks[i] = {...attack,
                    damage: attack.piercing ? attack.damage : attack.damage - enemy.life,
                    done: !attack.piercing && (attack.damage - enemy.life) <= 0,
                    hitIds: {...attack.hitIds, [enemy.id]: true},
                };
                updatedState = damageEnemy(updatedState, enemy.id, attack);
            }
        }
    }
    updatedState = advanceAllLoot(updatedState);
    updatedState = advanceAllEffects(updatedState);
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
    advanceAttack,
} = require('attacks');
const { getNewPlayerState, advanceHero, getHeroHitBox, damageHero, isPlayerInvulnerable, updatePlayerOnContinue } = require('heroes');
const { enemyData, damageEnemy, advanceEnemy, getEnemyHitBox } = require('enemies');
const { advanceAllLoot } = require('loot');
const { createEffect, addEffectToState, advanceAllEffects } = require('effects');

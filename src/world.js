const { FRAME_LENGTH, GAME_HEIGHT, WIDTH, HEIGHT, HUD_HEIGHT } = require('gameConstants');
const Rectangle = require('Rectangle');
const random = require('random');
const { drawImage } = require('draw');
const { getFrame } = require('animations');
const { getNewSpriteState } = require('sprites');

const allWorlds = {};
const checkpoints = {};
window.allWorlds = allWorlds;

const getNewLayer = (props) => ({
    sprites: [],
    ...props
});

const getNewWorld = () => getFieldWorldStart();

const clearSprites = (state) => {
    return {...state,
        enemies: [], loot: [], effects: [], playerAttacks: [], neutralAttacks: [], enemyAttacks: [],
        newEnemies:[], newLoot: [], newEffects: [], newPlayerAttacks: [], newNeutralAttacks: [], newEnemyAttacks: [],
    };
};

const addElementToLayer = (state, layerName) => {
    let world = state.world;
    const layer = {...world[layerName]};
    if (!layer.spriteData) {
        return state;
    }
    const elementsData = layer.spriteData;
    let newSprite = null, lastSprite = layer.sprites[layer.sprites.length - 1];
    let safety = 0;
    while ((!lastSprite || (lastSprite.left < WIDTH && lastSprite.next)) && safety++ < 20) {
        const spriteData = lastSprite ? elementsData[random.element(lastSprite.next)] : random.element(elementsData);
        if (!spriteData) {
            // This will often happen when transitioning between area types.
            break;
        }
        let {animation, scale} = spriteData;
        if (Array.isArray(animation)) {
            animation = random.element(animation);
        }
        let offset = lastSprite ? lastSprite.offset : 0;
        if (Array.isArray(offset)) {
            offset = random.element(offset);
        }
        if (lastSprite) {
            offset *= (lastSprite.scale || 1);
            offset += lastSprite.left + lastSprite.width;
        }
        let yOffset = spriteData.yOffset || 0
        if (Array.isArray(yOffset)) {
            yOffset = random.element(yOffset);
        }
        yOffset *= (spriteData.scale || 1);
        newSprite = getNewSpriteState({
            ...animation.frames[0],
            top: getBaseHeight(state) + layer.yOffset + yOffset,
            left: offset,
            ...spriteData,
            animation,
        });
        newSprite.height *= scale;
        newSprite.width *= scale;
        //console.log(getBaseHeight(state), layer.yOffset, yOffset, -newSprite.height);
        newSprite.top -= newSprite.height;
        if (!lastSprite) newSprite.left -= newSprite.width / 2; // Start with the first sprite half off of the screen.
        layer.sprites = [...layer.sprites, newSprite];
        //console.log(newSprite.left, newSprite.top, newSprite.width, newSprite.height);
        lastSprite = newSprite;
    }
    world = {...world, [layerName]: layer};
    return {...state, world};
};

function updateLayerSprite(state, layerName, spriteIndex, newProperties) {
    const sprites = [...state.world[layerName].sprites];
    sprites[spriteIndex] = {...sprites[spriteIndex], ...newProperties};
    const layer = {...state.world[layerName], sprites};
    const world = {...state.world, [layerName]: layer};
    return {...state, world};
}

const advanceLayer = (state, layerName) => {
    // Check to add a new element to scroll onto the screen.
    state = addElementToLayer(state, layerName);
    const layer = {...state.world[layerName]};
    if (!layer) return state;
    if (!layer.sprites) console.log(layerName, layer);

    for (let i = 0; i < state.world[layerName].sprites.length; i++) {
        let sprite = state.world[layerName].sprites[i];
        state = updateLayerSprite(state, layerName, i, {
            ...sprite,
            left: sprite.left + sprite.vx - state.world.vx * layer.xFactor,
            top: sprite.top + sprite.vy + state.world.vy * layer.yFactor,
            animationTime: sprite.animationTime + FRAME_LENGTH,
        });
        sprite = state.world[layerName].sprites[i];
        if (sprite.onHit) {
            const frame = getFrame(sprite.animation, sprite.animationTime);
            const hitBox = new Rectangle(frame.hitBox || frame).scale(sprite.scale).moveTo(sprite.left, sprite.top);
            for (const attack of state.playerAttacks) {
                if (Rectangle.collision(hitBox, attack)) {
                    state = sprite.onHit(state, layerName, i);
                    sprite = state.world[layerName].sprites[i];
                    break;
                }
            }
        }
        if (sprite.onContact) {
            const frame = getFrame(sprite.animation, sprite.animationTime);
            const hitBox = new Rectangle(frame.hitBox || frame).scale(sprite.scale).moveTo(sprite.left, sprite.top);
            const player = state.players[0];
            const heroHitBox = new Rectangle(getHeroHitBox(player));
            if (Rectangle.collision(hitBox, heroHitBox)) {
                state = sprite.onContact(state, layerName, i);
            } else {
                for (const enemy of state.enemies) {
                    if (Rectangle.collision(hitBox, getEnemyHitBox(enemy))) {
                        state = sprite.onContact(state, layerName, i);
                        break;
                    }
                }
            }
        }
    }
    const sprites = state.world[layerName].sprites.filter(sprite => sprite.left + sprite.width > 0);
    return {...state, world: {...state.world, [layerName]: {...state.world[layerName], sprites}}};
};

const advanceWorld = (state) => {
    let world = state.world;
    let {x, y, vx, vy, targetX, targetY, targetFrames, transitionFrames} = world
    x += vx;
    y += vy;
    y = Math.max(0, y);
    if (transitionFrames > 0) {
        transitionFrames--;
    }
    targetFrames--;
    if (targetFrames >= 1) {
        const targetVx = (targetX - x) / Math.ceil(targetFrames);
        vx = (targetVx + vx) / 2;
        const targetVy = (targetY - y) / Math.ceil(targetFrames);
        vy = Math.max((targetVy + vy) / 2, -y);
    } else {
        vx = (targetX - x);
        vy = Math.max((targetY - y), -y);
    }
    world = {...world, x, y, vx, vy, transitionFrames, targetFrames};
    state = {...state, world};
    if (allWorlds[world.type].advanceWorld) {
        state = allWorlds[world.type].advanceWorld(state);
    }
    for (const layerName of state.world.bgLayerNames) state = advanceLayer(state, layerName);
    for (const layerName of state.world.mgLayerNames) state = advanceLayer(state, layerName);
    for (const layerName of state.world.fgLayerNames) state = advanceLayer(state, layerName);
    return state;
};

const getGroundHeight = (state) => {
    // If the world has no ground layer, just return a very large number here.
    if (!state.world.ground) return 10000;
    return GAME_HEIGHT - state.world.groundHeight + state.world.y * state.world.ground.yFactor;
};

const getBaseHeight = (state) => {
    return GAME_HEIGHT + state.world.y * (state.world.ground ? state.world.ground.yFactor : 1);
}

const renderBackgroundLayer = (context, {frame, x, y, maxY}) => {
    x = Math.round(x);
    y = Math.round(y);
    if (typeof maxY === 'number') {
        y = Math.min(maxY, y);
    }
    const scale = frame.scale || 1;
    const left = Math.floor(x / scale) % frame.width;
    const right = Math.floor(x + WIDTH / scale) % frame.width;
    if (right <= left) {
        let leftWidth = frame.width - left;
        context.drawImage(frame.image, left, 0, leftWidth, frame.height,
            0, y, leftWidth, frame.height);
        context.drawImage(frame.image, 0, 0, right, frame.height,
            leftWidth, y, right, frame.height);
    } else {
        context.drawImage(frame.image, left, 0, frame.width, frame.height,
            0, y, frame.width, frame.height);
    }
};
// Render scenery that appear behind the main game sprites.
const renderBackground = (context, state) => {
    // The background needs to be rendered behind the HUD so that it can cover the screen
    // even when the HUD is not rendered (for example on the title screen).
    for (const layerName of state.world.bgLayerNames) renderLayer(context, state, layerName);
    context.save();
    context.translate(0, HUD_HEIGHT);
    for (const layerName of state.world.mgLayerNames) renderLayer(context, state, layerName);
    context.restore();
};
// Render scenery that appears in front of the main game sprites.
const renderForeground = (context, state) => {
    context.save();
    context.translate(0, HUD_HEIGHT);
    for (const layerName of state.world.fgLayerNames) renderLayer(context, state, layerName);
    context.restore();
};

const renderLayer = (context, state, layerName) => {
    const layer = state.world[layerName];
    let frame;
    if (layer.backgroundColor) {
        context.fillStyle = layer.backgroundColor;
        context.fillRect(0, 0, WIDTH, HEIGHT);
    }
    if (layer.animation) {
        frame = getFrame(layer.animation, state.world.time);
        renderBackgroundLayer(context, {frame,
            x: state.world.x * layer.xFactor + (layer.xOffset || 0),
            y: state.world.y * layer.yFactor + (layer.yOffset || 0),
        });
    }
    for (const sprite of layer.sprites) {
        frame = getFrame(sprite.animation, sprite.animationTime);
        drawImage(context, frame.image, frame, sprite);
    }
};

function setCheckpoint(state, checkpoint) {
    return {...state, checkpoint};
}

function applyCheckpointToState(state, checkpoint) {
    if (!checkpoint) checkpoint = state.checkpoint || CHECK_POINT_FIELD_START;
    state = checkpoints[checkpoint](state);
    return clearSprites({...state, bgm: state.world.bgm});
}

module.exports = {
    allWorlds,
    checkpoints,
    getNewWorld,
    getNewLayer,
    advanceWorld,
    getGroundHeight,
    renderBackground,
    renderForeground,
    clearSprites,
    updateLayerSprite,
    setCheckpoint,
    applyCheckpointToState,
};

const { getFieldWorldStart, CHECK_POINT_FIELD_START} = require('areas/field');
require('areas/forestUpper');
const { getEnemyHitBox } = require('enemies');
const { getHeroHitBox } = require('heroes');

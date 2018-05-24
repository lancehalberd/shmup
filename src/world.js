const { FRAME_LENGTH, GAME_HEIGHT, WIDTH, HEIGHT, HUD_HEIGHT } = require('gameConstants');
const Rectangle = require('Rectangle');
const random = require('random');
const { drawImage } = require('draw');
const { getFrame } = require('animations');
const { getNewSpriteState } = require('sprites');

const allWorlds = {};
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
        newSprite.top -= newSprite.height;
        if (!lastSprite) newSprite.left -= newSprite.width / 2; // Start with the first sprite half off of the screen.
        layer.sprites = [...layer.sprites, newSprite];
        lastSprite = newSprite;
    }
    world = {...world, [layerName]: layer};
    return {...state, world};
};

const advanceLayer = (state, layerName) => {
    state = addElementToLayer(state, layerName);
    let layer = {...state.world[layerName]};
    if (!layer) {
        return state;
    }
    if (!layer.sprites)console.log(layerName, layer);
    let sprites = [...layer.sprites];
    for (let i = 0; i < sprites.length; i++) {
        const sprite = sprites[i];
        sprites[i] = {
            ...sprite,
            left: sprite.left + sprite.vx - state.world.vx * layer.xFactor,
            top: sprite.top + sprite.vy + state.world.vy * layer.yFactor,
            animationTime: sprite.animationTime + FRAME_LENGTH,
        };
        if (sprites[i].onHit) {
            const frame = getFrame(sprites[i].animation, sprites[i].animationTime);
            const hitBox = new Rectangle(frame.hitBox || frame).scale(sprites[i].scale).moveTo(sprites[i].left, sprites[i].top);
            for (const attack of state.playerAttacks) {
                if (Rectangle.collision(hitBox, attack)) {
                    state = sprites[i].onHit(state, layerName, i);
                    layer = {...state.world[layerName]};
                    sprites = [...(layer.sprites || [])];
                    break;
                }
            }
        }
    }
    sprites = sprites.filter(sprite => sprite.left + sprite.width > 0);
    const world = {...state.world, [layerName]: {...layer, sprites}};
    return {...state, world };
};

const advanceWorld = (state) => {
    let world = state.world;
    let {x, y, vx, vy, targetX, targetY, targetFrames, time, transitionFrames} = world
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
        vy = (targetY - y);
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
    const left = (x) % frame.width;
    const right = (x + WIDTH) % frame.width;
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

module.exports = {
    allWorlds,
    getNewWorld,
    getNewLayer,
    advanceWorld,
    getGroundHeight,
    renderBackground,
    renderForeground,
    clearSprites,
};

const { getFieldWorld, getFieldWorldStart } = require('areas/field');
const { getStarWorld } = require('areas/stars');


const { createAnimation, r } = require('animations');
const { getNewSpriteState } = require('sprites');
const { addElementToLayer, applyCheckpointToState, setCheckpoint, allWorlds } = require('world');

function transitionToRestaurant(state) {
    const world = {
        ...state.world,
        type: CITY_TO_RESTAURANT,
        suppressAttacks: true,
    };
    return {...state, world};
}
/*
Let's drop the bulbs and just do what we do for other transitions here...


I also made the new window for entering the restaurant.
The window entering the restaurant has lines that are where different light bulbs go.
I also made strings to appear in the alley with little lightning sparks to animate over the broken bulbs over and over,
harming anything it is near. I am unsure if we should make the bulbs destroyable, as if the Knight has that power,
they may accidentally kill themselves a lot.
Anyway, the point of the bulbs around the window is to funnel the Knight into the open area,
and not too high as to clip through the wall.
*/

const CITY_TO_RESTAURANT = 'cityToRestaurant';
allWorlds[CITY_TO_RESTAURANT] = {
    advanceWorld: (state) => {
        state = updatePlayer(state, 0, {}, {targetLeft: 300, targetTop: 650});
        state = {...state,
            world: {
            ...state.world,
            targetFrames: 50 * 5 / 2,
            targetX: state.world.x + 1000,
            targetY: state.world.y,
        }};
        const cityWorld = state.world;
        state = setCheckpoint(state, CHECK_POINT_RESTAURANT_START);
        state = applyCheckpointToState(state, CHECK_POINT_RESTAURANT_START);
        // Use fade transition for now. Keep time from the city so the music stays in the same spot on transition
        return {...state, world: {...state.world, transitionFrames: 100, time: cityWorld.time}};
    },
};

module.exports = {
    transitionToRestaurant,
};

const { updatePlayer } = require('heroes');
const { CHECK_POINT_RESTAURANT_START } = require('areas/restaurant');

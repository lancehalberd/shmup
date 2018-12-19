/* global canvas */
const Rectangle = require('Rectangle');
const { drawImage, fillRectangle } = require('draw');

function getEventCoords(event) {
    const x = event.pageX - canvas.offsetLeft, y = event.pageY - canvas.offsetTop;
    return {x, y};
}
const threshold = 2;
function getOverEdges(rectangle, x, y) {
    const edges = {};
    if (y > rectangle.top - threshold && y < rectangle.bottom + threshold) {
        const lAbs = Math.abs(rectangle.left - x), rAbs = Math.abs(rectangle.right - x);
        if (lAbs < rAbs && lAbs < threshold) edges.left = true;
        else if (rAbs < threshold) edges.right = true;
    }
    if (x > rectangle.left - threshold && x < rectangle.right + threshold) {
        const tAbs = Math.abs(rectangle.top - y), bAbs = Math.abs(rectangle.bottom - y);
        if (tAbs < bAbs && tAbs < threshold) edges.top = true;
        else if (bAbs < threshold) edges.bottom = true;
    }
    return edges;
}

document.onmousedown = function(event) {
    const state = window.state;
    if (!state || !state.hitboxFrame) return;
    state.mousedown = true;
    if (state.selectedHitbox && state.overEdges) {
        state.selectedEdges = state.overEdges;
        console.log('over edges', Object.keys(state.overEdges));
        return;
    }
    state.selectedHitbox = state.overHitbox;
};
document.onmousemove = function (event) {
    const state = window.state;
    if (!state || !state.hitboxFrame) return;
    const { x, y } = getEventCoords(event);
    if (state.mousedown) ondrag(x, y);
    else onhover(x, y);
}
function ondrag(x, y) {
    const state = window.state;
    let dx = 0, dy =0;
    if (state.lastCoords) {
        dx = x - state.lastCoords.x;
        dy = y - state.lastCoords.y;
    }
    const selectedHitbox = state.selectedHitbox;
    state.lastCoords = {x, y};
    if (state.selectedEdges) {
        if (state.selectedEdges.left) {
            selectedHitbox.left += dx;
            selectedHitbox.width -= dx;
            if (selectedHitbox.width < 0) {
                selectedHitbox.left += selectedHitbox.width;
                selectedHitbox.width *= -1;
                delete state.selectedEdges.left;
                state.selectedEdges.right = true;
            }
        } else if (state.selectedEdges.right) {
            selectedHitbox.width += dx;
            if (selectedHitbox.width < 0) {
                selectedHitbox.left += selectedHitbox.width;
                selectedHitbox.width *= -1;
                delete state.selectedEdges.right;
                state.selectedEdges.left = true;
            }
        }
        if (state.selectedEdges.top) {
            selectedHitbox.top += dy;
            selectedHitbox.height -= dy;
            if (selectedHitbox.height < 0) {
                selectedHitbox.top += selectedHitbox.height;
                selectedHitbox.height *= -1;
                delete state.selectedEdges.top;
                state.selectedEdges.bottom = true;
            }
        } else if (state.selectedEdges.bottom) {
            selectedHitbox.height += dy;
            if (selectedHitbox.height < 0) {
                selectedHitbox.top += selectedHitbox.height;
                selectedHitbox.height *= -1;
                delete state.selectedEdges.bottom;
                state.selectedEdges.top = true;
            }
        }
    } else if (selectedHitbox) {
        selectedHitbox.left += dx;
        selectedHitbox.top += dy;
    } else if (dx || dy) {
        const hitbox = {
            left: Math.min(x, x - dx), width: Math.abs(dx),
            top: Math.min(y, y - dy), height: Math.abs(dy),
        };
        state.hitboxFrame.hitboxes = state.hitboxFrame.hitboxes || [];
        state.hitboxFrame.hitboxes.push(hitbox);
        state.selectedHitbox = hitbox;
        state.selectedEdges = {};
        if (x === hitbox.left) state.selectedEdges.left = true;
        else state.selectedEdges.right = true;
        if (y === hitbox.top) state.selectedEdges.top = true;
        else state.selectedEdges.bottom = true;
    }
}
function onhover(x, y) {
    const state = window.state;
    if (state.selectedHitbox) {
        const edges = getOverEdges(new Rectangle(state.selectedHitbox), x, y);
        if (Object.keys(edges).length) {
            state.overEdges = edges;
            return;
        }
        state.overEdges = null;
    }
    const frame = state.hitboxFrame;
    const hitboxes = frame.hitboxes || [];
    for (const hitbox of hitboxes) {
        if (new Rectangle(hitbox).containsPoint(x, y)) {
            state.overHitbox = hitbox;
            return;
        }
    }
    state.overHitbox = null;
}
document.onmouseup = function () {
    const state = window.state;
    if (!state || !state.hitboxFrame) return;
    state.mousedown = false;
    // Edges are only selected during drag operations.
    state.selectedEdges = null;
    state.lastCoords = null;
}

function renderHitboxes(context, state) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const frame = state.hitboxFrame;
    drawImage(context, frame.image, frame, new Rectangle(frame).moveTo(0, 0));
    const hitboxes = frame.hitboxes || [];
    for (const hitbox of hitboxes) {
        let color = 'rgba(255, 120, 0, 0.3)';
        if (hitbox === state.selectedHitbox) {
            color = 'rgba(255, 0, 0, 0.3)';
        } else if (hitbox === state.overHitbox) {
            color = 'rgba(255, 0, 0, 0.6)';
        }
        fillRectangle(context, color, hitbox);
    }
    const edges = state.selectedEdges || state.overEdges;
    if (edges) {
        const box = new Rectangle(state.selectedHitbox);
        context.beginPath();
        if (edges.left) {
            context.moveTo(box.left, box.top);
            context.lineTo(box.left, box.bottom);
        }
        if (edges.right) {
            context.moveTo(box.right, box.top);
            context.lineTo(box.right, box.bottom);
        }
        if (edges.top) {
            context.moveTo(box.left, box.top);
            context.lineTo(box.right, box.top);
        }
        if (edges.bottom) {
            context.moveTo(box.left, box.bottom);
            context.lineTo(box.right, box.bottom);
        }
        context.strokeStyle = 'black';
        context.stroke();
    }
}

function startEditingHitboxes(state, hitboxFrame) {
    window.document.onkeydown = function (event) {
        const state = window.state;
        // console.log(event.which);
        if (event.which === 8 && state.selectedHitbox) {
            const index = state.hitboxFrame.hitboxes.indexOf(state.selectedHitbox);
            state.hitboxFrame.hitboxes.splice(index, 1);
            state.selectedHitbox = null;
            state.overEdges = null;
            state.selectedEdges = null;
        }
        if (event.which === 13) {
            console.log(
                "[\n\t" +
                state.hitboxFrame.hitboxes.map(b => JSON.stringify(b)).join(",\n\t") +
                ",\n]"
            );
        }
    }
    return {...state, hitboxFrame};
}

module.exports = {
    renderHitboxes,
    startEditingHitboxes,
};


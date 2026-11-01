// Shared pointer handlers for clickable bodies. The canvas cursor is set in CSS from body classes:
// grab by default, pointer over a body, grabbing while dragging.
const DRAG_THRESHOLD_PX = 5;

// Total distance the pointer has travelled since it went down, written by the camera controller.
// The click event only knows the start and end points, so a drag that comes back would count as a click.
export const drag = { travelled: 0 };

export function selectHandlers(onSelect) {
    return {
        onClick: (event) => {
            event.stopPropagation();
            // A drag that happens to start and end on a body rotates the view; it is not a click.
            if (drag.travelled > DRAG_THRESHOLD_PX) return;
            onSelect();
        },
        onPointerOver: (event) => { event.stopPropagation(); document.body.classList.add('is-hovering'); },
        onPointerOut: () => { document.body.classList.remove('is-hovering'); },
    };
}

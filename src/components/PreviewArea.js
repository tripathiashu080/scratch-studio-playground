
import React, { useRef, useState } from "react";
import CatSprite from "./CatSprite";

export default function PreviewArea({ sprites = [], onUpdateSprite }) {
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  const startDrag = (event, sprite) => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    dragRef.current = {
      id: sprite.id,
      startX: event.clientX,
      startY: event.clientY,
      originalX: sprite.x,
      originalY: sprite.y,
    };

    setDraggingId(sprite.id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event) => {
    const drag = dragRef.current;
    const stage = stageRef.current;

    if (!drag || !stage || !onUpdateSprite) return;

    const rect = stage.getBoundingClientRect();

    // Convert the pointer movement into stage-relative coordinates.
    const x = drag.originalX + event.clientX - drag.startX;
    const y = drag.originalY + event.clientY - drag.startY;

    // Keep the sprite inside the stage.
    const halfWidth = 48;
    const halfHeight = 50;
    const maxX = Math.max(0, rect.width / 2 - halfWidth);
    const maxY = Math.max(0, rect.height / 2 - halfHeight);

    onUpdateSprite(drag.id, {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    });
  };

 const stopDrag = () => {
  const drag = dragRef.current;

  if (drag && onUpdateSprite) {
    onUpdateSprite(drag.id, {
      x: drag.originalX,
      y: drag.originalY,
    });
  }

  dragRef.current = null;
  setDraggingId(null);
};

  return (
    <section className="flex h-full min-h-[420px] flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="font-bold text-gray-800">Stage</h2>
        <span className="text-xs text-gray-500">
          {sprites.length} sprite{sprites.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        ref={stageRef}
        className="relative flex-1 overflow-hidden bg-white"
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <div className="pointer-events-none absolute inset-3 rounded-lg border border-gray-100 bg-gradient-to-br from-white to-blue-50" />

        {sprites.map((sprite) => (
          <div
            key={sprite.id}
            onPointerDown={(event) => startDrag(event, sprite)}
            style={{
              left: `calc(50% + ${sprite.x}px)`,
              top: `calc(50% + ${sprite.y}px)`,
              transform: `translate(-50%, -50%) rotate(${sprite.direction}deg)`,
              touchAction: "none",
              cursor: draggingId === sprite.id ? "grabbing" : "grab",
              zIndex: draggingId === sprite.id ? 20 : 1,
            }}
            className="absolute select-none"
          >
            {sprite.bubble && (
              <div
                className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 max-w-40 -translate-x-1/2 rounded-xl border px-3 py-2 text-sm shadow-md ${
                  sprite.bubbleType === "think"
                    ? "border-gray-300 bg-gray-100 text-gray-700"
                    : "border-gray-200 bg-white text-gray-800"
                }`}
              >
                {sprite.bubble}
              </div>
            )}

            <div className="pointer-events-none">
              <CatSprite />
            </div>

            <div className="pointer-events-none mt-1 text-center text-xs text-gray-500">
              {sprite.name}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

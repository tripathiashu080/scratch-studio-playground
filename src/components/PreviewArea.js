
import React from "react";
import CatSprite from "./CatSprite";

export default function PreviewArea({ sprites = [] }) {
  return (
    <section className="flex h-full min-h-[420px] flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="font-bold text-gray-800">Stage</h2>
        <span className="text-xs text-gray-500">
          {sprites.length} sprite{sprites.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden bg-white">
        <div className="absolute inset-3 rounded-lg border border-gray-100 bg-gradient-to-br from-white to-blue-50" />

        {sprites.map((sprite) => (
          <div
            key={sprite.id}
            className="absolute"
            style={{
              left: `calc(50% + ${sprite.x}px)`,
              top: `calc(50% + ${sprite.y}px)`,
              transform: `translate(-50%, -50%) rotate(${sprite.direction}deg)`,
              transition: "left 0.25s linear, top 0.25s linear, transform 0.2s linear",
            }}
          >
            {sprite.bubble && (
              <div
                className={`absolute bottom-full left-1/2 z-10 mb-2 max-w-40 -translate-x-1/2 rounded-xl border px-3 py-2 text-sm shadow-md ${
                  sprite.bubbleType === "think"
                    ? "border-gray-300 bg-gray-100 text-gray-700"
                    : "border-gray-200 bg-white text-gray-800"
                }`}
              >
                {sprite.bubble}
              </div>
            )}
            <CatSprite />
            <div className="mt-1 text-center text-xs text-gray-500">
              {sprite.name}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

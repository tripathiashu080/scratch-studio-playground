
import React, { useState } from "react";
import CustomBlockModal from "./CustomBlockModal";

const categories = [
  {
    name: "Motion",
    color: "#4C97FF",
    blocks: [
      { type: "move", label: "Move", value: 10 },
      { type: "turn", label: "Turn", value: 15 },
      { type: "goto", label: "Go to", x: 0, y: 0 },
    ],
  },
  {
    name: "Looks",
    color: "#9966FF",
    blocks: [
      { type: "say", label: "Say", message: "Hello!", seconds: 2 },
      { type: "think", label: "Think", message: "Hmm...", seconds: 2 },
    ],
  },
  {
    name: "Controls",
    color: "#FFAB19",
    blocks: [{ type: "repeat", label: "Repeat", times: 3, children: [] }],
  },
];

export default function Sidebar({
  onAddBlock,
  customBlocks = [],
  onMakeCustomBlock,
}) {
  const [showModal, setShowModal] = useState(false);

  const createBlock = (block) => ({
    ...block,
    id: `${block.type}-${Date.now()}-${Math.random()}`,
    ...(block.type === "repeat" || block.type === "custom"
      ? { children: [] }
      : {}),
  });

  const renderBlock = (block, color) => (
    <button
     key={block.id || block.customId || block.type}
      draggable
      onClick={() => onAddBlock(createBlock(block))}
      onDragStart={(event) => {
        event.dataTransfer.setData(
          "application/scratch-block",
          JSON.stringify(block)
        );
        event.dataTransfer.effectAllowed = "copy";
      }}
      style={{ backgroundColor: color }}
      className="mb-2 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-white shadow-sm"
    >
      {block.label}
      {block.type === "move" && ` ${block.value} steps`}
      {block.type === "turn" && ` ${block.value}°`}
      {block.type === "goto" && ` x: ${block.x}, y: ${block.y}`}
      {block.type === "say" && ` "${block.message}"`}
      {block.type === "think" && ` "${block.message}"`}
      {block.type === "repeat" && ` ${block.times} times`}
    </button>
  );

  return (
    <>
      <aside className="w-56 flex-none overflow-y-auto border-r bg-white p-3">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Blocks</h2>

        {categories.map((category) => (
          <section key={category.name} className="mb-5">
            <h3 className="mb-2 text-sm font-bold text-gray-500">
              {category.name}
            </h3>

            {category.blocks.map((block) =>
              renderBlock(block, category.color)
            )}
          </section>
        ))}

        <section className="mb-5">
          <h3 className="mb-2 text-sm font-bold text-gray-500">My Blocks</h3>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mb-3 block w-full rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-left text-sm font-semibold text-pink-700 hover:bg-pink-100"
          >
            + Make a Block
          </button>

          {customBlocks.map((definition) =>
            renderBlock(
              {
                type: "custom",
                customId: definition.id,
                label: definition.name,
                inputs: definition.inputs || [],
              },
              "#FF6680"
            )
          )}

          {customBlocks.length === 0 && (
            <p className="text-xs text-gray-400">
              Your custom blocks will appear here.
            </p>
          )}
        </section>
      </aside>

      {showModal && (
        <CustomBlockModal
          onClose={() => setShowModal(false)}
          onSave={(definition) => {
            onMakeCustomBlock(definition);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

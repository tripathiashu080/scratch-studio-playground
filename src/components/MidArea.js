
import React from "react";

const colors = {
  move: "#4C97FF",
  turn: "#4C97FF",
  goto: "#4C97FF",
  say: "#9966FF",
  think: "#9966FF",
  repeat: "#FFAB19",
  custom: "#FF6680",
};

function Field({ value, onChange, type = "number", width = "64px" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(event) =>
        onChange(
          type === "number" ? Number(event.target.value) : event.target.value
        )
      }
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      className="rounded border border-black/10 bg-white px-2 py-1 text-gray-800 outline-none focus:ring-2 focus:ring-blue-200"
      style={{ width }}
    />
  );
}

function BlockLabel({ block, onUpdate }) {
  switch (block.type) {
    case "move":
      return (
        <span className="flex flex-wrap items-center gap-2">
          Move
          <Field
            value={block.value}
            onChange={(value) => onUpdate({ value })}
          />
          steps
        </span>
      );

    case "turn":
      return (
        <span className="flex flex-wrap items-center gap-2">
          Turn
          <Field
            value={block.value}
            onChange={(value) => onUpdate({ value })}
          />
          degrees
        </span>
      );

    case "goto":
      return (
        <span className="flex flex-wrap items-center gap-2">
          Go to x:
          <Field value={block.x} onChange={(x) => onUpdate({ x })} />
          y:
          <Field value={block.y} onChange={(y) => onUpdate({ y })} />
        </span>
      );

    case "say":
    case "think":
      return (
        <span className="flex flex-wrap items-center gap-2">
          {block.type === "say" ? "Say" : "Think"}
          <Field
            type="text"
            width="100px"
            value={block.message}
            onChange={(message) => onUpdate({ message })}
          />
          for
          <Field
            value={block.seconds}
            onChange={(seconds) => onUpdate({ seconds })}
          />
          seconds
        </span>
      );

    case "repeat":
      return (
        <span className="flex flex-wrap items-center gap-2">
          Repeat
          <Field
            value={block.times}
            onChange={(times) => onUpdate({ times })}
          />
          times
        </span>
      );

    case "custom":
      return <span>{block.label || "Custom Block"}</span>;

    default:
      return block.type;
  }
}

export default function MidArea({
  blocks,
  onAddBlock,
  onRemoveBlock,
  onMoveBlock,
  onUpdateBlock,
}) {
  const readBlock = (event) => {
    const data = event.dataTransfer.getData("application/scratch-block");
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const makeBlock = (block) => ({
    ...block,
    id: `${block.type}-${Date.now()}-${Math.random()}`,
    ...(block.type === "repeat" || block.type === "custom"
      ? { children: [] }
      : {}),
  });

  const handleDrop = (event, targetId = null, parentId = null) => {
    event.preventDefault();
    event.stopPropagation();

    const moving = event.dataTransfer.getData("application/scratch-reorder");

    if (moving) {
      try {
        const source = JSON.parse(moving);

        if (source.id !== targetId) {
          onMoveBlock(
            source.id,
            targetId,
            source.parentId,
            parentId
          );
        }
      } catch {
      }
      return;
    }

    const template = readBlock(event);
    if (template) onAddBlock(makeBlock(template), parentId);
  };

  const renderBlocks = (items, parentId = null) =>
    items.map((block) => {
      const isContainer =
        block.type === "repeat" || block.type === "custom";

      return (
        <div
          key={block.id}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData(
              "application/scratch-reorder",
              JSON.stringify({ id: block.id, parentId })
            );
            event.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, block.id, parentId)}
          style={{ backgroundColor: colors[block.type] || "#64748b" }}
          className="mb-2 max-w-xl rounded-lg p-3 text-sm font-semibold text-white shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <BlockLabel
              block={block}
              onUpdate={(patch) => onUpdateBlock(block.id, patch)}
            />

            <button
              type="button"
              draggable={false}
              onClick={(event) => {
                event.stopPropagation();
                onRemoveBlock(block.id);
              }}
              className="rounded px-2 py-1 hover:bg-black/10"
              aria-label="Remove block"
            >
              ×
            </button>
          </div>

          {isContainer && (
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, null, block.id)}
              className="mt-3 min-h-14 rounded-lg border-2 border-dashed border-white/70 bg-black/10 p-3"
            >
              {block.children?.length ? (
                renderBlocks(block.children, block.id)
              ) : (
                <p className="text-xs font-normal text-white/80">
                  Drop blocks inside this {block.type === "repeat" ? "repeat" : "custom block"}
                </p>
              )}
            </div>
          )}
        </div>
      );
    });

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-gray-50 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">Code workspace</h2>
        <p className="text-sm text-gray-500">
          Edit block values or drag blocks into the workspace and Repeat or
          Custom Block containers.
        </p>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDrop(event)}
        className="min-h-[65vh] rounded-xl border-2 border-dashed border-gray-300 bg-white p-4"
      >
        {blocks.length ? (
          renderBlocks(blocks)
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center text-center text-gray-400">
            <div className="mb-3 text-4xl">🧩</div>
            <p className="font-medium">Your script starts here</p>
            <p className="mt-1 text-sm">
              Click a palette block or drag it here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

import React, { useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import MidArea from "./components/MidArea";
import PreviewArea from "./components/PreviewArea";
import { runWorld } from "./utils/animationEngine";

function createSprite(index) {
  return {
    id: `sprite-${Date.now()}-${index}`,
    name: index === 1 ? "Cat" : `Sprite ${index}`,
    x: index === 1 ? -100 : 100,
    y: 0,
    direction: index === 1 ? 0 : 180,
    bubble: "",
    bubbleType: "say",
    blocks: [],
  };
}

function updateTree(items, id, patch) {
  return items.map((item) => {
    if (item.id === id) return { ...item, ...patch };

    if (item.children) {
      return {
        ...item,
        children: updateTree(item.children, id, patch),
      };
    }

    return item;
  });
}

function removeTree(items, id) {
  return items
    .filter((item) => item.id !== id)
    .map((item) =>
      item.children
        ? { ...item, children: removeTree(item.children, id) }
        : item,
    );
}

function findBlock(items, id) {
  for (const item of items) {
    if (item.id === id) return item;

    const nested = item.children && findBlock(item.children, id);
    if (nested) return nested;
  }

  return null;
}

function insertIntoParent(items, parentId, block) {
  if (!parentId) return [...items, block];

  return items.map((item) => {
    if (
      item.id === parentId &&
      (item.type === "repeat" || item.type === "custom")
    ) {
      return {
        ...item,
        children: [...(item.children || []), block],
      };
    }

    if (item.children) {
      return {
        ...item,
        children: insertIntoParent(item.children, parentId, block),
      };
    }

    return item;
  });
}

function insertBefore(items, targetId, block) {
  const result = [];

  for (const item of items) {
    if (item.id === targetId) result.push(block);

    result.push(
      item.children
        ? {
            ...item,
            children: insertBefore(item.children, targetId, block),
          }
        : item,
    );
  }

  return result;
}

function insertAfter(items, targetId, block) {
  const result = [];

  for (const item of items) {
    result.push(item);

    if (item.id === targetId) {
      result.push(block);
    } else if (item.children) {
      result[result.length - 1] = {
        ...item,
        children: insertAfter(item.children, targetId, block),
      };
    }
  }

  return result;
}

function moveInTree(
  items,
  sourceId,
  targetId,
  targetParentId,
  position = "inside",
) {
  const moving = findBlock(items, sourceId);

  if (!moving || moving.id === targetId) return items;

  const contains = (item, id) =>
    item.id === id ||
    (item.children || []).some((child) => contains(child, id));

  // Prevent moving a block into itself or its descendants.
  if (targetParentId && contains(moving, targetParentId)) return items;
  if (targetId && contains(moving, targetId)) return items;

  const withoutSource = removeTree(items, sourceId);

  if (targetId) {
    return position === "after"
      ? insertAfter(withoutSource, targetId, moving)
      : insertBefore(withoutSource, targetId, moving);
  }

  return insertIntoParent(withoutSource, targetParentId, moving);
}

function makeBlock(block) {
  const newBlock = {
    ...block,
    id: `${block.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };

  if (block.type === "repeat" || block.type === "custom") {
    newBlock.children = [];
  } else {
    delete newBlock.children;
  }

  return newBlock;
}

export default function App() {
  const [sprites, setSprites] = useState([createSprite(1)]);
  const [selectedId, setSelectedId] = useState("sprite-1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [collisionMessage, setCollisionMessage] = useState("");
  const [customBlocks, setCustomBlocks] = useState([]);
  const running = useRef(false);

  const selectedSprite =
    sprites.find((sprite) => sprite.id === selectedId) || sprites[0];

  const updateScript = (spriteId, updater) => {
    setSprites((current) =>
      current.map((sprite) =>
        sprite.id === spriteId
          ? { ...sprite, blocks: updater(sprite.blocks) }
          : sprite,
      ),
    );
  };

  const addBlock = (block, parentId = null) => {
    if (!selectedSprite || running.current) return;

    const newBlock = makeBlock(block);

    updateScript(selectedSprite.id, (current) =>
      insertIntoParent(current, parentId, newBlock),
    );
  };

  const addCustomBlock = (definition) => {
    setCustomBlocks((current) => [...current, definition]);
  };

  const updateBlock = (id, patch) => {
    if (!selectedSprite || running.current) return;

    updateScript(selectedSprite.id, (current) =>
      updateTree(current, id, patch),
    );
  };

  const removeBlock = (id) => {
    if (!selectedSprite || running.current) return;

    updateScript(selectedSprite.id, (current) => removeTree(current, id));
  };

  const moveBlock = (
    sourceId,
    targetId,
    sourceParentId,
    targetParentId,
    position = "inside",
  ) => {
    if (!selectedSprite || running.current) return;

    updateScript(selectedSprite.id, (current) =>
      moveInTree(current, sourceId, targetId, targetParentId, position),
    );
  };

  const addSprite = () => {
    if (sprites.length >= 8 || running.current) return;

    const nextIndex = sprites.length + 1;
    const sprite = createSprite(nextIndex);

    setSprites((current) => [...current, sprite]);
    setSelectedId(sprite.id);
  };

  const updateSprite = (id, patchOrUpdater) => {
  setSprites((current) =>
    current.map((sprite) => {
      if (sprite.id !== id) return sprite;

      const patch =
        typeof patchOrUpdater === "function"
          ? patchOrUpdater(sprite)
          : patchOrUpdater;

      return { ...sprite, ...patch };
    })
  );
};

  const play = async () => {
    if (running.current) return;

    running.current = true;
    setIsPlaying(true);
    setCollisionMessage("");

    try {
      await runWorld(
        sprites,
        (updatedSprites) => {
          if (running.current) setSprites(updatedSprites);
        },
        () => running.current,
        (firstId, secondId, updatedWorld) => {
          setCollisionMessage("Collision detected! Movement programs swapped.");

          if (!updatedWorld) return;

          setSprites((currentSprites) =>
            currentSprites.map((sprite) => {
              const runtimeSprite = updatedWorld.find(
                (item) => item.id === sprite.id,
              );

              if (!runtimeSprite) return sprite;

              return {
                ...sprite,
                blocks: runtimeSprite.blocks,
              };
            }),
          );
        },
      );
    } catch (error) {
      console.error("Animation failed:", error);
    } finally {
      running.current = false;
      setIsPlaying(false);
    }
  };

  const stop = () => {
    running.current = false;
    setIsPlaying(false);
  };

  const reset = () => {
    stop();

    setSprites((current) =>
      current.map((sprite) => ({
        ...sprite,
        x: 0,
        y: 0,
        direction: 0,
        bubble: "",
      })),
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-3 font-sans">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-5 py-3 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Scratch Studio</h1>
          <p className="text-xs text-gray-500">Visual programming playground</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={addSprite}
            disabled={sprites.length >= 8 || isPlaying}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
          >
            + Add sprite
          </button>

          <button
            onClick={play}
            disabled={isPlaying}
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            ▶ Play all
          </button>

          <button
            onClick={stop}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white"
          >
            ■ Stop
          </button>

          <button
            onClick={reset}
            className="rounded-lg border bg-white px-4 py-2 text-sm"
          >
            Reset
          </button>
        </div>
      </header>

      {collisionMessage && (
        <div className="mb-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-800">
          ⚡ {collisionMessage}
        </div>
      )}

      <div className="flex min-h-[calc(100vh-100px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <Sidebar
          onAddBlock={addBlock}
          customBlocks={customBlocks}
          onMakeCustomBlock={addCustomBlock}
          disabled={isPlaying}
        />

        <MidArea
          blocks={selectedSprite?.blocks || []}
          onAddBlock={addBlock}
          onRemoveBlock={removeBlock}
          onMoveBlock={moveBlock}
          onUpdateBlock={updateBlock}
          disabled={isPlaying}
        />

        <div className="flex w-1/3 min-w-[260px] flex-col border-l border-gray-200 bg-white">
          <div className="border-b p-3">
            <h2 className="mb-2 text-sm font-bold text-gray-700">Sprites</h2>

            <div className="flex flex-wrap gap-2">
              {sprites.map((sprite) => (
                <button
                  key={sprite.id}
                  onClick={() => !isPlaying && setSelectedId(sprite.id)}
                  disabled={isPlaying}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    sprite.id === selectedId
                      ? "border-purple-500 bg-purple-50 font-semibold text-purple-700"
                      : "border-gray-200"
                  }`}
                >
                  {sprite.name}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <PreviewArea sprites={sprites} onUpdateSprite={updateSprite} />
          </div>
        </div>
      </div>
    </div>
  );
}

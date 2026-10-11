export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function getMoveBlocks(blocks = []) {
  return blocks.flatMap((block) => [
    ...(block.type === "move" ? [block] : []),
    ...getMoveBlocks(block.children || []),
  ]);
}

function swapMovementPrograms(first, second) {
  const firstMoves = getMoveBlocks(first.blocks);
  const secondMoves = getMoveBlocks(second.blocks);

  if (!firstMoves.length || !secondMoves.length) {
    return false;
  }

  const firstValues = firstMoves.map((block) => block.value);
  const secondValues = secondMoves.map((block) => block.value);

  firstMoves.forEach((block, index) => {
    block.value = secondValues[index % secondValues.length];
  });

  secondMoves.forEach((block, index) => {
    block.value = firstValues[index % firstValues.length];
  });

  return true;
}

function detectCollisions(world, collidingPairs, onCollision) {
  for (let i = 0; i < world.length; i += 1) {
    for (let j = i + 1; j < world.length; j += 1) {
      const first = world[i];
      const second = world[j];

      const dx = first.x - second.x;
      const dy = first.y - second.y;

      const touching = Math.hypot(dx, dy) < 70;
      const key = [first.id, second.id].sort().join(":");

      if (!touching) {
        collidingPairs.delete(key);
        continue;
      }

      if (collidingPairs.has(key)) {
        continue;
      }

      collidingPairs.add(key);

      const swapped = swapMovementPrograms(first, second);

      if (swapped) {
        onCollision?.(first.id, second.id, JSON.parse(JSON.stringify(world)));
      }
    }
  }
}

export async function runWorld(
  initialSprites,
  publish,
  isRunning,
  onCollision = () => {},
) {
  const world = JSON.parse(JSON.stringify(initialSprites));
  const collidingPairs = new Set();

  const refresh = () => {
    if (!isRunning()) return;

    publish(JSON.parse(JSON.stringify(world)));
  };

  async function execute(sprite, blocks = []) {
    console.log("Executing blocks:", blocks);
    for (const block of blocks) {
      console.log("Current block:", block.type, block);

      if (!isRunning()) return;

      if (block.type === "repeat") {
        const count = clamp(Number(block.times) || 0, 0, 100);

        for (let i = 0; i < count && isRunning(); i += 1) {
          await execute(sprite, block.children || []);

          if (i < count - 1 && isRunning()) {
            await sleep(400);
          }
        }

        continue;
      }

      if (block.type === "custom") {
        await execute(sprite, block.children || []);
        continue;
      }

      if (block.type === "move") {
        const distance = (Number(block.value) || 0) * 3;
        const radians = (sprite.direction * Math.PI) / 180;

        sprite.x += Math.cos(radians) * distance;
        sprite.y += Math.sin(radians) * distance;

        refresh();
        detectCollisions(world, collidingPairs, onCollision);
        refresh();

        await sleep(300);
      }

      if (block.type === "turn") {
        sprite.direction += Number(block.value) || 0;

        refresh();

        await sleep(200);
        continue;
      }

      if (block.type === "goto") {
        sprite.x = Number(block.x) || 0;
        sprite.y = Number(block.y) || 0;

        refresh();

        if (!isRunning()) return;

        detectCollisions(world, collidingPairs, onCollision);

        refresh();
        continue;
      }

      if (block.type === "say" || block.type === "think") {
        sprite.bubble = block.message || "";
        sprite.bubbleType = block.type;

        refresh();

        await sleep(clamp(Number(block.seconds) || 0, 0, 30) * 1000);

        if (!isRunning()) return;

        sprite.bubble = "";

        refresh();
      }
    }
  }

  try {
    await Promise.all(
      world.map((sprite) => execute(sprite, sprite.blocks || [])),
    );
  } finally {
    refresh();
  }

  return world;
}

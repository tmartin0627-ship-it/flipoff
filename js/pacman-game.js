// =============================================================
//  KÖLSCH-MAN  —  A Pac-Man game with Cologne theme
//  Player: Kölner Dom (sideways)  |  Pellets: Kölsch glasses
// =============================================================

(() => {
  "use strict";

  // ── Constants ──────────────────────────────────────────────
  const TILE = 28;
  const COLS = 21;
  const ROWS = 23;
  const WIDTH = COLS * TILE;
  const HEIGHT = ROWS * TILE;
  const FPS = 60;

  // Directions
  const DIR = { NONE: 0, UP: 1, DOWN: 2, LEFT: 3, RIGHT: 4 };
  const DX = { [DIR.NONE]: 0, [DIR.UP]: 0, [DIR.DOWN]: 0, [DIR.LEFT]: -1, [DIR.RIGHT]: 1 };
  const DY = { [DIR.NONE]: 0, [DIR.UP]: -1, [DIR.DOWN]: 1, [DIR.LEFT]: 0, [DIR.RIGHT]: 0 };

  // Map legend: 1=wall, 0=path+dot, 2=empty path, 3=power pellet(big Kölsch), 4=ghost house
  const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,0,1],
    [1,3,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,3,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,1,1],
    [2,2,2,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,2,2,2],
    [1,1,1,1,0,1,0,1,1,4,4,4,1,1,0,1,0,1,1,1,1],
    [0,0,0,0,0,0,0,1,4,4,4,4,4,1,0,0,0,0,0,0,0],
    [1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1],
    [2,2,2,1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,2,2,2],
    [1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,0,1,0,0,1,1,1,0,1,1,0,1],
    [1,3,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,3,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,0,1,0,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];

  // Ghost colors (Karneval themed)
  const GHOST_COLORS = ["#ff0000", "#ff69b4", "#00ccff", "#ff8c00"];
  const GHOST_SCARED_COLOR = "#2222cc";

  // ── Canvas Setup ───────────────────────────────────────────
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // ── Game State ─────────────────────────────────────────────
  let map, player, ghosts, score, lives, level, gameRunning, animFrame;
  let totalDots, dotsEaten, powerTimer, gameWon;

  // ── DOM refs ───────────────────────────────────────────────
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const levelEl = document.getElementById("level");
  const overlay = document.getElementById("overlay");
  const gameOverOverlay = document.getElementById("game-over-overlay");
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-btn");

  // ── Input ──────────────────────────────────────────────────
  let nextDir = DIR.NONE;
  const keyMap = {
    ArrowUp: DIR.UP, ArrowDown: DIR.DOWN, ArrowLeft: DIR.LEFT, ArrowRight: DIR.RIGHT,
    w: DIR.UP, s: DIR.DOWN, a: DIR.LEFT, d: DIR.RIGHT,
    W: DIR.UP, S: DIR.DOWN, A: DIR.LEFT, D: DIR.RIGHT,
  };

  document.addEventListener("keydown", (e) => {
    if (keyMap[e.key] !== undefined) {
      e.preventDefault();
      nextDir = keyMap[e.key];
    }
  });

  // ── Touch controls ────────────────────────────────────────
  let touchStartX = 0, touchStartY = 0;
  canvas.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  canvas.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      nextDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
    } else {
      nextDir = dy > 0 ? DIR.DOWN : DIR.UP;
    }
  });

  // ── Map helpers ────────────────────────────────────────────
  function cloneMap() {
    return MAP.map(r => [...r]);
  }

  function isWalkable(col, row) {
    // Tunnel wrap
    if (col < 0 || col >= COLS) return true;
    if (row < 0 || row >= ROWS) return false;
    return map[row][col] !== 1;
  }

  function wrapCol(col) {
    if (col < 0) return COLS - 1;
    if (col >= COLS) return 0;
    return col;
  }

  // ── Player (Kölner Dom) ────────────────────────────────────
  function createPlayer() {
    return {
      col: 10, row: 16,
      px: 10 * TILE + TILE / 2,
      py: 16 * TILE + TILE / 2,
      dir: DIR.NONE,
      nextDir: DIR.NONE,
      speed: 2,
      mouthAngle: 0,
      mouthOpen: true,
    };
  }

  // ── Ghosts ─────────────────────────────────────────────────
  function createGhosts() {
    const startPositions = [
      { col: 9, row: 10 },
      { col: 10, row: 10 },
      { col: 11, row: 10 },
      { col: 10, row: 8 },
    ];
    return startPositions.map((pos, i) => ({
      col: pos.col, row: pos.row,
      px: pos.col * TILE + TILE / 2,
      py: pos.row * TILE + TILE / 2,
      dir: DIR.UP,
      speed: 1.4 + level * 0.15,
      color: GHOST_COLORS[i],
      scared: false,
      eaten: false,
      releaseTimer: i * 120,
    }));
  }

  // ── Drawing ────────────────────────────────────────────────

  function drawMap() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE;
        const y = r * TILE;
        const cell = map[r][c];

        if (cell === 1) {
          // Wall - dark blue with lighter border (classic pac-man feel but Köln blue)
          ctx.fillStyle = "#0d1b4a";
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = "#1a3a8a";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
        } else if (cell === 0) {
          // Dot = small Kölsch glass
          drawKolsch(x + TILE / 2, y + TILE / 2, false);
        } else if (cell === 3) {
          // Power pellet = big Kölsch
          drawKolsch(x + TILE / 2, y + TILE / 2, true);
        }
        // 2 = empty, 4 = ghost house (transparent)
      }
    }
  }

  function drawKolsch(cx, cy, big) {
    const h = big ? 16 : 8;
    const w = big ? 8 : 4;
    const x = cx - w / 2;
    const y = cy - h / 2;

    // Glass body
    ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();

    // Beer fill
    const beerH = h * 0.75;
    ctx.fillStyle = big ? "#ffd700" : "#daa520";
    ctx.fillRect(x + 0.5, y + (h - beerH), w - 1, beerH - 0.5);

    // Foam
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 0.5, y + (h - beerH) - 1, w - 1, big ? 3 : 2);

    if (big) {
      // Glow for power pellet
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawDom(px, py, dir, mouthAngle) {
    // Kölner Dom as Pac-Man: sideways cathedral silhouette that "eats"
    ctx.save();
    ctx.translate(px, py);

    // Rotate based on direction
    let rot = 0;
    if (dir === DIR.RIGHT) rot = 0;
    else if (dir === DIR.DOWN) rot = Math.PI / 2;
    else if (dir === DIR.LEFT) rot = Math.PI;
    else if (dir === DIR.UP) rot = -Math.PI / 2;
    ctx.rotate(rot);

    const size = TILE * 0.9;
    const half = size / 2;

    // The Dom body - shaped like a cathedral silhouette opening/closing as mouth
    const mouth = mouthAngle * 0.4; // mouth opening in radians

    // Cathedral color
    ctx.fillStyle = "#c9a84c";
    ctx.strokeStyle = "#8b7332";
    ctx.lineWidth = 1.5;

    // Draw cathedral shape with mouth
    ctx.beginPath();

    // Start from the mouth opening (right side, center)
    ctx.moveTo(half * 0.3, -mouth * half);

    // Top spire (the twin towers!)
    ctx.lineTo(-half * 0.1, -half * 0.35);
    ctx.lineTo(-half * 0.2, -half * 0.9);  // left tower tip
    ctx.lineTo(-half * 0.3, -half * 0.5);
    ctx.lineTo(-half * 0.45, -half * 0.5);

    // Central spire
    ctx.lineTo(-half * 0.5, -half * 0.7);
    ctx.lineTo(-half * 0.55, -half * 0.5);

    // Continue around the back
    ctx.lineTo(-half * 0.7, -half * 0.4);
    ctx.lineTo(-half * 0.85, -half * 0.3);
    ctx.lineTo(-half, -half * 0.15);
    ctx.lineTo(-half, half * 0.15);
    ctx.lineTo(-half * 0.85, half * 0.3);
    ctx.lineTo(-half * 0.7, half * 0.4);

    // Bottom part (mirror)
    ctx.lineTo(-half * 0.55, half * 0.5);
    ctx.lineTo(-half * 0.5, half * 0.7);
    ctx.lineTo(-half * 0.45, half * 0.5);
    ctx.lineTo(-half * 0.3, half * 0.5);
    ctx.lineTo(-half * 0.2, half * 0.9);  // right tower tip
    ctx.lineTo(-half * 0.1, half * 0.35);

    // Back to mouth
    ctx.lineTo(half * 0.3, mouth * half);

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gothic window details
    ctx.fillStyle = "#5a9fd4";
    ctx.globalAlpha = 0.7;

    // Rose window (circle)
    ctx.beginPath();
    ctx.arc(-half * 0.25, 0, half * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Small windows
    ctx.fillRect(-half * 0.55, -half * 0.15, half * 0.08, half * 0.12);
    ctx.fillRect(-half * 0.55, half * 0.05, half * 0.08, half * 0.12);

    ctx.globalAlpha = 1.0;

    // Cross on top of the tallest spire
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 1.5;
    // Left tower cross
    ctx.beginPath();
    ctx.moveTo(-half * 0.2, -half * 0.9);
    ctx.lineTo(-half * 0.2, -half * 1.05);
    ctx.moveTo(-half * 0.27, -half * 0.97);
    ctx.lineTo(-half * 0.13, -half * 0.97);
    ctx.stroke();
    // Right tower cross
    ctx.beginPath();
    ctx.moveTo(-half * 0.2, half * 0.9);
    ctx.lineTo(-half * 0.2, half * 1.05);
    ctx.moveTo(-half * 0.27, half * 0.97);
    ctx.lineTo(-half * 0.13, half * 0.97);
    ctx.stroke();

    ctx.restore();
  }

  function drawGhost(ghost) {
    const { px, py, color, scared, eaten } = ghost;
    const size = TILE * 0.85;
    const half = size / 2;

    if (eaten) {
      // Just eyes floating back
      drawGhostEyes(px, py, half, ghost.dir);
      return;
    }

    ctx.save();
    ctx.translate(px, py);

    // Ghost body
    ctx.fillStyle = scared ? GHOST_SCARED_COLOR : color;
    if (scared && powerTimer < 120 && Math.floor(powerTimer / 15) % 2 === 0) {
      ctx.fillStyle = "#fff"; // flashing when about to recover
    }

    ctx.beginPath();
    ctx.arc(0, -half * 0.15, half * 0.75, Math.PI, 0);
    ctx.lineTo(half * 0.75, half * 0.5);

    // Wavy bottom
    const waves = 3;
    const waveW = (half * 1.5) / waves;
    const time = Date.now() / 150;
    for (let i = 0; i < waves; i++) {
      const bx = half * 0.75 - i * waveW - waveW / 2;
      const by = half * 0.5 + Math.sin(time + i) * 3;
      ctx.quadraticCurveTo(half * 0.75 - i * waveW, by + 4, bx, half * 0.5);
    }
    ctx.lineTo(-half * 0.75, half * 0.5);
    ctx.closePath();
    ctx.fill();

    // Eyes
    if (scared) {
      // Scared eyes - simple dots
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-half * 0.25, -half * 0.2, 3, 0, Math.PI * 2);
      ctx.arc(half * 0.25, -half * 0.2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      drawGhostEyes(0, 0, half, ghost.dir);
    }

    // Karneval hat (small party hat on ghost)
    if (!scared) {
      ctx.fillStyle = color === "#ff0000" ? "#00cc00" : "#ff0000";
      ctx.beginPath();
      ctx.moveTo(0, -half * 0.9);
      ctx.lineTo(-half * 0.3, -half * 0.55);
      ctx.lineTo(half * 0.3, -half * 0.55);
      ctx.closePath();
      ctx.fill();
      // Pom-pom
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(0, -half * 0.95, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawGhostEyes(ox, oy, half, dir) {
    // White part
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(ox - half * 0.25, oy - half * 0.2, 5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(ox + half * 0.25, oy - half * 0.2, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils - look in direction of movement
    let pdx = 0, pdy = 0;
    if (dir === DIR.LEFT) pdx = -2;
    else if (dir === DIR.RIGHT) pdx = 2;
    else if (dir === DIR.UP) pdy = -2;
    else if (dir === DIR.DOWN) pdy = 2;

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(ox - half * 0.25 + pdx, oy - half * 0.2 + pdy, 2.5, 0, Math.PI * 2);
    ctx.arc(ox + half * 0.25 + pdx, oy - half * 0.2 + pdy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Movement logic ─────────────────────────────────────────

  function canMove(col, row, dir) {
    const nc = col + DX[dir];
    const nr = row + DY[dir];
    return isWalkable(nc, nr);
  }

  function moveEntity(entity) {
    const { speed, dir } = entity;
    if (dir === DIR.NONE) return;

    entity.px += DX[dir] * speed;
    entity.py += DY[dir] * speed;

    // Tunnel wrapping
    if (entity.px < -TILE / 2) entity.px = WIDTH + TILE / 2;
    if (entity.px > WIDTH + TILE / 2) entity.px = -TILE / 2;

    // Snap to grid when reaching tile center
    const targetX = entity.col * TILE + TILE / 2 + DX[dir] * TILE;
    const targetY = entity.row * TILE + TILE / 2 + DY[dir] * TILE;

    const dx = targetX - entity.px;
    const dy = targetY - entity.py;

    if (Math.abs(DX[dir] * dx) <= speed && Math.abs(DY[dir] * dy) <= speed) {
      entity.col = wrapCol(entity.col + DX[dir]);
      entity.row = entity.row + DY[dir];
      entity.px = entity.col * TILE + TILE / 2;
      entity.py = entity.row * TILE + TILE / 2;
      return true; // reached new tile
    }
    return false;
  }

  function updatePlayer() {
    // Animate mouth
    if (player.mouthOpen) {
      player.mouthAngle += 0.08;
      if (player.mouthAngle >= 1) player.mouthOpen = false;
    } else {
      player.mouthAngle -= 0.08;
      if (player.mouthAngle <= 0) player.mouthOpen = true;
    }

    // Try to turn to requested direction
    if (nextDir !== DIR.NONE && canMove(player.col, player.row, nextDir)) {
      // Only change direction when centered on a tile
      const cx = player.col * TILE + TILE / 2;
      const cy = player.row * TILE + TILE / 2;
      if (Math.abs(player.px - cx) < 3 && Math.abs(player.py - cy) < 3) {
        player.dir = nextDir;
        player.px = cx;
        player.py = cy;
      }
    }

    if (player.dir === DIR.NONE) return;

    // Check if we can continue in current direction
    const cx = player.col * TILE + TILE / 2;
    const cy = player.row * TILE + TILE / 2;
    if (Math.abs(player.px - cx) < 2 && Math.abs(player.py - cy) < 2) {
      if (!canMove(player.col, player.row, player.dir)) {
        player.px = cx;
        player.py = cy;
        player.dir = DIR.NONE;
        return;
      }
    }

    const reached = moveEntity(player);
    if (reached) {
      // Check for dot eating
      const cell = map[player.row][player.col];
      if (cell === 0) {
        map[player.row][player.col] = 2;
        score += 10;
        dotsEaten++;
      } else if (cell === 3) {
        map[player.row][player.col] = 2;
        score += 50;
        dotsEaten++;
        activatePowerMode();
      }
    }
  }

  function activatePowerMode() {
    powerTimer = 480; // ~8 seconds at 60fps
    ghosts.forEach(g => {
      if (!g.eaten) g.scared = true;
    });
  }

  function updateGhosts() {
    if (powerTimer > 0) {
      powerTimer--;
      if (powerTimer <= 0) {
        ghosts.forEach(g => { g.scared = false; });
      }
    }

    ghosts.forEach((ghost) => {
      if (ghost.releaseTimer > 0) {
        ghost.releaseTimer--;
        return;
      }

      // Reached tile center - pick new direction
      const cx = ghost.col * TILE + TILE / 2;
      const cy = ghost.row * TILE + TILE / 2;

      if (Math.abs(ghost.px - cx) < 2 && Math.abs(ghost.py - cy) < 2) {
        ghost.px = cx;
        ghost.py = cy;
        pickGhostDirection(ghost);
      }

      moveEntity(ghost);
    });
  }

  function pickGhostDirection(ghost) {
    const possible = [];
    const opposite = { [DIR.UP]: DIR.DOWN, [DIR.DOWN]: DIR.UP, [DIR.LEFT]: DIR.RIGHT, [DIR.RIGHT]: DIR.LEFT, [DIR.NONE]: DIR.NONE };

    [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT].forEach(d => {
      if (d !== opposite[ghost.dir] && canMove(ghost.col, ghost.row, d)) {
        // Don't re-enter ghost house unless eaten
        const nr = ghost.row + DY[d];
        const nc = wrapCol(ghost.col + DX[d]);
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          if (MAP[nr][nc] === 4 && !ghost.eaten) return;
        }
        possible.push(d);
      }
    });

    if (possible.length === 0) {
      ghost.dir = opposite[ghost.dir];
      return;
    }

    if (ghost.scared) {
      // Random movement when scared
      ghost.dir = possible[Math.floor(Math.random() * possible.length)];
    } else {
      // Chase player (simple: prefer direction that reduces distance)
      let bestDist = Infinity;
      let bestDir = possible[0];
      possible.forEach(d => {
        const nc = ghost.col + DX[d];
        const nr = ghost.row + DY[d];
        const dist = Math.abs(nc - player.col) + Math.abs(nr - player.row);
        // Add some randomness so ghosts don't all take same path
        const jitter = Math.random() * 4;
        if (dist + jitter < bestDist) {
          bestDist = dist + jitter;
          bestDir = d;
        }
      });
      ghost.dir = bestDir;
    }
  }

  function checkCollisions() {
    ghosts.forEach(ghost => {
      if (ghost.releaseTimer > 0) return;
      const dist = Math.abs(ghost.px - player.px) + Math.abs(ghost.py - player.py);
      if (dist < TILE * 0.7) {
        if (ghost.scared && !ghost.eaten) {
          // Eat ghost
          ghost.eaten = true;
          ghost.scared = false;
          score += 200;
          // Send ghost back to start
          ghost.col = 10;
          ghost.row = 10;
          ghost.px = 10 * TILE + TILE / 2;
          ghost.py = 10 * TILE + TILE / 2;
          ghost.releaseTimer = 180;
          setTimeout(() => { ghost.eaten = false; }, 3000);
        } else if (!ghost.eaten) {
          // Player dies
          loseLife();
        }
      }
    });
  }

  function loseLife() {
    lives--;
    updateHUD();
    if (lives <= 0) {
      endGame(false);
      return;
    }
    // Reset positions
    player = createPlayer();
    ghosts = createGhosts();
    nextDir = DIR.NONE;
  }

  function checkWin() {
    if (dotsEaten >= totalDots) {
      level++;
      gameWon = true;
      startLevel();
    }
  }

  // ── HUD ────────────────────────────────────────────────────
  function updateHUD() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    // Cathedral emoji for lives
    let livesStr = "";
    for (let i = 0; i < lives; i++) livesStr += "\u26EA ";
    livesEl.textContent = livesStr;
  }

  // ── Game Loop ──────────────────────────────────────────────
  function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawMap();
    updatePlayer();
    updateGhosts();
    checkCollisions();
    checkWin();
    updateHUD();

    drawDom(player.px, player.py, player.dir || DIR.RIGHT, player.mouthAngle);
    ghosts.forEach(g => drawGhost(g));

    animFrame = requestAnimationFrame(gameLoop);
  }

  // ── Level / Game management ────────────────────────────────
  function startLevel() {
    map = cloneMap();
    player = createPlayer();
    ghosts = createGhosts();
    nextDir = DIR.NONE;
    powerTimer = 0;

    // Count dots
    totalDots = 0;
    dotsEaten = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (map[r][c] === 0 || map[r][c] === 3) totalDots++;
      }
    }

    updateHUD();
  }

  function startGame() {
    score = 0;
    lives = 3;
    level = 1;
    gameWon = false;
    gameRunning = true;

    startLevel();
    overlay.classList.remove("visible");
    overlay.classList.add("hidden");
    gameOverOverlay.classList.add("hidden");

    if (animFrame) cancelAnimationFrame(animFrame);
    gameLoop();
  }

  function endGame(won) {
    gameRunning = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    const title = document.getElementById("game-over-title");
    const text = document.getElementById("game-over-text");
    if (won) {
      title.textContent = "Prost!";
      title.style.color = "#ffd700";
      text.textContent = `Du hast ${score} Kölsch getrunken! Dat Spill is vorbei, du Jeck!`;
    } else {
      title.textContent = "Game Over!";
      title.style.color = "#ff4444";
      text.textContent = `${score} Kölsch geschafft! Nächstes Mal trinkste mehr, ne?`;
    }
    gameOverOverlay.classList.remove("hidden");
  }

  // ── Events ─────────────────────────────────────────────────
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);

  // Draw initial state on canvas
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  map = cloneMap();
  drawMap();
})();

import { randomNumbers } from "./utils";
import { State } from "./types";
export { Viewport, Constants, Block, Positions, Score, arrayOfTetrominoes, tetroTypes, initialState, BlockCount }

/**
 * Canvas constants
 */
const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
    PREVIEW_WIDTH: 160,
    PREVIEW_HEIGHT: 90,
} as const;

const Constants = {
    TICK_RATE_MS: 500,
    GRID_WIDTH: 10,
    GRID_HEIGHT: 20,
} as const;

/**
 * State and block constants
 */
const Block = {
    WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
    HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
} as const;

const Positions = {
    X: Math.floor(Constants.GRID_WIDTH / 2) - 2,
    Y: -2
} as const;


/**
 * Score increments
 */
const Score = {
    increment: 100
}

const BlockCount = 7



/**
 * Pre-built tetrominoes with starting positions 
 */
const twobytwo = [{ id: 1, x: Positions.X + 1, y: Positions.Y + 2, style: 'red' },
{ id: 2, x: Positions.X + 2, y: Positions.Y + 2, style: 'red' }, { id: 3, x: Positions.X + 1, y: Positions.Y + 1, style: 'red' }, { id: 4, x: Positions.X + 2, y: Positions.Y + 1, style: 'red' }]

const line = [{ id: 1, x: Positions.X, y: Positions.Y + 1, style: 'yellow' },
{ id: 2, x: Positions.X + 1, y: Positions.Y + 1, style: 'yellow' }, { id: 3, x: Positions.X + 2, y: Positions.Y + 1, style: 'yellow' }, { id: 4, x: Positions.X + 3, y: Positions.Y + 1, style: 'yellow' }]

const el1 = [{ id: 1, x: Positions.X + 1, y: Positions.Y, style: 'blue' },
{ id: 2, x: Positions.X + 1, y: Positions.Y + 1, style: 'blue' }, { id: 3, x: Positions.X + 1, y: Positions.Y + 2, style: 'blue' }, { id: 4, x: Positions.X + 2, y: Positions.Y + 2, style: 'blue' }]

const el2 = [{ id: 1, x: Positions.X + 1, y: Positions.Y, style: 'green' },
{ id: 2, x: Positions.X + 1, y: Positions.Y + 1, style: 'green' }, { id: 3, x: Positions.X + 1, y: Positions.Y + 2, style: 'green' }, { id: 4, x: Positions.X, y: Positions.Y + 2, style: 'green' }]

const z1 = [{ id: 1, x: Positions.X, y: Positions.Y + 2, style: 'orange' },
{ id: 2, x: Positions.X + 1, y: Positions.Y + 2, style: 'orange' }, { id: 3, x: Positions.X + 1, y: Positions.Y + 1, style: 'orange' }, { id: 4, x: Positions.X + 2, y: Positions.Y + 1, style: 'orange' }]

const t = [{ id: 1, x: Positions.X, y: Positions.Y + 1, style: 'white' },
{ id: 2, x: Positions.X + 1, y: Positions.Y + 1, style: 'white' }, { id: 3, x: Positions.X + 1, y: Positions.Y, style: 'white' }, { id: 4, x: Positions.X + 2, y: Positions.Y + 1, style: 'white' }]

const z2 = [{ id: 1, x: Positions.X, y: Positions.Y + 1, style: 'pink' },
{ id: 2, x: Positions.X + 1, y: Positions.Y + 1, style: 'pink' }, { id: 3, x: Positions.X + 1, y: Positions.Y + 2, style: 'pink' }, { id: 4, x: Positions.X + 2, y: Positions.Y + 2, style: 'pink' }]


/**
 * Constant arrays holding tetrominoes and their types
 */
const arrayOfTetrominoes = [twobytwo, line, el1, el2, z1, t, z2]
const tetroTypes = ['twobytwo', 'line', 'el1', 'el2', 'z1', 't', 'z2']


/**
 * Initial State
 */

const initialState: State = {
    activeTetromino: arrayOfTetrominoes[2],
    tetrominoType: 'el1',
    gameGrid: [],
    exitBlocks: [],
    gameOver: false,
    randNum: randomNumbers(3),
    objCount: 4,
    preview: arrayOfTetrominoes[2].map((block) => ({ ...block, id: 'preview', x: block.x - 2, })),
    score: 0,
    highScore: 0,
    level: 0,
    x: Positions.X,
    y: Positions.Y

}


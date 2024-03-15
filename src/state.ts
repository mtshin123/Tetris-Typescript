export { Tick, Translate, Rotate, DropDown, Restart, reduceState }
import { Constants, Positions, arrayOfTetrominoes, initialState, BlockCount } from "./constants";
import { unitBlock, State, Action, BlockArray } from "./types";

import {
    extractBottomIndex, extractLeftIndex,
    extractRightIndex, addToGrid, randomNumbers, rotateBlock, translateGrid
} from "./utils";


/**
 * Detects collisions between the active tetromino and currently existing game grid. Uses the .some() list
 * method to detect whether there exists overlapping coordinates
 * 
 * @param activeTetromino Inputs the game tetromino
 * @param gameGrid A readonly array of unitBlock types representing the current game grid
 * @returns a boolean value
 */
const blockToBlockCollision = (activeTetromino: BlockArray, gameGrid: BlockArray): Boolean => {
    return activeTetromino.some(block1 => gameGrid.some(
        (block2) => block1.x === block2.x && block1.y === block2.y))
}

/**
 * Detects if there exists a collision between the active tetromino and the walls of the grid. Uses pure functions
 * extractLeftIndex and extractRightIndex to determine the furthest left and furthest right block positions.
 * @param s game state type with the active tetromino
 * @returns boolean 
 */
const horizontalBorderCollision = (s: State): Boolean => {
    const left = extractLeftIndex(s.activeTetromino)
    const right = extractRightIndex(s.activeTetromino)
    return (left < 0 || right > Constants.GRID_WIDTH - 1)
}

/**
 *  Detects if there exists a collision between the active tetromino and the floor of the grid. Uses pure function
 * extractBottomIndex to determine the lowest existing block position.
 * @param u array of blocks
 * @returns boolean
 */
const bottomCollision = (u: BlockArray): Boolean => {
    return extractBottomIndex(u) > Constants.GRID_HEIGHT - 1
}


/**
 * Function that contains a function that recursively shifts the tetromino down until it encounters a 
 * block collision or bottom collision, uses pure functions blocktoblock and bottomcollision functions to do so.
 * @param s current game state holding tetromino
 * @returns new game state instance
 */
const dropDownBlock = (s: State): State => {
    function shiftDownUntilCollision(u: BlockArray): BlockArray {
        const shiftedDown = translateGrid(u, 0, 1)
        const collided = blockToBlockCollision(shiftedDown, s.gameGrid) || bottomCollision(shiftedDown)
        return collided ? u : shiftDownUntilCollision(shiftedDown)
    }
    return { ...s, activeTetromino: shiftDownUntilCollision(s.activeTetromino) }
}


/**
 * A class action Tick that is fired according to interval timers in main.ts
 */
class Tick implements Action {
    constructor(public readonly elapsed: number) { }
    /** 
     * interval tick: bodies move, collisions happen, on each tick the active tetromino is translated down by 1 unit.
     * @param s old State
     * @returns new State
     */
    apply(s: State) {
        if (s.gameOver) {
            return s
        }
        // Translate and check if there is a collision
        else {
            const newState = { ...s, y: s.y + 1, activeTetromino: translateGrid(s.activeTetromino, 0, 1) }
            return Tick.handleTickCollisions(s, newState)
        }
    }

    /**
     * checks if the next state would encounter a collision bewteen the active tetromino and blocks, or bottom of grid.
     * If so, call pure function addToGrid which returns a new game state with active tetromino added to grid, otherwise, the next State
     * @param s current game state
     * @param newState the next state
     * @returns game state
     */
    static handleTickCollisions = (s: State, newState: State) => {
        const collisions = bottomCollision(newState.activeTetromino) ||
            blockToBlockCollision(newState.activeTetromino, newState.gameGrid)
        return collisions ? addToGrid(s) : newState
    }
}

/**
 * Translate tick that is fired when user presses A, S, D keys to move the active tetromino
 */
class Translate implements Action {
    constructor(public readonly x_direction: number, public readonly y_direction: number) { }

    apply(s: State) {
        const newState = {
            ...s, x: s.x + this.x_direction, y: s.y + this.y_direction,
            activeTetromino: translateGrid(s.activeTetromino, this.x_direction, this.y_direction)
        }
        return Translate.handleTranslateCollisions(s, newState, this.y_direction)
    }

    /**
     * Returns correct state depending if there is a collision in the next state.
     * If the translation is down (y < 0), we check if there are bottom collisions or block collisions. returns new state 
     * with added tetromino if so, otherwise next state.
     * If not, we only worry about side collisions or block collisions. returns old state, new state otherwise.
     * 
     * 
     * @param s current game state
     * @param newState the next game state
     * @param y the translation being induced
     * @returns game state
     */
    static handleTranslateCollisions = (s: State, newState: State, y: number) => {

        const blockCollision = blockToBlockCollision(newState.activeTetromino, newState.gameGrid)
        const botCollision = bottomCollision(newState.activeTetromino)

        const collisionsBottom = botCollision || blockCollision
        const collsionsSide = horizontalBorderCollision(newState) || blockCollision
        return y > 0 ?
            collisionsBottom ?
                addToGrid(s) : newState
            :
            collsionsSide ?
                s :
                newState
    }
}


/**
 * Class action Rotate that rotates the tetromino and handles collisions on the way.
 * Returns old state if there there will be rotate collisions, otherwise rotate tetromino.
 *  Uses pure functions horizontalBorderCOllision and Blocktoblockcollision to do so.
 */
class Rotate {
    constructor() { }
    apply(s: State) {
        const newState = rotateBlock(s)
        const collsionsSide = horizontalBorderCollision(newState) ||
            blockToBlockCollision(newState.activeTetromino, newState.gameGrid)
        return collsionsSide ?
            s :
            newState

    }
}


/**
 * Class action DropDown that returns new state with the dropped down tetromino. Fired off when user presses dropdown key.
 * Drops down tetromino and adds to the grid, returns new state with it.
 */
class DropDown {
    constructor() { }
    apply(s: State) {
        const newState = dropDownBlock(s)
        return addToGrid(newState)
    }
}


/**
 * Restart action that returns a modified initialState constant with new random tetrominoes and keeping high score.
 * Only applies if the game is over. Uses randomNumbers lazy sequence to determine a new block.
 * Appends activeTetromino and gamegrid to the exitBlocks (garbage) to be removed from the canvas.
 * Also assigns new IDS to the tetrominoes so we can reference them on canvas.
 */
class Restart {
    constructor() { }
    apply(s: State) {
        return s.gameOver ? {
            ...initialState,
            activeTetromino: arrayOfTetrominoes[s.randNum.value].map((val: unitBlock) => ({ ...val, id: s.objCount + val.id })),
            exitBlocks: s.activeTetromino.concat(s.gameGrid),
            highScore: s.highScore,
            randNum: randomNumbers(s.gameGrid.length % BlockCount), gameOver: false
        }
            : s
    }
}

/**
 * a function that applies the respective action to the state, returns new game states.
 * @param s current game state
 * @param action action to be done i.e rotate, translate, etc
 * @returns new state of the game with action applied.
 */
const reduceState = (s: State, action: Action): State => action.apply(s)


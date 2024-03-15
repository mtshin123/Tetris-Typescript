
export {
    extractBottomIndex, extractLeftIndex, extractRightIndex,
    addToGrid, extractTopIndex, appendExitBlocks, randomNumbers, previewCurrentTetromino,
    rotateBlock, translateGrid
}
import { State, unitBlock, Matrix, LazySequence, preview, BlockArray } from "./types"
import { Viewport, Constants, Block, Positions, arrayOfTetrominoes, tetroTypes, Score, BlockCount } from "./constants"



/**
 * Pseudo random number generator, which contains a hash method which returns a new number
 */
abstract class RNG {

    private static m = 7; // 7 blocks in total in array
    private static a = 1;
    private static c = 6;
    /**
     * Call `hash` repeatedly to generate the sequence of hashes.
     * @param seed
     * @returns a hash of the seed
     */
    public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;
}


/**
 * 
 * @param u unitBlock
 * @param xOry string that is either 'x' or 'y'
 * @returns integer x or y attribute
 */
const selector = (u: unitBlock, xOry: String): number => {
    return xOry === 'x' ? u.x : u.y
}

/**
 * curried function that returns functions, which produces index value depending on selector
 * and function passed in to compare accumulator and current value.
 * @param u immutable array of unitblocks
 * @returns number which is index value as integer.
 */
const extractIndex = (u: BlockArray) => (border: number) => (axis: String) => (minOrMax: Function) => {
    return u.reduce((acc, val) => minOrMax(selector(val, axis), acc), border)
}


/**
 * Uses extractIndex curried functions to produce a multiple index extraction functions
 * They are curried as they may be useful later.
 * @param u unitBlocks
 * @returns integer representing desired values
 */
const extractBottomIndex = (u: BlockArray) => extractIndex(u)(0)('y')(Math.max)

const extractTopIndex = (u: BlockArray) => extractIndex(u)(Constants.GRID_HEIGHT)('y')(Math.min)

const extractLeftIndex = (u: BlockArray) => extractIndex(u)(Constants.GRID_WIDTH)('x')(Math.min)

const extractRightIndex = (u: BlockArray) => extractIndex(u)(0)('x')(Math.max)

const previewCurrentTetromino = (u: BlockArray) => u.map((block) => ({ ...block, id: 'preview' }))

/**
 * A function that determines if there exists a collision between blocks and top of the game grid.
 * @param u immutable array of blocks
 * @returns boolean 
 */
const topCollision = (u: BlockArray): Boolean => {
    return extractTopIndex(u) < 0
}


/**
 * Adds active tetromino to grid, and updates the following:
 * 
 * New grid state, with full rows cleared
 * Next tetromino to be added
 * New score gained from clearing rows
 * Appends cleared rows to exitBlocks (garbage) to be removed from the canvas
 * Reset initial position of game state 
 * 
 * @param s state representing current state of game
 * @returns new state representing next phase of the game
 */
const addToGrid = (s: State): State => {
    /**
     * Constants to be updated for the next state of the game grid.
     * All functions used to determine new constants are pure, so no side effects to game state.
     */
    const nextGridState = s.gameGrid.concat(s.activeTetromino),
        num = s.randNum.value,
        nextHashnum = s.randNum.next().value,
        clearRowsOutput = clearFullRows(nextGridState, Constants.GRID_WIDTH),
        clearedRowGrid = clearRowsOutput[0],
        scoreGained = clearRowsOutput[1],
        newObjCount = s.objCount + 4,
        newScore = s.score + scoreGained,
        newLevel = Math.floor(newScore / (Score.increment * 10)),

        /**
         * The next state of the game. All functions pure, and only new objects are created. Nothing modified.
         */
        newState = {
            ...s, randNum: s.randNum.next(), activeTetromino: arrayOfTetrominoes[num].map((val: unitBlock) => (
                { ...val, id: s.objCount + val.id })), // Assigning new IDS to the next tetromino for canvas referencing
            tetrominoType: tetroTypes[num],
            gameGrid: clearedRowGrid,
            exitBlocks: appendExitBlocks(nextGridState, Constants.GRID_WIDTH), // appending garbage blocks to be removed from canvas
            objCount: newObjCount,
            preview: arrayOfTetrominoes[nextHashnum].map((block) => ({ ...block, id: 'preview', x: block.x - 2 })), //updating preview block
            score: newScore,
            x: Positions.X,
            y: Positions.Y,
            highScore: Math.max(newScore, s.highScore), //update the next high score
            level: newLevel,
            gameOver: topCollision(s.activeTetromino) ? true : s.gameOver //if the added block causes collision, change gameOver to true

        }
    return newState
}


/**
 * A HOF that returns a lazy infinite sequence of random numbers, it is used for 
 * our random number generator so we can view the next tetromino to be added to the grid.
 * The next tetromino is determined by this lazy sequence.
 * @param n seed 
 * @returns returns HOF that is a lazy sequence of numbers.
 */
const randomNumbers = (n: number) => {
    return function _next(v: number): LazySequence<number> {
        return {
            value: v,
            next: () => _next(RNG.hash(v))
        }
    }(n)
}


/**
 * 
 * Useful HOFs for later when needed to increase readability/code quality.
 * 
 * @param u Immutable array of generic type U
 * @param f Function that inputs U and returns a type (either boolean or generic)
 * @returns 
 */
const map = <T, U>(u: ReadonlyArray<U>, f: ((v: U) => T)): ReadonlyArray<T> =>
    u.map(f)

const filter = <U>(u: ReadonlyArray<U>, f: ((v: U) => boolean)): ReadonlyArray<U> =>
    u.filter(f)



/**
 * Inputs heightlimit and a matrix, given a height, translate every block less
 * than the height limit down (+1).
 * @param grid an array of arrays of unitblocks (matrix type)
 * @param i The height limit 
 * @returns a new matrix with all blocks modified with new translations
 */
function shiftDownbyIndex(grid: Matrix, heightLimit: number): Matrix {
    return grid.map((row, j) => j < heightLimit ? translateGrid(row, 0, 1) : row)
}


/**
 * Inputs an immutable array of blocks, returns a matrix version (array of array of unitblocks)
 * @param grid current game grid
 * @returns a matrix form of the grid
 */
function matrixForm(grid: BlockArray) {
    const matrixForm_aux = (grid: BlockArray, newMatrix: Matrix,
        currentHeight: number, maximumHeight: number): Matrix => {
        // Now adding rows, by filtering out all differing block heights, so all block heights
        // are in the same row.
        return currentHeight > maximumHeight ? newMatrix : matrixForm_aux(grid,
            newMatrix.concat([filter(grid, ({ y }) => y === currentHeight)]), currentHeight + 1, maximumHeight)
    }
    return matrixForm_aux(grid, [], Positions.Y, Constants.GRID_HEIGHT)
}


/**
 * Destructs the matrix structure into a single array structure
 * @param grid A matrix
 * @returns immutable array of blocks
 */
function destructGrid(grid: Matrix): BlockArray {
    return grid.reduce((acc, val) => acc.concat(val), [])
}


/**
 * inputs current grid and width, (so we can change the game grid dimensions and the functionality still works)
 * Filters out all full rows and returns new grid without full row blocks.
 * @param currentGameGrid current game grid state
 * @param gridWidth total grid width
 * @returns new array of blocks without full rows
 */
function clearFullRows(currentGameGrid: BlockArray, gridWidth: number): [BlockArray, number] {

    // Converts into a matrix form of the game grid
    const grid = matrixForm(currentGameGrid)

    /**
     * recursive function that scans all the heights and filters out all full row blocks
     * Uses pure functions shfitDownByIndex to shift all rows above down by 1.
     * Increments score by Score.increment constant for each full row cleared.
     * @param grid Matrix form
     * @param currentHeight current height scan
     * @param currentScore current score
     * @returns the final result with no full row blocks or next iteration
     */
    function clearFullRowsAux(grid: Matrix, currentHeight: number, currentScore: number): [Matrix, number] {
        return (currentHeight > grid.length - 1) ?
            [grid, currentScore] :
            grid[currentHeight].length === gridWidth ?
                clearFullRowsAux(shiftDownbyIndex(grid, currentHeight).filter(
                    (_, i) => i != currentHeight), currentHeight, currentScore + Score.increment) :
                clearFullRowsAux(grid, currentHeight + 1, currentScore)
    }
    const clearRowsFinalOutput = clearFullRowsAux(grid, 0, 0)
    const totalScore: number = clearRowsFinalOutput[1]
    const finalGrid: Matrix = clearRowsFinalOutput[0]
    const gameGridList = destructGrid(finalGrid)
    return [gameGridList, totalScore]

}


/**
 * Inputs current game grid, converts to matrix form, and returns a list of all
 * full row blocks as garbage. This array of blocks is immutable
 * @param currentGameGrid current game grid state
 * @param gridWidth grid width
 * @returns immutable array of unitblocks
 */
function appendExitBlocks(currentGameGrid: BlockArray, gridWidth: number) {
    const grid = matrixForm(currentGameGrid)
    return grid.reduce((acc, val) => val.length === gridWidth ? acc.concat(val) : acc, [])
}


/**
 * Translates all blocks in immutable array, by returning new array of blocks with blocks translated.
 * @param grid immutable array of blocks
 * @param xTranslate x direction 
 * @param yTranslate y direction
 * @returns new grid of blocks
 */
function translateGrid(grid: BlockArray, xTranslate: number, yTranslate: number): BlockArray {
    return map(grid, (b) => ({ ...b, x: b.x + xTranslate, y: b.y + yTranslate }))
}


/**
 * takes in a state, extracts tetromino and applies an offset translation (s.x, s.y) then uses  
 * 2d rotation matrix to rotate the tetromino blockwise by 90 degrees (although no matrix required)
 * A case is when we get two by two block, in which we don't rotate it at all.
 * 
 * Uses SRS rotation system
 * @param s current game state
 * @returns new array of blocks (tetrominoes) rotated
 */
function rotateBlock(s: State) {
    const rotatedTetromino =
        translateGrid(s.activeTetromino, -s.x - 1, -s.y - 1).map(
            (block) => ({ ...block, x: -1 * block.y + s.x + 1, y: block.x + s.y + 1 })
        )
    return s.tetrominoType == "twobytwo" ? s : { ...s, activeTetromino: rotatedTetromino }
} 

export type { State, Key, unitBlock, Event, Action, Matrix, LazySequence, preview, BlockArray, SVG_block }
/** Types and interfaces */



type Key = "KeyS" | "KeyA" | "KeyD" | "KeyS" | "KeyR" | "KeyT" | "KeyM";

type Event = "keydown" | "keyup" | "keypress";

type State = Readonly<{
    activeTetromino: ReadonlyArray<unitBlock>
    tetrominoType: String
    gameGrid: ReadonlyArray<unitBlock>
    exitBlocks: ReadonlyArray<unitBlock>
    randNum: LazySequence<number>
    gameOver: Boolean
    preview: preview[]
    objCount: number
    score: number
    highScore: number
    level: number
    x: number
    y: number
}>;


interface LazySequence<numbers> {
    value: number;
    next(): LazySequence<number>;
}

type unitBlock = Readonly<{
    style: string
    id: number
    x: number
    y: number
}>
type preview = Readonly<{
    style: string
    id: string
    x: number
    y: number
}>
type SVG_block = {
    style: string
    id: string
    x: number
    y: number
}

type Matrix = ReadonlyArray<ReadonlyArray<unitBlock>>

type BlockArray = ReadonlyArray<unitBlock>



interface Action {
    apply(s: State): State;
}

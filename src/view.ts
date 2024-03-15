
export { show, hide, createSvgElement, createSVGUnitBlock, updateView }
import { State, unitBlock, preview } from "./types";
import { Block } from "./constants";

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
function show(elem: SVGGraphicsElement) {
    elem.setAttribute("visibility", "visible");
    elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
function hide(elem: SVGGraphicsElement) {
    elem.setAttribute("visibility", "hidden");
}
/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
function createSvgElement(
    namespace: string | null,
    name: string,
    props: Record<string, string> = {}
) {
    const elem = document.createElementNS(namespace, name) as SVGElement;
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
    return elem;
};



/**
 * 
 * @param block a unitblock or a preview block (string id)
 * @param x_coord number
 * @param y_coord number
 * @returns an SVG block
 */
function createSVGUnitBlock(block: unitBlock | preview, x_coord: number, y_coord: number) {
    return {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${x_coord}`,
        y: `${y_coord}`,
        style: `fill: ${block.style}`

    }
}


/**
 * Creates tetromino on the canvas, function is reused throughout
 * 
 * @param namespace namespace reference on canvas
 * @param b block (union type preview or unitblock)
 * @param SVG_block (SVG version of block)
 * @returns 
 */
const createTetrominoView = (namespace: SVGGraphicsElement & HTMLElement, b: unitBlock | preview, SVG_block: Record<string, string> | undefined) => {
    const v = createSvgElement(namespace.namespaceURI, "rect", SVG_block)
    v.setAttribute("id", String(b.id))
    namespace.appendChild(v)
    return v;
}

/**
 * 
 * @param s state 
 * @param svg canvas reference
 */
const updateBlockPos = (s: State, svg: SVGGraphicsElement & HTMLElement) => {
    // Either makes a new block or modifies the x and y coordinate attribute son the canvas
    s.activeTetromino.forEach(b => {
        // Makes SVG block version
        const SVG_block = createSVGUnitBlock(b, b.x * Block.WIDTH, b.y * Block.HEIGHT)
        const createViewBlockPos = () => createTetrominoView(svg, b, SVG_block)

        // Makes new block depending on whether there exists an id for the block
        const v = document.getElementById(String(b.id)) || createViewBlockPos();

        // Sets the attributes of the coordinate son the canvas
        v.setAttribute("x", String(b.x * Block.WIDTH))
        v.setAttribute("y", String(b.y * Block.HEIGHT))
    })
}


/**
 * 
 * @param s current state
 */
const updateGameGridView = (s: State) => {
    // Sets the next attribute for elements on the grid
    s.gameGrid.forEach(b => {
        const v: HTMLElement = document.getElementById(String(b.id))!;
        v.setAttribute("x", String(b.x * Block.WIDTH))
        v.setAttribute("y", String(b.y * Block.HEIGHT))

    }
    )
}


/**
 * 
 * @param s state 
 */
const updatePreview = (s: State) => {
    // Updates the state with the new preview block
    const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
        HTMLElement;
    const previewElements = preview.querySelectorAll('[id="preview"]')

    // Removes all the previous preview blocks
    previewElements.forEach(element => {
        preview.removeChild(element);
    });

    // Updates the preview with new preview blocks
    s.preview.forEach(b => {
        const SVG_block = createSVGUnitBlock(b, (b.x + 1) * Block.WIDTH, (b.y + 3) * Block.HEIGHT)
        const createPreviewView = () => createTetrominoView(preview, b, SVG_block)

        createPreviewView()
    })
}

/**
 * Updates the score, level, and highscore on the canvas
 * @param s current game state
 */
const updateScore = (s: State) => {

    // Update the new score
    const scoreText = document.querySelector("#scoreText") as HTMLElement;
    scoreText.innerText = String(s.score)

    // Update the highSccore
    const highScoreText = document.querySelector("#highScoreText") as HTMLElement;
    highScoreText.innerText = String(s.highScore)

    // Update the next level
    const levelText = document.querySelector('#levelText') as HTMLElement;
    levelText.innerText = String(s.level)
}


/**
 * Removes all the exitBlocks from the canvas
 * @param s current game state
 */
const clearExitBlocks = (s: State) => {

    // Requests all exit blocks
    const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement

    // Remove all null elements, and then remove all the exitBlocks from canvas
    const idList = s.exitBlocks.map(o => document.getElementById(String(o.id)))
    idList.filter(v => Boolean(v)).forEach((v) => svg.removeChild(v!))
}


/**
 * Updates the current view on the canvas, score, exitblocks, gamegrid, everything.
 * @param s current game state
 */
function updateView(s: State) {
    const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement,
        gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
            HTMLElement

    // if game is over, show the gameOver box, otherwise update everything else and hide gameover box
    if (s.gameOver) {
        show(gameover)
    }
    else {
        hide(gameover)
        updateBlockPos(s, svg)
        clearExitBlocks(s)
        updateGameGridView(s)
        updatePreview(s)
        updateScore(s)
    }

}
import { State, Action } from "./types";
import { updateView } from "./view"
import { Viewport, initialState, Constants } from "./constants"
import { Tick, Translate, Rotate, DropDown, Restart, reduceState } from "./state"
import { distinctUntilChanged, mergeMap, takeUntil, switchMap } from "rxjs/operators";
import { Subject } from 'rxjs'
import "./style.css";
import { Observable, fromEvent, interval, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";



/**
 * 
 * Main function be run when the game loads
 */
export function main() {

  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  // Initialising the screen with appropriate canvas heights and widths
  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);



  // Functions that return boolean values when a certain key is pressed by the user
  const keysHold = (key: String): boolean =>
    key === 'a' || key === "d" || key === "s"

  const keysTap = (key: String): boolean => key === 'r' || key === 'm' || key === 't'



  /**
   * A function that returns class instances of actions
   * Translate (Translate blocks left, right or down) triggered when A, D, S keys pressed respectively
   * DropDown (Immediately drops down the block to the maximal allowable depth)
   * Rotate (rotates the block clockwise by 90 degrees)
   * Restart (Restarts the game, but only has effect if the game is over)
   */
  const keysMapTo = (key: string): Translate | DropDown | Rotate | Restart => {
    switch (key) {
      case 'KeyA': {
        return new Translate(-1, 0)
      }
      case 'KeyD': {
        return new Translate(1, 0)
      }
      case 'KeyS': {
        return new Translate(0, 1)
      }
      case 'KeyM': {
        return new DropDown()
      }
      case 'KeyR': {
        return new Rotate()
      }
      case 'KeyT': {
        return new Restart()
      }
      default: {
        return new Translate(1, 0)
      }
    }
  }


  /**
   * Observable streams that listen to hold actions, such as A, S, D translation.
   * mergemap is used for smooth handling, multiple actions can be handled by listening to 
   * an interval tick until the key button is released. Then filters out the key and applies
   * their respective class actions.
   */
  const holdAction$: Observable<Action> = fromEvent<KeyboardEvent>(document, 'keydown')
    .pipe(
      filter(({ key }) => keysHold(key)),
      filter(({ repeat }) => !repeat),
      mergeMap((d) =>
        interval(100).pipe(
          takeUntil(
            fromEvent<KeyboardEvent>(document, 'keyup').pipe(
              filter(({ key }) => key === d.key)
            )
          ),
          map((_) => d)
        )
      ), map(({ code }) => keysMapTo(code))),

    /**
     * Observable stream that listen to tap actions, such as restart, rotate and dropdown.
     * The repeats are filtered out so multiple instances are not fired as key is held down.
     * Then maps their class actions onto the stream.
     */
    tapAction$ = fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(({ key }) => keysHold(key) || keysTap(key)),
        filter(({ repeat }) => !repeat),
        map(({ code }) => keysMapTo(code))),


    /**
     * A gameTick that changes (but immutable, firing off new ticks each time using subject observer)
     * with respect to game levels. We flatten inner observables using switchMap which only subscribes to the 
     * newly created observables (new ticks) and ignores the old inner observables
     * 
     * 
     */
    gameLevelSubject = new Subject<number>(),
    gameTickWithLevel$ = gameLevelSubject.pipe(
      switchMap((level) => {
        // Calculate the new tick interval based on the game level (adjust as needed)
        const newTickInterval = Constants.TICK_RATE_MS / (1 + level); // For example, faster as level increases
        return interval(newTickInterval).pipe(map(elapsed => new Tick(elapsed)));
      })
    )
  gameLevelSubject.next(0)

  /**
   * Merged actions tap, hold and a state observable with gameTick
   * We scan the states and apply the function reduceState to apply the actions on the state.
   * This is an observable stream of states of the game.
   */
  const action$ = merge(tapAction$, holdAction$),

    state$: Observable<State> = merge(action$, gameTickWithLevel$).pipe(scan(reduceState, initialState)),

    /**
     * An observable which fires new game tick intervals by detecting level changes, using distinctUntilChanged(),
     * when triggered, uses .next() function in the subject observer to subscribe to a new gametick observer.
     */
    detectLevelChanges$ = state$.pipe(map((s) => s.level), distinctUntilChanged()).subscribe((s) => gameLevelSubject.next(s)),

    /**
     * Our subscription observable which updates the view on the physical canvas.
     */
    subscription$ = state$.subscribe((s: State) => {
      updateView(s);
    })
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}


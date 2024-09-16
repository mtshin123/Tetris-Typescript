import { State, Action, Key } from "./types";
import { updateView } from "./view"
import { Viewport, initialState, Constants } from "./constants"
import { Tick, Translate, Rotate, DropDown, Restart, reduceState } from "./state"
import { distinctUntilChanged, mergeMap, takeUntil, switchMap, take, concatMap } from "rxjs/operators";
import { from, of, Subject, timer } from 'rxjs'
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
    key === 'ArrowLeft' || key === "ArrowRight" || key === "ArrowDown" || key === "ArrowUp"

  const keysTap = (key: String): boolean => key === 'ArrowUp' || key === 'Space' || key === 'KeyR'



  /**
   * A function that returns class instances of actions
   * Translate (Translate blocks left, right or down) triggered when A, D, S keys pressed respectively
   * DropDown (Immediately drops down the block to the maximal allowable depth)
   * Rotate (rotates the block clockwise by 90 degrees)
   * Restart (Restarts the game, but only has effect if the game is over)
   */
  const keysMapTo = (key: string): Translate | DropDown | Rotate | Restart => {
    switch (key) {
      case 'ArrowLeft': {
        return new Translate(-1, 0)
      }
      case 'ArrowRight': {
        return new Translate(1, 0)
      }
      case 'ArrowDown': {
        return new Translate(0, 1)
      }
      case 'Space': {
        return new DropDown()
      }
      case 'ArrowUp': {
        return new Rotate()
      }
      case 'KeyR': {
        return new Restart()
      }
      default: {
        return new Translate(1, 0)
      }
    }
  }

  

  /** 
   * Testing observables;
   */

  //const actionReveal$: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(document, 'keydown')
  //actionReveal$.subscribe((d: KeyboardEvent) => console.log("Code is " + d.code, "Key is " + d.key))

 
  /**
   * Observable streams that listen to hold actions, such as A, S, D translation.
   * mergemap is used for smooth handling, multiple actions can be handled by listening to 
   * an interval tick until the key button is released. Then filters out the key and applies
   * their respective class actions.
   */

  /*
  const letters = of('a', 'b','c');
  const result = letters.pipe(
    mergeMap(x => interval(1000).pipe(map(i => x + i)))
  );
  result.subscribe(x => console.log(x));
  */

  

  const KeyUpActions: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(document, 'keyup');
  //KeyUpActions.subscribe((d: KeyboardEvent) => console.log("Code is " + d.code, "Key is " + d.key))



  /*
  const keyDownAction$: Observable<Action> = fromEvent<KeyboardEvent>(document, 'keydown')
  .pipe(
    filter(({code, repeat}) => keysHold(code) && !repeat),
    mergeMap((downEvent: KeyboardEvent) => interval(100).pipe(takeUntil(KeyUpActions.pipe(filter((upEvent: KeyboardEvent) => upEvent.code == downEvent.code))),
    map((_) => downEvent))),

    map(({code}) => keysMapTo(code)))
*/
    

      const translationActions$$: Observable<Action> = fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(({code, repeat}) => keysHold(code) && !repeat),
        mergeMap((downEvent: KeyboardEvent) => interval(100).pipe(takeUntil(KeyUpActions.pipe(filter((upEvent: KeyboardEvent) => upEvent.code == downEvent.code))),
        map((_) => downEvent))),
    
        map(({code}) => keysMapTo(code)))

        const rotationActions$: Observable<Action> = fromEvent<KeyboardEvent>(document, 'keydown')
        .pipe(
          filter(({code, repeat}) => code == "ArrowUp" && !repeat),
          mergeMap((downEvent: KeyboardEvent) => interval(300).pipe(takeUntil(KeyUpActions.pipe(filter((upEvent: KeyboardEvent) => upEvent.code == downEvent.code))),
          map((_) => downEvent))),
      
          map(() => new Rotate()))

          const tapAction$ = fromEvent<KeyboardEvent>(document, 'keydown')
          .pipe(
            filter(({ code }) => keysHold(code) || keysTap(code)),
            filter(({ repeat }) => !repeat),
            map(({ code }) => keysMapTo(code)))
  
    const keyDownAction$: Observable<Action> = merge(translationActions$$, rotationActions$),


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
  const action$ = merge(tapAction$, keyDownAction$),

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


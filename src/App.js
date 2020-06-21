import React, { useState, useEffect, useRef } from 'react';

import produce from 'immer';

import './App.css';

function useInterval(callback, delay) {
    const savedCallback = useRef();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

function Cell({ isChecked, onClick, resolution }) {
    return (
        <div
            style={{
                backgroundColor: isChecked ? '#000' : '#fff',
                border: '1px solid #333',
                width: `calc(${100 / resolution}vw - 2px)`,
                height: `calc(${100 / resolution}vw - 2px)`,
            }}
            onClick={onClick}
        />
    );
}

function App() {
    const [resolution, setResolution] = useState(10);
    const [state, setState] = useState(makeInitialArray());
    const [isRunning, setIsRunning] = useState(false);
    const [delay, setDelay] = useState(1000);

    useInterval(
        () => {
            const nextState = makeInitialArray();
            nextState.forEach((i, ix) =>
                i.forEach((_, jx) => {
                    nextState[ix][jx] = shouldCellSurvive(state, ix, jx);
                }),
            );
            setState(nextState);
        },
        isRunning ? delay : null,
    );

    function makeInitialArray() {
        return Array.from({ length: resolution })
            .fill(false)
            .map((_) => Array.from({ length: resolution }).fill(false));
    }

    function shouldCellSurvive(state, i, j) {
        let neighborsAlive = 0;
        for (
            let x = Math.max(0, i - 1);
            x <= Math.min(i + 1, resolution - 1);
            x++
        ) {
            for (
                let y = Math.max(0, j - 1);
                y <= Math.min(j + 1, resolution - 1);
                y++
            ) {
                if (x !== i || y !== j) {
                    if (state[x][y] === true) {
                        neighborsAlive++;
                    }
                }
            }
        }

        if (state[i][j] === true) {
            if (neighborsAlive === 2 || neighborsAlive === 3) {
                return true;
            }
        } else {
            if (neighborsAlive === 3) {
                return true;
            }
        }
        return false;
    }
    return (
        <div className="App">
            {state.map((i, ix) => (
                <div key={ix} style={{ display: 'flex' }}>
                    {i.map((j, jx) => (
                        <Cell
                            key={jx}
                            isChecked={j}
                            resolution={resolution}
                            onClick={() => {
                                const nextState = produce(
                                    state,
                                    (draftState) => {
                                        draftState[ix][jx] = !j;
                                    },
                                );
                                setState(nextState);
                            }}
                        />
                    ))}
                </div>
            ))}
            <button onClick={() => setIsRunning(!isRunning)}>
                {isRunning ? 'Pause' : 'Play'}
            </button>
            <button onClick={() => setState(makeInitialArray())}>Clear</button>
            Resolution:
            <input
                type="range"
                min="5"
                max="20"
                defaultValue="10"
                onChange={(e) => {
                    setResolution(e.target.value);
                    setState(makeInitialArray());
                }}
            ></input>
            Delay:
            <input
                type="range"
                min="50"
                max="1000"
                defaultValue="1000"
                onChange={(e) => {
                    setDelay(e.target.value);
                }}
            ></input>
        </div>
    );
}

export default App;

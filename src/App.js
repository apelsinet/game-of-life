import React, { useState, useEffect, useRef } from 'react';

import produce from 'immer';
import * as Tone from 'tone';

import './App.css';

const tones = [
    'C#3',
    'D#3',
    'E3',
    'F#3',
    'G#3',
    'A3',
    'B3',
    'C#4',
    'D#4',
    'E4',
    'F#4',
    'G#4',
    'A4',
    'B4',
    'C#5',
    'D#5',
    'E5',
    'F#5',
    'G#5',
    'A5',
    'B5',
];

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

function App() {
    const [resolution, setResolution] = useState(10);
    const [isResolutionChanging, setIsResolutonChanging] = useState(false);
    const [state, setState] = useState(makeInitialArray());
    const [isRunning, setIsRunning] = useState(false);
    const [delay, setDelay] = useState(1000);
    const synth = useRef(null);

    useEffect(() => {
        const delay = new Tone.PingPongDelay('4n', 0.2).toMaster();
        delay.wet.value = 0.4;
        const reverb = new Tone.Reverb().toMaster();
        reverb.wet.value = 0.9;
        synth.current = new Tone.FMSynth({
            oscillator: {
                type: 'sine',
            },
            envelope: {
                attack: 0.1,
                decay: 0.2,
                sustain: 0.2,
                release: 0.1,
            },
            harmonicity: 1.2,
        })
            .chain(reverb, delay)
            .toMaster();
    }, []);

    useInterval(
        () => {
            const nextState = makeInitialArray();
            let tonesPlayed = 0;
            nextState.forEach((i, ix) => {
                i.forEach((j, jx) => {
                    if (state[ix][jx] && tonesPlayed < 4) {
                        synth.current.triggerAttackRelease(
                            tones[jx],
                            '8n',
                            '+0.15',
                        );
                        tonesPlayed++;
                    }
                    nextState[ix][jx] = shouldCellSurvive(state, ix, jx);
                });
            });
            setState(nextState);
        },
        isRunning ? delay : null,
    );

    function Cell({ isChecked, onClick, resolution }) {
        return (
            <div
                style={{
                    border: `1px solid ${
                        isResolutionChanging ? '#333' : 'transparent'
                    }`,
                    width: `calc(${100 / resolution}vw - 2px)`,
                    height: `calc(${100 / resolution}vw - 2px)`,
                }}
                className={`cell ${isChecked && 'checked'}`}
                onClick={onClick}
            />
        );
    }

    function makeInitialArray(length = resolution) {
        return Array.from({ length })
            .fill(false)
            .map((_) => Array.from({ length }).fill(false));
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
        <div>
            <div style={{ height: '2rem', display: 'flex' }}>
                <button
                    style={{ width: '5rem' }}
                    onClick={() => setIsRunning(!isRunning)}
                >
                    {isRunning ? 'Pause' : 'Play'}
                </button>
                <button
                    style={{ width: '5rem' }}
                    onClick={() => {
                        setIsRunning(false);
                        setState(makeInitialArray());
                    }}
                >
                    Clear
                </button>
                <input
                    type="range"
                    min="5"
                    max="20"
                    defaultValue="10"
                    onChange={(e) => {
                        const res = e.target.value;
                        setResolution(res);
                        setState(makeInitialArray(res));
                    }}
                    onMouseDown={() => setIsResolutonChanging(true)}
                    onMouseUp={() => setIsResolutonChanging(false)}
                ></input>
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
            {state.map((i, ix) => (
                <div key={ix} style={{ display: 'flex' }}>
                    {i.map((j, jx) => (
                        <Cell
                            key={jx}
                            isChecked={j}
                            resolution={resolution}
                            onClick={() => {
                                synth.current.triggerAttackRelease(
                                    tones[ix],
                                    '8n',
                                    '+0.05',
                                );

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
        </div>
    );
}

export default App;

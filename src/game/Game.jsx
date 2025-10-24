import React, { useState, useEffect, useReducer, useRef } from "react";
import {
    instantiateGameState,
    gameStateReducer,
    getTotal,
} from "./GameState.jsx";
import "./Game.scss";
import Player from "./Player.jsx";
import Dealer from "./Dealer.jsx";
import { useDeck } from "./useDeck.jsx";

const Game = ({
    numPlayers = 3,
    numDecks = 6,
    reshuffleAt = 120,
    interval = 300,
}) => {
    const { deal, discard, remaining, discarded } = useDeck(
        numDecks,
        reshuffleAt
    );
    const [gameState, dispatch] = useReducer(
        gameStateReducer,
        instantiateGameState(numPlayers)
    );
    // const bettingTimer = useRef(null);
    // const [bettingTimeLeft, setBettingTimeLeft] = useState(interval * 10); // in ms or seconds

    useEffect(() => {
        setTimeout(
            () => dispatch({ type: "changePhase", phase: "initialDealing" }),
            interval
        );
    }, []);

    useEffect(() => {
        // if (phase === "betting") {
        //     let bettingTime = interval * 10; // milliseconds or ticks
        //     setBettingTimeLeft(bettingTime);

        //     // Update countdown every 100ms (or 1s)
        //     const countdownTimer = setInterval(() => {
        //         setBettingTimeLeft((prev) => {
        //             const remainingTime = prev - 100;
        //             if (remainingTime <= 0) {
        //                 console.log(players);
        //                 const activePlayers = players.filter(
        //                     (p) => p.stake > 0
        //                 );
        //                 if (activePlayers.length > 0) {
        //                     setPlayers((prevPlayers) =>
        //                         prevPlayers.map((player) => ({
        //                             ...player,
        //                             playing: true,
        //                         }))
        //                     );
        //                     setPhase("initialDealing");
        //                     setBettingTimeLeft(0);
        //                     clearInterval(countdownTimer);
        //                 } else {
        //                     setBettingTimeLeft(bettingTime);
        //                 }
        //             } else {
        //                 setBettingTimeLeft(remainingTime);
        //             }
        //         });
        //     }, 100);

        //     return () => {
        //         clearInterval(countdownTimer);
        //     };
        // } else if (phase === "initialDealing") {
        if (gameState.phase === "initialDealing") {
            dealBj();
        } else if (gameState.phase === "dealerTurn") {
            const timer = window.setTimeout(() => {
                // flipping the dealer's card triggers hits via dealer.drawnPile useEffect
                dispatch({ type: "flipDealerCard" });
            }, interval);
            return () => clearTimeout(timer);
        } else if (gameState.phase === "handOver") {
            const timer = window.setTimeout(() => {
                dispatch({ type: "reset" });
            }, interval * 3);
            return () => window.clearTimeout(timer);
        }
    }, [gameState.phase]);

    // Handle dealer playing logic
    useEffect(() => {
        if (gameState.phase === "dealerTurn") {
            const currentTotal = getTotal(gameState.dealer.drawnPile);
            const isSoft = _isSoft17(gameState.dealer.drawnPile);

            // Dealer hits on soft 17 and below
            if (currentTotal < 17 || (currentTotal === 17 && isSoft)) {
                const timer = setTimeout(() => {
                    deal((newCard) => dealToDealer(newCard));
                }, interval);
                return () => clearTimeout(timer);
            } else {
                // Dealer is done, end the hand
                const timer = setTimeout(() => {
                    dispatch({ type: "changePhase", phase: "handOver" });
                }, interval);
                return () => clearTimeout(timer);
            }
        }
    }, [gameState.dealer.drawnPile]);

    const runSequence = (steps) => {
        let totalDelay = 0;
        steps.forEach(({ delay, action }) => {
            totalDelay += delay;
            setTimeout(action, totalDelay);
        });
    };

    function dealBj() {
        // Build the sequence of actions for dealing cards
        const steps = [];

        // Deal card 1 to players
        gameState.players.forEach((player, idx) => {
            steps.push({
                delay: idx === 0 ? 0 : interval,
                action: () =>
                    deal((newCard) =>
                        dispatch({
                            type: "deal",
                            target: "player",
                            newCard,
                            faceUp: true,
                            playerId: player.id,
                        })
                    ),
            });
        });

        // Deal card 1 to dealer
        steps.push({
            delay: interval,
            action: () =>
                deal((newCard) =>
                    dispatch({
                        type: "deal",
                        target: "dealer",
                        newCard,
                        faceUp: false,
                    })
                ),
        });

        // Deal card 2 to players
        gameState.players.forEach((player, _) => {
            steps.push({
                delay: interval,
                action: () =>
                    deal((newCard) =>
                        dispatch({
                            type: "deal",
                            target: "player",
                            newCard,
                            faceUp: true,
                            playerId: player.id,
                        })
                    ),
            });
        });

        // Deal second card to dealer (face down)
        steps.push({
            delay: interval,
            action: () =>
                deal((newCard) =>
                    dispatch({
                        type: "deal",
                        target: "dealer",
                        newCard,
                        faceUp: false,
                    })
                ),
        });

        // End dealer dealing phase and set active player
        steps.push({
            delay: interval,
            action: () => {
                dispatch({ type: "changePhase", phase: "playerTurn" });
            },
        });

        // Execute the sequence
        runSequence(steps);
    }

    const handleHit = (playerId) => {
        deal((newCard) =>
            dispatch({
                type: "deal",
                target: "player",
                newCard,
                faceUp: true,
                playerId: player.id,
            })
        );
        if (currentPlayer.total >= 21) _progressGame();
    };

    const handleStand = () => {
        _progressGame();
    };

    // const handleStake = (playerId, newStake) => {
    //     setPlayers((prev) =>
    //         prev.map((player) =>
    //             player.id !== playerId
    //                 ? player
    //                 : {
    //                       ...player,
    //                       stake: newStake,
    //                   }
    //         )
    //     );
    // };

    const _progressGame = () => {
        if (!gameState.players || gameState.players.length === 0) return;

        const playerIdx = gameState.players.findIndex(
            (p) => p.id === gameState.playerTurn
        );
        if (playerIdx + 1 === gameState.players.length) {
            dispatch({ type: "changePhase", phase: "dealerTurn" });
        } else {
            dispatch({
                type: "setPlayerTurn",
                playerId: gameState.players[playerIdx + 1].id,
            });
        }
    };

    const _isSoft17 = (cards) => {
        const faceUpCards = cards.filter((card) => card.faceUp);
        const hasAce = faceUpCards.some((card) => card.rank === "A");
        const total = getTotal(cards);

        // Soft 17: has an Ace counted as 11, and total is 17
        return hasAce && total === 17;
    };

    return (
        <div className="game-container">
            <h1 className="game-heading">Blackjack - 6 Deck Shoe</h1>
            <div className="game-topbar">
                <div className="player-management-buttons">
                    <button
                        onClick={() => dispatch({ type: "addPlayer" })}
                        disabled={gameState.players.length >= 3}
                    >
                        Add Player
                    </button>
                    <button
                        onClick={() => dispatch({ type: "removePlayer" })}
                        disabled={gameState.players.length <= 1}
                    >
                        Remove Player
                    </button>
                </div>
            </div>
            {/* {gameState.phase === "betting" && (
                <div className="betting-countdown-overlay">
                    Time left to bet: {Math.ceil(bettingTimeLeft / 1000)}s
                </div>
            )} */}

            <div className="game-mat">
                <div className="dealer-section">
                    <div className="drawpile">
                        <div className="card-count">{remaining()}</div>
                        <div className="card-label">Remaining</div>
                    </div>
                    <div className="dealer-mat">
                        <Dealer
                            dealerCards={gameState.dealer.drawnPile}
                            total={gameState.dealer.total}
                        />
                    </div>
                    <div className="discardPile">
                        <div className="card-count">{discarded}</div>
                        <div className="card-label">Discarded</div>
                    </div>
                </div>
                <div className="players-list">
                    {gameState.players.map((player) => (
                        <div className="player-vertical-item" key={player.id}>
                            <Player
                                onHit={() => handleHit(player.id)}
                                onStand={() => handleStand()}
                                canHit={
                                    gameState.phase === "playerTurn" &&
                                    gameState.playerTurn === player.id
                                }
                                canStand={
                                    gameState.phase === "playerTurn" &&
                                    gameState.playerTurn === player.id
                                }
                                playerCards={player.drawnPile}
                                chips={player.chips}
                                stake={player.stake}
                                // changeStake={(newStake) =>
                                //     handleStake(player.id, newStake)
                                // }
                                changeStake={() => {}}
                                total={player.total}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Game;

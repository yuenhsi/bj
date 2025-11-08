import React, { useEffect, useReducer, useRef, useState } from "react";
import { instantiateGameState, gameStateReducer } from "./GameState.jsx";
import "./Game.scss";
import { getTotal } from "./GameHelpers.js";
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
    const bettingTimer = useRef(null);
    const [bettingTimeLeft, setBettingTimeLeft] = useState(null); // in ms

    // Keep track of latest players through a ref
    const playersRef = useRef(gameState.players);
    useEffect(() => {
        playersRef.current = gameState.players;
    }, [gameState.players]);

    // Initialize betting phase and timer
    useEffect(() => {
        const initTimer = setTimeout(() => {
            dispatch({
                type: "phase",
                phase: "betting",
            });
            setBettingTimeLeft(interval * 10); // 10 intervals worth of betting time
        }, interval);

        return () => clearTimeout(initTimer);
    }, []);

    useEffect(() => {
        if (gameState.phase === "betting") {
            bettingTimer.current = setInterval(() => {
                setBettingTimeLeft((prevTime) => {
                    const newTime = prevTime - 100;

                    // Always refer to the latest players via ref
                    const hasActiveStakes = playersRef.current.some(
                        (player) => player.stake > 0
                    );

                    if (newTime <= 0 || hasActiveStakes) {
                        if (bettingTimer.current) {
                            clearInterval(bettingTimer.current);
                            bettingTimer.current = null;
                        }

                        dispatch({
                            type: "phase",
                            phase: "initialDealing",
                        });

                        return 0;
                    }

                    return newTime;
                });
            }, 100);

            // Cleanup when leaving betting phase
            return () => {
                if (bettingTimer.current) {
                    clearInterval(bettingTimer.current);
                    bettingTimer.current = null;
                }
            };
        }
        if (gameState.phase === "initialDealing") {
            _dealBj(() => dispatch({ type: "phase", phase: "playerTurn" }));
        } else if (gameState.phase === "dealerTurn") {
            const timer = window.setTimeout(() => {
                dispatch({ type: "flipDealerCard" });
            }, interval);
            return () => clearTimeout(timer);
        } else if (gameState.phase === "endState") {
            const timer = window.setTimeout(() => {
                const playerCards = gameState.players.reduce(
                    (sum, player) => sum + player.cards.length,
                    0
                );
                discard(playerCards + gameState.dealer.cards.length);
                dispatch({ type: "reset" });
                // Reset betting timer for next round
                setBettingTimeLeft(interval * 10);
            }, interval * 5);
            return () => window.clearTimeout(timer);
        }
    }, [gameState.phase]);

    // Handle dealer playing logic
    useEffect(() => {
        if (
            gameState.phase !== "dealerTurn" ||
            !gameState.dealer.cards[1].faceUp
        )
            return;

        const timer = setTimeout(() => {
            dispatch({ type: "dhit", newCard: deal() });
        }, interval);
        return () => clearTimeout(timer);
    }, [gameState.phase, gameState.dealer.cards]);

    const handleHit = (playerId) => {
        dispatch({
            type: "deal",
            newCard: deal(),
            playerId,
        });
    };

    const handleStake = (playerId, newStake) => {
        dispatch({
            type: "setStake",
            playerId,
            stake: newStake,
        });
    };

    const endPlayerTurn = (playerId) => {
        let playerIdx = gameState.players.findIndex((p) => p.id === playerId);
        if (playerIdx + 1 === gameState.players.length) {
            dispatch({ type: "phase", phase: "dealerTurn" });
        } else {
            dispatch({
                type: "setPlayerTurn",
                playerId: gameState.players[playerIdx + 1].id,
            });
        }
    };

    function _dealBj(onComplete) {
        const steps = [];

        // Card 1
        gameState.players.forEach((player, idx) => {
            steps.push({
                delay: idx === 0 ? 0 : interval,
                action: () =>
                    dispatch({
                        type: "deal",
                        newCard: deal(),
                        playerId: player.id,
                    }),
            });
        });
        steps.push({
            delay: interval,
            action: () =>
                dispatch({
                    type: "dhit",
                    newCard: deal(),
                }),
        });

        // Card 2
        gameState.players.forEach((player, _) => {
            steps.push({
                delay: interval,
                action: () =>
                    dispatch({
                        type: "deal",
                        newCard: deal(),
                        playerId: player.id,
                    }),
            });
        });

        steps.push({
            delay: interval,
            action: () =>
                dispatch({
                    type: "dhit",
                    newCard: deal(false),
                }),
        });

        // End dealer dealing phase and set active player
        steps.push({
            delay: interval,
            action: () => {
                onComplete();
            },
        });

        // Execute the sequence
        let totalDelay = 0;
        steps.forEach(({ delay, action }) => {
            totalDelay += delay;
            setTimeout(action, totalDelay);
        });
    }

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
            {gameState.phase === "betting" && bettingTimeLeft !== null && (
                <div className="betting-countdown-overlay">
                    Time left to bet: {Math.ceil(bettingTimeLeft / 1000)}s
                    {gameState.players.some((player) => player.stake > 0) && (
                        <div className="betting-status">
                            Players have placed bets - ready to deal!
                        </div>
                    )}
                </div>
            )}
            <div className="game-mat">
                <div className="dealer-section">
                    <div className="drawpile">
                        <div className="card-count">{remaining()}</div>
                        <div className="card-label">Remaining</div>
                    </div>
                    <div className="dealer-mat">
                        <Dealer
                            dealerCards={gameState.dealer.cards}
                            total={getTotal(gameState.dealer.cards)}
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
                                onStand={() => endPlayerTurn(player.id)}
                                canHit={
                                    gameState.phase === "playerTurn" &&
                                    gameState.playerTurn === player.id
                                }
                                canStand={
                                    gameState.phase === "playerTurn" &&
                                    gameState.playerTurn === player.id
                                }
                                playerCards={player.cards}
                                chips={player.chips}
                                stake={player.stake}
                                changeStake={(newStake) =>
                                    handleStake(player.id, newStake)
                                }
                                total={getTotal(player.cards)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Game;

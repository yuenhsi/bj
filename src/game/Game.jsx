import React, { useState, useEffect, useRef } from "react";
import Deck from "../models/Deck.js";
import "./Game.scss";
import Player from "./Player.jsx";
import Dealer from "./Dealer.jsx";
import {
    dealCard,
    dealCardToDealer,
    flipDealerCard,
    getTotal,
    isSoft17,
    runSequence,
} from "./gameEngine.js";

const Game = () => {
    const [deck, setDeck] = useState(null);
    const [discarded, setDiscarded] = useState(0);
    const [players, setPlayers] = useState([]);
    const [dealer, setDealer] = useState({ drawnPile: [], total: 0 });
    const [activePlayer, setActivePlayer] = useState(null);
    // 'initialDealing' | 'playerTurn' | 'dealerTurn' | 'handOver'
    const [phase, setPhase] = useState(null);

    useEffect(() => {
        const PLAYER_COUNT = 1;
        const DECK_COUNT = 6;

        const gameDeck = new Deck(DECK_COUNT);
        const playerArr = Array.from({ length: PLAYER_COUNT }, (_, idx) => ({
            id: idx + 1,
            drawnPile: [],
            total: 0,
        }));
        setDeck(gameDeck);
        setDiscarded(0);
        setPlayers(playerArr);
        setTimeout(() => setPhase("initialDealing"), 1000);
    }, []);

    useEffect(() => {
        if (deck && !deck.isEmpty()) {
            const cb = () => {
                setActivePlayer(players[0].id);
                setPhase("playerTurn");
            };

            if (phase === "initialDealing") {
                dealBj(cb);
            } else if (phase === "dealerTurn") {
                const timer = window.setTimeout(() => {
                    flipDealerCard();
                }, 1000);
                return () => clearTimeout(timer);
            } else if (phase === "handOver") {
                const timer = window.setTimeout(() => {
                    setPlayers(
                        players.map((player) => {
                            return {
                                ...player,
                                drawnPile: [],
                                total: 0,
                            };
                        })
                    );
                    let playerCards = 0;
                    for (const player of players) {
                        playerCards += player.drawnPile.length;
                    }
                    setDealer({ drawnPile: [], total: 0 });
                    setDiscarded(
                        (prev) => prev + playerCards + dealer.drawnPile.length
                    );
                    dealBj(cb);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [phase]);

    // Handle dealer playing logic
    useEffect(() => {
        if (phase === "dealerTurn") {
            const currentTotal = _getTotal(dealer.drawnPile);
            const isSoft = _isSoft17(dealer.drawnPile);

            // Dealer hits on soft 17 and below
            if (currentTotal < 17 || (currentTotal === 17 && isSoft)) {
                const timer = setTimeout(() => {
                    dealCardToDealer(true);
                }, 1000);
                return () => clearTimeout(timer);
            } else {
                // Dealer is done, end the hand
                const timer = setTimeout(() => {
                    setPhase("handOver");
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [dealer.drawnPile]);

    const dealCard = (playerId, faceUp) => {
        if (!deck || deck.isEmpty()) return;

        const { newCards, newDeck } = deck.deal(1);
        setDeck(newDeck);

        setPlayers((prevPlayers) =>
            prevPlayers.map((player) => {
                if (player.id !== playerId) return player;

                const updatedPile = [
                    ...player.drawnPile,
                    ...newCards.map((card) => ({
                        ...card,
                        faceUp: faceUp,
                    })),
                ];
                const updatedTotal = faceUp
                    ? _getTotal(updatedPile)
                    : player.total;

                return {
                    ...player,
                    drawnPile: updatedPile,
                    total: updatedTotal,
                };
            })
        );
    };

    const dealCardToDealer = (faceUp) => {
        if (!deck || deck.isEmpty()) return;

        const { newCards, newDeck } = deck.deal(1);
        setDeck(newDeck);

        setDealer((prevDealer) => {
            const updatedPile = [
                ...prevDealer.drawnPile,
                ...newCards.map((card) => ({
                    ...card,
                    faceUp: faceUp,
                })),
            ];
            const updatedTotal = faceUp
                ? _getTotal(updatedPile)
                : prevDealer.total;

            return {
                ...prevDealer,
                drawnPile: updatedPile,
                total: updatedTotal,
            };
        });
    };

    const flipDealerCard = () => {
        setDealer((prevDealer) => {
            const updatedPile = prevDealer.drawnPile.map((card, index) => ({
                ...card,
                faceUp: index === 1 ? true : card.faceUp, // Flip the first card (face down card)
            }));

            return {
                ...prevDealer,
                drawnPile: updatedPile,
                total: _getTotal(updatedPile),
            };
        });
    };

    const runSequence = (steps) => {
        let totalDelay = 0;
        steps.forEach(({ delay, action }) => {
            totalDelay += delay;
            setTimeout(action, totalDelay);
        });
    };

    const dealBj = (onComplete) => {
        // Build the sequence of actions for dealing cards
        const steps = [];

        // Deal first card to each player (face up)
        players.forEach((player, index) => {
            steps.push({
                delay: index === 0 ? 0 : 1000,
                action: () => dealCard(player.id, true),
            });
        });

        // Deal first card to dealer (face up)
        steps.push({
            delay: 1000,
            action: () => dealCardToDealer(true),
        });

        // Deal second card to each player (face up)
        players.forEach((player, index) => {
            steps.push({
                delay: 1000,
                action: () => dealCard(player.id, true),
            });
        });

        // Deal second card to dealer (face down)
        steps.push({
            delay: 1000,
            action: () => dealCardToDealer(false),
        });

        // End dealer dealing phase and set active player
        steps.push({
            delay: 1000,
            action: () => {
                onComplete();
            },
        });

        // Execute the sequence
        runSequence(steps);
    };

    const isPlayerActive = (playerId) => {
        return activePlayer === playerId;
    };

    const handleHit = (playerId) => {
        if (!deck || deck.isEmpty()) return;

        const { newCards, newDeck } = deck.deal(1);
        const updatedPlayers = players.map((player) => {
            if (player.id !== playerId) return player;
            const updatedPile = [
                ...player.drawnPile,
                ...newCards.map((card) => ({
                    ...card,
                    faceUp: true,
                })),
            ];
            const updatedTotal = _getTotal(updatedPile);
            return { ...player, drawnPile: updatedPile, total: updatedTotal };
        });
        const currentPlayer = updatedPlayers.find((p) => p.id === playerId);

        setDeck(newDeck);
        setPlayers(updatedPlayers);

        if (currentPlayer.total >= 21) _progressGame();
    };

    const handleStand = () => {
        if (!deck || deck.isEmpty()) return;

        _progressGame();
    };

    const _progressGame = () => {
        if (!players || players.length === 0) return;

        const playerIdx = players.findIndex((p) => p.id === activePlayer);
        if (playerIdx + 1 === players.length) {
            setPhase("dealerTurn");
        } else {
            setActivePlayer(players[playerIdx + 1].id);
        }
    };

    const _getTotal = (playerCards) => {
        return playerCards.reduce(
            (sum, card) =>
                sum + (card && card.faceUp ? Deck.getCardValue(card.rank) : 0),
            0
        );
    };

    const _isSoft17 = (cards) => {
        const faceUpCards = cards.filter((card) => card.faceUp);
        const hasAce = faceUpCards.some((card) => card.rank === "A");
        const total = _getTotal(cards);

        // Soft 17: has an Ace counted as 11, and total is 17
        return hasAce && total === 17;
    };

    const handleAddPlayer = () => {
        if (players.length < 3) {
            setPlayers((prevPlayers) => {
                const maxId =
                    prevPlayers.length > 0
                        ? Math.max(...prevPlayers.map((p) => p.id))
                        : 0;
                const newId = maxId + 1;
                return [...prevPlayers, { id: newId, drawnPile: [], total: 0 }];
            });
        }
    };

    const handleRemovePlayer = () => {
        setPlayers((prevPlayers) =>
            prevPlayers.length > 1
                ? prevPlayers.slice(0, prevPlayers.length - 1)
                : prevPlayers
        );
    };

    return (
        <div className="game-container">
            <h1 className="game-heading">Blackjack - 6 Deck Shoe</h1>
            <div className="game-topbar">
                <div className="player-management-buttons">
                    <button
                        onClick={handleAddPlayer}
                        disabled={players.length >= 3}
                    >
                        Add Player
                    </button>
                    <button
                        onClick={handleRemovePlayer}
                        disabled={players.length <= 1}
                    >
                        Remove Player
                    </button>
                </div>
            </div>
            <div className="game-mat">
                <div className="game-cards-remaining">
                    <div className="drawpile">
                        <div className="card-count">{deck?.remaining()}</div>
                        <div className="card-label">Remaining</div>
                    </div>
                    <div className="dealer-section">
                        <Dealer
                            dealerCards={dealer.drawnPile}
                            total={dealer.total}
                        />
                    </div>
                    <div className="discardPile">
                        <div className="card-count">{discarded}</div>
                        <div className="card-label">Discarded</div>
                    </div>
                </div>
                <div className="players-list">
                    {players.map((player) => (
                        <div className="player-vertical-item" key={player.id}>
                            <Player
                                onHit={() => handleHit(player.id)}
                                onStand={() => handleStand()}
                                canHit={
                                    phase === "playerTurn" &&
                                    isPlayerActive(player.id)
                                }
                                canStand={
                                    phase === "playerTurn" &&
                                    isPlayerActive(player.id)
                                }
                                playerCards={player.drawnPile}
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

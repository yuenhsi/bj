import React, { useState, useEffect, useRef } from "react";
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

    function constructPlayerArr() {
        return Array.from({ length: numPlayers }, (_, idx) => ({
            id: idx + 1,
            drawnPile: [],
            total: 0,
        }));
    }

    const [players, setPlayers] = useState(() => constructPlayerArr());
    const [dealer, setDealer] = useState({ drawnPile: [], total: 0 });
    const [activePlayer, setActivePlayer] = useState(null);
    // 'betting' | 'initialDealing' | 'playerTurn' | 'dealerTurn' | 'handOver'
    const [phase, setPhase] = useState(null);

    useEffect(() => {
        setTimeout(() => setPhase("initialDealing"), interval);
    }, []);

    useEffect(() => {
        if (phase === "betting") {
        } else if (phase === "initialDealing") {
            dealBj();
        } else if (phase === "dealerTurn") {
            const timer = window.setTimeout(() => {
                flipDealerCard();
            }, interval);
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
                discard(playerCards + dealer.drawnPile.length);
                setPhase("betting");
            }, interval * 3);
            return () => clearTimeout(timer);
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
                    deal((newCard) => dealToDealer(newCard));
                }, interval);
                return () => clearTimeout(timer);
            } else {
                // Dealer is done, end the hand
                const timer = setTimeout(() => {
                    setPhase("handOver");
                }, interval);
                return () => clearTimeout(timer);
            }
        }
    }, [dealer.drawnPile]);

    const addToPlayer = (playerId, newCard, faceUp) => {
        setPlayers((prevPlayers) =>
            prevPlayers.map((player) => {
                if (player.id !== playerId) return player;

                const updatedPile = [
                    ...player.drawnPile,
                    {
                        ...newCard,
                        faceUp,
                    },
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

    const addToDealer = (newCard, faceUp) => {
        setDealer((prevDealer) => {
            const updatedPile = [
                ...prevDealer.drawnPile,
                {
                    ...newCard,
                    faceUp,
                },
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

    const dealToDealer = (newCard) => {
        setDealer((prevDealer) => {
            const updatedPile = [
                ...prevDealer.drawnPile,
                {
                    ...newCard,
                    faceUp: true,
                },
            ];

            return {
                drawnPile: updatedPile,
                total: _getTotal(updatedPile),
            };
        });
    };

    const flipDealerCard = () => {
        setDealer((prevDealer) => {
            const updatedPile = prevDealer.drawnPile.map((card, index) => ({
                ...card,
                faceUp: index === 1 ? true : card.faceUp, // Flip the second card
            }));

            return {
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

    function dealBj() {
        // Build the sequence of actions for dealing cards
        const steps = [];

        // Deal card 1 to players
        players.forEach((player, idx) => {
            steps.push({
                delay: idx === 0 ? 0 : interval,
                action: () =>
                    deal((newCard) => addToPlayer(player.id, newCard, true)),
            });
        });

        // Deal card 1 to dealer
        steps.push({
            delay: interval,
            action: () => deal((newCard) => addToDealer(newCard, true)),
        });

        // Deal card 2 to players
        players.forEach((player, _) => {
            steps.push({
                delay: interval,
                action: () =>
                    deal((newCard) => addToPlayer(player.id, newCard, true)),
            });
        });

        // Deal second card to dealer (face down)
        steps.push({
            delay: interval,
            action: () => deal((newCard) => addToDealer(newCard, false)),
        });

        // End dealer dealing phase and set active player
        steps.push({
            delay: interval,
            action: () => {
                setActivePlayer(players[0].id);
                setPhase("playerTurn");
            },
        });

        // Execute the sequence
        runSequence(steps);
    }

    const handleHit = (playerId) => {
        deal((newCard) => addToPlayer(playerId, newCard, true));
        if (currentPlayer.total >= 21) _progressGame();
    };

    const handleStand = () => {
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

    const getCardValue = (rank) => {
        if (rank === "A") return 11;
        if (["K", "Q", "J"].includes(rank)) return 10;
        return parseInt(rank, 10);
    };

    const _getTotal = (playerCards) => {
        return playerCards.reduce(
            (sum, card) =>
                sum + (card && card.faceUp ? getCardValue(card.rank) : 0),
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
                        <div className="card-count">{remaining()}</div>
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
                                    activePlayer === player.id
                                }
                                canStand={
                                    phase === "playerTurn" &&
                                    activePlayer === player.id
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

import {
    getTotal,
    shouldDealerHit,
    resolvePlayerChips,
} from "./GameHelpers.js";

export function instantiateGameState(numPlayers) {
    return {
        players: Array.from({ length: numPlayers }, (_, idx) => ({
            id: idx + 1,
            cards: [],
            chips: 300,
            stake: 0,
            playing: false,
        })),
        playerTurn: null,
        dealer: {
            cards: [],
        },
        // 'betting' | 'initialDealing' | 'playerTurn' | 'dealerTurn' | 'endState'
        phase: null,
    };
}

export function gameStateReducer(gameState, action) {
    switch (action.type) {
        case "phase":
            // mark active players for initial state
            if (action.phase === "initialDealing") {
                return {
                    ...gameState,
                    phase: action.phase,
                    players: gameState.players.map((p) => {
                        return {
                            ...p,
                            playing: p.stake > 0,
                        };
                    }),
                };
            }
            // peek after deal
            if (action.phase === "playerTurn") {
                if (
                    getTotal(gameState.dealer.cards) === 10 ||
                    getTotal(gameState.dealer.cards) === 11
                ) {
                    if (
                        getTotal(
                            gameState.dealer.cards.map((c) => ({
                                ...c,
                                faceUp: true,
                            }))
                        ) === 21
                    ) {
                        return {
                            ...gameState,
                            phase: "dealerTurn",
                        };
                    }
                }
            }
            return {
                ...gameState,
                phase: action.phase,
                playerTurn:
                    action.phase === "playerTurn"
                        ? gameState.players[0].id
                        : gameState.playerTurn,
            };
        case "reset":
            return {
                ...gameState,
                players: gameState.players.map((player) => ({
                    ...player,
                    cards: [],
                    playing: player.stake > 0,
                })),
                dealer: {
                    ...gameState.dealer,
                    cards: [],
                },
                phase: "betting",
            };
        case "deal":
            let player = gameState.players.find(
                (p) => p.id === action.playerId
            );
            let newPlayerPile = [...player.cards, action.newCard];
            // check whether this places the player above 21
            if (getTotal(newPlayerPile) > 21) {
                const activePlayers = gameState.players.filter(
                    (p) => p.playing
                );
                const currentIdx = activePlayers.findIndex(
                    (p) => p.id === action.playerId
                );
                if (currentIdx + 1 === activePlayers.length) {
                    return {
                        ...gameState,
                        phase: "dealerTurn",
                        playerTurn: null,
                        players: gameState.players.map((p) => {
                            if (p.id !== action.playerId) return p;

                            return {
                                ...p,
                                cards: newPlayerPile,
                            };
                        }),
                    };
                } else {
                    return {
                        ...gameState,
                        playerTurn: activePlayers[currentIdx + 1].id,
                        players: gameState.players.map((p) => {
                            if (p.id !== action.playerId) return p;

                            return {
                                ...p,
                                cards: newPlayerPile,
                            };
                        }),
                    };
                }
            } else {
                return {
                    ...gameState,
                    players: gameState.players.map((p) => {
                        if (p.id !== action.playerId) return p;

                        const newPlayerPile = [...p.cards, action.newCard];
                        return {
                            ...p,
                            cards: newPlayerPile,
                        };
                    }),
                };
            }
        case "flipDealerCard":
            const updatedPile = gameState.dealer.cards.map((card, idx) => ({
                ...card,
                faceUp: idx === 1 ? true : card.faceUp,
            }));
            return {
                ...gameState,
                dealer: {
                    ...gameState.dealer,
                    cards: updatedPile,
                },
            };
        case "setPlayerTurn":
            return {
                ...gameState,
                playerTurn: action.playerId,
            };
        case "addPlayer":
            return {
                ...gameState,
                players: [
                    ...gameState.players,
                    {
                        id: Math.max(gameState.players.map((p) => p.id)) + 1,
                        cards: [],
                        playing: true,
                        chips: 300,
                        stake: 15,
                    },
                ],
            };
        case "removePlayer":
            return {
                ...gameState,
                players:
                    gameState.players.length > 1
                        ? gameState.players.slice(
                              0,
                              gameState.players.length - 1
                          )
                        : gameState.players,
            };
        case "dhit":
            if (shouldDealerHit(gameState.dealer.cards)) {
                let newDealerPile = [...gameState.dealer.cards, action.newCard];
                return {
                    ...gameState,
                    dealer: {
                        ...gameState.dealer,
                        cards: newDealerPile,
                    },
                };
            } else {
                const newPlayers = resolvePlayerChips(
                    gameState.players,
                    gameState.dealer.cards
                );
                return {
                    ...gameState,
                    players: newPlayers,
                    phase: "endState",
                };
            }
        case "setStake":
            return {
                ...gameState,
                players: gameState.players.map((player) =>
                    player.id === action.playerId
                        ? {
                              ...player,
                              stake: action.stake,
                              chips:
                                  player.chips - (action.stake - player.stake),
                          }
                        : player
                ),
            };
        default:
            return gameState;
    }
}

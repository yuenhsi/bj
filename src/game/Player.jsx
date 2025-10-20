import React from "react";
import Deck from "../models/Deck.js";
import "./Player.scss";

const Player = ({ onHit, onStand, canHit, canStand, playerCards, total }) => {
    // Determine points status
    let pointsClass = "";
    if (total === 21) {
        pointsClass = "player-point-success";
    } else if (total > 21) {
        pointsClass = "player-point-bust";
    }

    return (
        <div>
            <div className={`player-point-total ${pointsClass}`}>
                Points: {total}
            </div>
            <div className="player-area">
                <button
                    className="action-btn-small"
                    onClick={onHit}
                    disabled={!canHit || total >= 21}
                >
                    Hit
                </button>
                {playerCards && (
                    <div className="player-cards">
                        {playerCards.map((card, idx) => (
                            <div
                                className={`drawn-card ${
                                    card && !card.faceUp ? "face-down" : ""
                                }`}
                                key={idx}
                            >
                                {card && card.faceUp ? (
                                    <span>
                                        {card.rank}
                                        {card.suit}
                                    </span>
                                ) : card ? (
                                    <span className="card-back">🂠</span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
                <button
                    className="action-btn-small"
                    onClick={onStand}
                    disabled={!canStand}
                >
                    Stand
                </button>
            </div>
        </div>
    );
};

export default Player;

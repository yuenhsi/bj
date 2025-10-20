import React from "react";
import "./Dealer.scss";

const Dealer = ({ dealerCards, total }) => {
    // Determine points status
    let pointsClass = "";
    if (total === 21) {
        pointsClass = "dealer-point-success";
    } else if (total > 21) {
        pointsClass = "dealer-point-bust";
    }

    return (
        <div className="dealer-container">
            <div className={`dealer-point-total ${pointsClass}`}>
                Dealer: {total}
            </div>
            <div className="dealer-area">
                {dealerCards && (
                    <div className="dealer-cards">
                        {dealerCards.map((card, idx) => (
                            <div
                                className={`dealer-card ${
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
            </div>
        </div>
    );
};

export default Dealer;

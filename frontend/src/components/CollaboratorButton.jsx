import React from 'react';

const CollaboratorButton = ({ showCard, setShowCard }) => {
    return (
        <>
            <audio
                id="popup-sound"
                src="data:audio/wav;base64,UklGRkwAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YUQAAAD/AAD/AAf/AAT/AAj/AAz/AAX/AA//AAH/AAP/AAv/AAf/AAv/AAn/AAz/AAf/AAv/AAP/AAv/AAn/AAz/AAj/AAv/AAP/AA//AAD/AAv/AAn/AAD/AAf/AAP/"
                preload="auto"
            />
            <audio
                id="popout-sound"
                src="data:audio/wav;base64,UklGRkwAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YUQAAAD/AAD/AAf/AAT/AAj/AAz/AAX/AA//AAH/AAP/AAv/AAf/AAv/AAn/AAz/AAf/AAv/AAP/AAv/AAn/AAz/AAj/AAv/AAP/AA//AAD/AAv/AAn/AAD/AAf/AAP/"
                preload="auto"
            />
            <button
                onClick={e => {
                    const btn = e.currentTarget;
                    setShowCard(prev => {
                        const toggled = !prev;
                        const bgColor = toggled ? "#fff" : "#000";
                        const iconColor = toggled ? "#000" : "#fff";
                        const popInAudio = document.getElementById('popup-sound');
                        const popOutAudio = document.getElementById('popout-sound');
                        
                        if (toggled && popInAudio) { popInAudio.currentTime = 0; popInAudio.play(); }
                        if (!toggled && popOutAudio) { popOutAudio.currentTime = 0; popOutAudio.play(); }
                        
                        btn.style.backgroundColor = toggled ? "#f3f3f3" : "#222";
                        btn.style.boxShadow = "0 8px 16px rgba(0,0,0,0.25)";
                        btn.style.transform = "scale(1.06)";
                        btn.style.filter = "hue-rotate(150deg) saturate(3.2) brightness(1.15) contrast(1.3) drop-shadow(0 0 8px #43ff64)";
                        btn.children[0].style.color = iconColor;
                        
                        btn.animate([
                            { transform: "scale(1.10) rotate(-12deg) skewY(-2deg)" },
                            { transform: "scale(1.14) rotate(12deg) skewY(2deg)" },
                            { transform: "scale(1.11) rotate(-10deg) skewY(-2deg)" },
                            { transform: "scale(1.12) rotate(10deg) skewY(2deg)" },
                            { transform: "scale(1.10) rotate(-9deg) skewY(-2deg)" },
                            { transform: "scale(1.13) rotate(6deg)" }
                        ], { duration: 350, iterations: 1 });
                        
                        setTimeout(() => {
                            btn.style.backgroundColor = bgColor;
                            btn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                            btn.style.transform = "scale(1)";
                            btn.style.filter = "";
                            btn.children[0].style.color = iconColor;
                        }, 350);

                        return toggled;
                    });
                }}
                title="Toggle Card"
                style={{
                    cursor: 'pointer', backgroundColor: showCard ? '#fff' : '#000', color: showCard ? "#000" : "#fff",
                    border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '17px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)', transition: 'background-color 0.3s, box-shadow 0.3s, transform 0.2s'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = showCard ? "#f3f3f3" : "#222";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.25)";
                    e.currentTarget.style.transform = "scale(1.06)";
                    e.currentTarget.style.filter = "hue-rotate(150deg) saturate(3.2) brightness(1.15) contrast(1.3) drop-shadow(0 0 8px #43ff64)";
                    e.currentTarget.children[0].style.color = showCard ? "#000" : "#fff";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = showCard ? "#fff" : "#000";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.filter = "";
                    e.currentTarget.children[0].style.color = showCard ? "#000" : "#fff";
                }}
            >
                <i className="ri-group-fill" style={{ color: showCard ? "#000" : "#fff", transition: "color 0.3s" }}></i>
            </button>
        </>
    );
};

export default CollaboratorButton;
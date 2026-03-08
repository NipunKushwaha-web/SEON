import React from 'react';

const BlasterButton = ({ onSend, showCard }) => {
    return (
        <>
            <audio
                id="blast-sound"
                src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YYQAAAD/AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA"
                preload="auto"
            />
            <button
                className="px-5 bg-slate-950 text-white rounded-md blaster-btn"
                style={{
                    maxWidth: '48px', maxHeight: '48px', minWidth: '32px', minHeight: '48px', width: '48px', height: '48px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    position: 'relative', marginBottom: '8px', marginLeft: '0px', marginRight: '6px',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = showCard ? "#f3f3f3" : "#222";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.25)";
                    e.currentTarget.style.transform = "scale(1.06)";
                    e.currentTarget.style.filter = "hue-rotate(150deg) saturate(3.2) brightness(1.15) contrast(1.3) drop-shadow(0 0 8px #43ff64)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = showCard ? "#fff" : "#000";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.filter = "";
                }}
                onClick={e => {
                    onSend();
                    if (window._projTextareaRef) window._projTextareaRef.style.height = '48px';
                    
                    const blastAudio = document.getElementById('blast-sound');
                    if (window.AudioContext || window.webkitAudioContext) {
                        const context = new (window.AudioContext || window.webkitAudioContext)();
                        fetch(blastAudio.src)
                            .then(resp => resp.arrayBuffer())
                            .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
                            .then(buffer => {
                                for (let i = 0; i < 2; i++) {
                                    const source = context.createBufferSource();
                                    source.buffer = buffer;
                                    const gainNode = context.createGain();
                                    gainNode.gain.value = 5;
                                    source.connect(gainNode).connect(context.destination);
                                    source.start();
                                }
                            });
                    }

                    const btn = e.currentTarget;
                    const oldBlaster = btn.querySelector('.blaster-effect');
                    if (oldBlaster) oldBlaster.remove();

                    const blaster = document.createElement('span');
                    blaster.className = 'blaster-effect';
                    Object.assign(blaster.style, {
                        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                        width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #43ff64',
                        opacity: '0.9', zIndex: 2, pointerEvents: 'none',
                    });
                    btn.appendChild(blaster);

                    blaster.animate([
                        { width: '16px', height: '16px', opacity: 0.9, borderWidth: '2px', filter: 'drop-shadow(0 0 10px #43ff64)' },
                        { width: '80px', height: '80px', opacity: 0, borderWidth: '0px', filter: 'drop-shadow(0 0 18px #43ff64)' }
                    ], { duration: 420, easing: 'cubic-bezier(.28,.13,.57,1.12)' });

                    setTimeout(() => blaster.remove(), 420);
                }}
            >
                <i className="ri-send-plane-fill"></i>
            </button>
        </>
    );
};

export default BlasterButton;
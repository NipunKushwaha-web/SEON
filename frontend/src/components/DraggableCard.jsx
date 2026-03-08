import React, { useState, useEffect, useCallback } from 'react';

const CLOSE_SOUND_SRC = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YYQAAAD/AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA";

const DraggableCard = ({ isClosing: isClosingProp = false, onClose, users = [] }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isClosing, setIsClosing] = useState(isClosingProp);

  useEffect(() => {
    setIsClosing(isClosingProp);
  }, [isClosingProp]);

  const playCloseSound = useCallback(() => {
    const audio = new window.Audio(CLOSE_SOUND_SRC);
    audio.play();
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y
      });
    },
    [offset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleCloseClick = () => {
    playCloseSound();
    setIsClosing(true);
    setTimeout(() => {
      if (typeof onClose === 'function') onClose();
    }, 400); 
  };

  return (
    <>
      <style>
        {`
          @keyframes openCardAnimation {
            0% { opacity: 0; transform: scale(0.6); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes closeCardAnimation {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.6); }
          }
        `}
      </style>

      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          width: '300px',
          padding: '20px',
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          boxShadow: isDragging
            ? '0 15px 30px rgba(0,0,0,0.2)'
            : '0 4px 8px rgba(0,0,0,0.1)',
          userSelect: 'none',
          zIndex: isDragging ? 1000 : 1,
          transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
          animation: isClosing
            ? 'closeCardAnimation 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
            : 'openCardAnimation 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={handleCloseClick}
          style={{
            position: 'absolute', top: '10px', right: '10px', background: '#f3f3f3',
            borderRadius: '50%', border: 'none', width: '32px', height: '32px',
            boxShadow: '0 1px 3px rgba(50,50,50,0.06)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#e0e0e0')}
          onMouseOut={e => (e.currentTarget.style.background = '#f3f3f3')}
        >
          <span style={{ fontSize: '1.3rem', color: '#555', pointerEvents: 'none' }}>✕</span>
        </button>

        <div className='font-semibold flex flex-col items-center mb-4' style={{ fontFamily: 'sans-serif' }}>
          Members
        </div>
        
        {/* Render Dynamic Users Here */}
        <div className="members-list overflow-auto max-h-48 flex flex-col gap-2">
            {users.length > 0 ? users.map((u, index) => (
                <div key={u._id || index} className="flex items-center gap-3 hover:bg-slate-100 p-2 rounded-md transition-colors cursor-pointer">
                  <div className='aspect-square rounded-full w-8 h-8 flex items-center justify-center text-white bg-slate-600 text-sm'>
                    <i className="ri-user-fill"></i>
                  </div>
                  <div className="user overflow-hidden">
                    <h1 className='font-sans text-md m-0 truncate'>{u.email}</h1>
                  </div>
                </div>
            )) : (
                <p className="text-sm text-gray-500 text-center">No users available.</p>
            )}
        </div>
      </div>
    </>
  );
};

export default DraggableCard;
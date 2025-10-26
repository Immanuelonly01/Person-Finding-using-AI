// frontend/src/components/Card.jsx
import React from 'react';

// Reusable Card Component
const Card = ({ title, children, style = {} }) => {
    const defaultStyle = {
        padding: '1.5rem',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem', /* Slightly more rounded */
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease-in-out',
        ...style,
    };

    return (
        <div style={defaultStyle}>
            {title && (
                <h2 style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: '700', 
                    color: '#1f2937', 
                    marginBottom: '1rem',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '0.5rem'
                }}>
                    {title}
                </h2>
            )}
            <div>
                {children}
            </div>
        </div>
    );
};

export default Card;
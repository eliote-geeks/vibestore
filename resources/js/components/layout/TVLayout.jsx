import React from 'react';
import TVHeader from './TVHeader';
import TVFooter from './TVFooter';

const TVLayout = ({ children }) => {
    return (
        <div className="tv-layout">
            <TVHeader />
            <main className="tv-main">
                {children}
            </main>
            <TVFooter />

            <style jsx>{`
                .tv-layout {
                    min-height: 100vh;
                    background: #000;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                }

                .tv-main {
                    flex: 1;
                    position: relative;
                    width: 100%;
                    height: calc(100vh - 100px);
                    overflow: hidden;
                }

                @media (max-width: 768px) {
                    .tv-main {
                        height: calc(100vh - 80px);
                    }
                }
            `}</style>
        </div>
    );
};

export default TVLayout;

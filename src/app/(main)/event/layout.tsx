import React from 'react';

export default function EventLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            {/* Layout content cho event pages */}
            {children}
        </div>
    );
}
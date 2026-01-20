import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Coffee Connect | LifeGen Church',
    description: 'Connect and enjoy free coffee!',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}

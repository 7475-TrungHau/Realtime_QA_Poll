
export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen rounded-sm">
            {children}
        </div>
    );
}
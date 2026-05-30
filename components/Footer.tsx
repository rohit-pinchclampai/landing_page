export default function Footer() {
    return (
        <footer className="border-t border-[var(--overlay-border)] py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <p className="text-center text-xs text-pinch-muted">
                    &copy; {new Date().getFullYear()} PinchClamp AI. All rights reserved.
                </p>
            </div>
        </footer>
    );
}

export function Loader({ gone, siteName }: { gone: boolean; siteName: string }) {
    const words = siteName.split(/\s+/);

    return (
        <div
            id="loader"
            className={gone ? "gone" : ""}
            role="status"
            aria-live="polite"
        >
            <div className="loader-word" aria-label={siteName}>
                {words.map((word, index) => (
                    <span key={`${word}-${index}`}>
                        {index > 0 ? "\u2009" : null}
                        {word}
                    </span>
                ))}
            </div>
            <div className="loader-bar" />
            <p className="loader-tag">Intelligence, Engineered.</p>
        </div>
    );
}

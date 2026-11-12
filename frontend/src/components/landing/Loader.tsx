export function Loader({ gone, siteName }: { gone: boolean; siteName: string }) {
    const words = siteName.split(/\s+/);

    return (
        <div
            id="loader"
            className={gone ? "gone" : ""}
            role="status"
            aria-live="polite"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 10001,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#071a4a",
            }}
        >
            <div className="loader-word" aria-label={siteName} style={{ color: "#ffffff" }}>
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

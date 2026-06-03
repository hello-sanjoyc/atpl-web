export function Loader({ gone }: { gone: boolean }) {
    return (
        <div
            id="loader"
            className={gone ? "gone" : ""}
            role="status"
            aria-live="polite"
        >
            <div className="loader-word" aria-label="Aranax Technologies">
                <span>Aranax</span>
                <span>&thinsp;</span>
                <span>Technologies</span>
            </div>
            <div className="loader-bar" />
            <p className="loader-tag">Intelligence, Engineered.</p>
        </div>
    );
}

export default function AdBanner() {
  return (
    <>
      <span className="text-[var(--color-text-secondary)]">Made by Julian Collins — </span>
      <a
        href="https://your-portfolio-link.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--color-accent)] hover:underline"
      >
        View Portfolio
      </a>
    </>
  );
}

import Image from "next/image";
import styles from "../landing.module.css";

export type VerifiedSalonStory = {
  salonName: string;
  location: string;
  quote: string;
  imageUrl?: string;
  verifiedMetric?: string;
};

export default function VerifiedProofSection({
  stories,
}: {
  stories: VerifiedSalonStory[];
}) {
  if (stories.length === 0) return null;

  return (
    <section className={styles.proofSection} aria-labelledby="proof-title">
      <div className={styles.sectionHeading}>
        <span className={styles.sectionKicker}>Esperienze verificate</span>
        <h2 id="proof-title">Risultati raccontati dai saloni che li hanno ottenuti.</h2>
      </div>
      <div className={styles.proofGrid}>
        {stories.map((story) => (
          <article key={story.salonName + story.location}>
            {story.imageUrl ? (
              <Image
                alt={"Logo o foto di " + story.salonName}
                height={72}
                src={story.imageUrl}
                width={72}
              />
            ) : null}
            <blockquote>“{story.quote}”</blockquote>
            <div>
              <p><strong>{story.salonName}</strong><span>{story.location}</span></p>
              {story.verifiedMetric ? <b>{story.verifiedMetric}</b> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

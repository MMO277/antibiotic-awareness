/** Shimmer placeholder shown while data is loading.
 *  Usage:  <SkeletonCard />           — one card
 *          <SkeletonCard count={6} />  — grid of 6 cards
 */
export default function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skel-card" aria-hidden="true">
          <div className="skel-line skel-title" />
          <div className="skel-line skel-sub" />
          <div className="skel-line skel-short" />
        </div>
      ))}
    </>
  );
}

import Link from "next/link";
export function EmptyState({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link className="button" href={href}>
          {label ?? "Shiko aktivitetet"}
        </Link>
      )}
    </div>
  );
}

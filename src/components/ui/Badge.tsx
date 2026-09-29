const labels: Record<string, string> = {
  pending: "Në pritje",
  accepted: "Pranuar",
  rejected: "Refuzuar",
  attended: "Pjesëmarrës",
  draft: "Draft",
  published: "Publikuar",
  full: "Plot",
  completed: "Përfunduar",
  cancelled: "Anuluar",
  archived: "Arkivuar",
};
export function Badge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>{labels[status] ?? status}</span>
  );
}

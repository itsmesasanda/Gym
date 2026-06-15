const TONE = {
  active: "badge-green",
  pending: "badge-amber",
  locked: "badge-red",
  rejected: "badge-grey",
  disabled: "badge-red",
  paid: "badge-green",
  overdue: "badge-red",
  none: "badge-grey",
  high: "badge-red",
  normal: "badge-grey",
};

export default function Badge({ value }) {
  if (!value) return null;
  return <span className={"badge " + (TONE[value] || "badge-grey")}>{value}</span>;
}

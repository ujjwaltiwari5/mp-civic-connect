export default function PriorityBadge({ score }) {
  const s = Number(score) || 0;
  let label = "Low";
  let classes = "bg-green-100 text-green-800";

  if (s >= 70) {
    label = "High";
    classes = "bg-red-100 text-red-800";
  } else if (s >= 40) {
    label = "Medium";
    classes = "bg-amber-100 text-amber-800";
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${classes}`}>
      {label} ({s.toFixed(1)})
    </span>
  );
}

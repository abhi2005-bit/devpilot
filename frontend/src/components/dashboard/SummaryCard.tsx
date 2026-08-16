interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: string;
  description: string;
  variant: "primary" | "secondary" | "error" | "tertiary";
}

const variantStyles = {
  primary: {
    icon: "text-primary",
    hover: "hover:border-primary",
  },
  secondary: {
    icon: "text-secondary",
    hover: "hover:border-secondary",
  },
  error: {
    icon: "text-error",
    hover: "hover:border-error",
  },
  tertiary: {
    icon: "text-tertiary",
    hover: "hover:border-tertiary",
  },
};

function SummaryCard({
  title,
  value,
  icon,
  description,
  variant,
}: SummaryCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`rounded-lg border border-outline-variant bg-surface-container p-md transition-colors ${styles.hover}`}
    >
      <div className="mb-sm flex items-start justify-between">
        <span className="font-body-sm text-body-sm uppercase tracking-wider text-on-surface-variant">
          {title}
        </span>

        <span className={`material-symbols-outlined ${styles.icon}`}>
          {icon}
        </span>
      </div>

      <div className="font-display-lg text-display-lg text-on-surface">
        {value}
      </div>

      <div className="mt-xs font-caption text-caption text-on-surface-variant">
        {description}
      </div>
    </div>
  );
}

export default SummaryCard;
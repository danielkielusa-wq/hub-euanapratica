import { Check } from "lucide-react";

interface SelectCardProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

const SelectCard = ({ label, selected, onClick }: SelectCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`select-card flex items-center gap-3 text-left w-full group ${
        selected ? "selected" : ""
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
          selected
            ? "border-primary bg-primary"
            : "border-muted-foreground/40"
        }`}
      >
        {selected && <Check className="w-2.5 h-2.5 text-primary-foreground check-pop" />}
      </div>
      <span className="font-medium text-sm text-foreground flex-1">{label}</span>
    </button>
  );
};

export default SelectCard;

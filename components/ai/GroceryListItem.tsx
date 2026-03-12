import { Trash2, Check } from 'lucide-react';

interface GroceryListItemProps {
  ingredient: string;
  quantity: number;
  unit: string;
  checked?: boolean;
  onToggle?: (checked: boolean) => void;
  onDelete?: () => void;
}

export function GroceryListItem({
  ingredient,
  quantity,
  unit,
  checked = false,
  onToggle,
  onDelete,
}: GroceryListItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition group">
      <button
        onClick={() => onToggle?.(!checked)}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 transition flex items-center justify-center ${
          checked
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-500'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`font-medium transition ${
            checked ? 'text-gray-400 line-through' : 'text-gray-900'
          }`}
        >
          {ingredient}
        </p>
        <p className="text-sm text-gray-600">
          {quantity} {unit}
        </p>
      </div>

      <button
        onClick={onDelete}
        className="flex-shrink-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

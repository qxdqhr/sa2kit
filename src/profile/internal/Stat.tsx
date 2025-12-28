import { StatType } from '..';
import { cn } from '../../utils';

interface StatProps extends StatType {
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  icon,
  className = '',
}) => {
  return (
    <div className={cn("flex flex-col items-center flex-1 text-center", className)}>
      {icon && <span className="mb-2 text-2xl text-gray-400">{icon}</span>}
      <div>
        <div className="text-lg font-semibold text-gray-800">{value}</div>
        <div className="text-xs text-gray-400 mt-1">{label}</div>
      </div>
    </div>
  );
};

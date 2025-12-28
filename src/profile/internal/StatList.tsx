import { StatType } from "..";
import { Stat } from "./Stat";
import { cn } from '../../utils';

interface StatListProps {
  stats: StatType[];
  className?: string;
}

export const StatList: React.FC<StatListProps> = ({
  stats,
  className = '',
}) => {
  if (!stats || stats.length === 0) return null;

  return (
    <div className={cn("flex justify-between mt-4 pt-4 border-t border-gray-100", className)}>
      {stats.map((stat, index) => (
        <Stat key={index} {...stat} />
      ))}
    </div>
  );
}; 
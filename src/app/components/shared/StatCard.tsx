import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { cn } from "../ui/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  /** Soft tinted background for icon container (e.g. bg-blue-50) */
  iconBg?: string;
  /** Icon color when using iconBg (e.g. text-blue-600) */
  iconTextColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "bg-blue-500",
  iconBg,
  iconTextColor,
  trend,
  className,
}: StatCardProps) {
  const useSoftIcon = iconBg != null && iconTextColor != null;
  const containerClass = useSoftIcon ? iconBg : iconColor;
  const iconClass = useSoftIcon ? iconTextColor : "text-white";

  return (
    <Card className={cn(className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#6B7280]">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-[#111827]">{value}</p>
            {trend && (
              <p className={`mt-2 text-sm ${trend.isPositive ? "text-[#16A34A]" : "text-red-600"}`}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", containerClass)}>
            <Icon className={cn("h-6 w-6 shrink-0", iconClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

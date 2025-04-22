import { Insight } from "@shared/schema";
import { Lightbulb, TrendingUp, TrendingDown, PlusCircle } from "lucide-react";
import { useMemo } from "react";

interface AITipsCardProps {
  insights: Insight[];
  isLoading: boolean;
}

export default function AITipsCard({ insights, isLoading }: AITipsCardProps) {
  const currentInsight = useMemo(() => {
    if (!insights || insights.length === 0) {
      return {
        text: "Add more transactions to get personalized insights.",
        type: "tip" as const
      };
    }
    return insights[0];
  }, [insights]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-6 w-6" />;
      case 'decrease':
        return <TrendingDown className="h-6 w-6" />;
      case 'new_category':
        return <PlusCircle className="h-6 w-6" />;
      case 'tip':
      default:
        return <Lightbulb className="h-6 w-6" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-pink-500/20 animate-pulse">
      <div className="flex">
        <div className="flex-shrink-0 mr-4">
          <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
            {getIcon(currentInsight.type)}
          </div>
        </div>
        <div>
          <div className="flex items-center">
            <h3 className="text-sm font-semibold text-gray-900">SpendBot Insights</h3>
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-pink-500/10 text-pink-500">AI</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {isLoading 
              ? "Analyzing your spending patterns..." 
              : currentInsight.text}
          </p>
        </div>
      </div>
    </div>
  );
}

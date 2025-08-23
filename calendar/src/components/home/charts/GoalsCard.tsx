import { TbTarget } from "react-icons/tb";
import { Card, CardContent } from "../../utils/Card";

const goals = [
  { name: "Study", actual: 9, target: 10, color: "bg-indigo-500" },
  { name: "Gym", actual: 3, target: 3, color: "bg-green-500" },
  { name: "Reading", actual: 2, target: 5, color: "bg-yellow-500" }
];

export const GoalsCard = () => (
  <Card>
    <CardContent>
      <div className="flex items-center mb-3">
        <TbTarget className="text-xl mr-2" color="#FF5722" />
        <h3 className="text-xl font-bold">Goals For This Week</h3>
      </div>
      <div className="space-y-3">
        {goals.map((goal, i) => {
          const percent = Math.min(100, (goal.actual / goal.target) * 100);
          return (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span>{goal.name}</span>
                <span>{goal.actual}h / {goal.target}h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${goal.color}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

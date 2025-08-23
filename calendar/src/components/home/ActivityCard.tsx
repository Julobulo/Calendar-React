import { motion } from "framer-motion";
import { Card, CardContent } from "../utils/Card";
import { getHumanReadableDiffBetweenTimes, highlightTimesAndNames, isLightOrDark } from "../../utils/helpers";
import { HomeColors } from "./constants/HomeColors";
import { ActivityEntry } from "../../utils/types";

interface Props {
    entry: Omit<ActivityEntry, "_id">; // Omit the _id
    index: number;
}

export const ActivityCard = ({ entry, index }: Props) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={index}>
  <div style={{ backgroundColor: HomeColors.activities[entry.activity] || "#ffffff" }} className="rounded-2xl shadow-md relative">
    <Card className="bg-transparent">
      <CardContent className={`p-4 text-left text-[14px] ${isLightOrDark(HomeColors.activities[entry.activity]) ? "text-black" : "text-white"}`}>
        {/* Top row: activity name + duration, and start → end in top-right */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg">
            {entry.activity} ({getHumanReadableDiffBetweenTimes(entry.start || "00:00", entry.end || "00:00")})
          </h3>
          <span className="text-sm font-medium">
            {entry.start} → {entry.end}
          </span>
        </div>

        {/* Description */}
        <p dangerouslySetInnerHTML={{ __html: highlightTimesAndNames(entry.description) }}></p>
      </CardContent>
    </Card>
  </div>
</motion.div>

);

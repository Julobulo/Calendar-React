import { motion } from "framer-motion";
import { Card, CardContent } from "../utils/Card";
import { isLightOrDark, highlightTimesAndNames } from "../../utils/helpers";
import { HomeColors } from "./constants/HomeColors";

export const VariableCard = ({ entry, delay = 0 }: any) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <div style={{ backgroundColor: HomeColors.variables[entry.variable] || "#ffffff" }} className="rounded-2xl shadow-md">
      <Card className="bg-transparent">
        <CardContent className={`p-4 text-left text-[14px] ${isLightOrDark(HomeColors.variables[entry.variable]) ? "text-black" : "text-white"}`}>
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-lg">{entry.variable}</h3>
            <span>-</span>
            <p>{entry.value}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </motion.div>
);

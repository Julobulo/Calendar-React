import { motion } from "framer-motion";
import { Card, CardContent } from "../utils/Card";
import { HomeColors } from "./constants/HomeColors";
import { isLightOrDark, highlightTimesAndNames } from "../../utils/helpers";

export const NoteCard = ({ note }: any) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <div style={{ backgroundColor: HomeColors.note }} className="rounded-2xl shadow-md">
      <Card className="bg-transparent">
        <CardContent className={`${isLightOrDark(HomeColors.note) ? "text-black" : "text-white"} text-[14px] p-4`}>
          <span dangerouslySetInnerHTML={{ __html: highlightTimesAndNames(note) }}></span>
        </CardContent>
      </Card>
    </div>
  </motion.div>
);

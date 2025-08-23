import { AverageTimesPerWeek } from "./charts/AverageTimesPerWeek"
import { GoalsCard } from "./charts/GoalsCard"
import { ProductiveTimeChart } from "./charts/ProductiveTimeChart"
import { ProgressOverTime } from "./charts/ProgressOverTime"
import { Streaks } from "./charts/Streaks"
import { StudyingVSYoutube } from "./charts/StudyingVSYoutube"
import { TimeBreakdownByDay } from "./charts/TimeBreakdownByDay"
import { TimeSpentPerActivity } from "./charts/TimeSpentPerActivity"

export const ChartsSection = () => {
    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Gain Insight Into Your Habits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProductiveTimeChart />

                <GoalsCard />

                <StudyingVSYoutube />

                <TimeBreakdownByDay />

                <Streaks />

                <TimeSpentPerActivity />

                <AverageTimesPerWeek />

                <ProgressOverTime />

            </div>
        </section>
    )
}
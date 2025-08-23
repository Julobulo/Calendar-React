import { Card, CardContent } from "../../utils/Card"
import { streaks } from "../constants/mockData"

export const Streaks = () => {
    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-bold mb-4">🔥 Your Streaks</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {streaks.map((s, i) => (
                        <div
                            key={i}
                            className="rounded-xl bg-background border border-border p-3 shadow-sm flex flex-col justify-between"
                        >
                            <p className="text-sm font-medium text-muted-foreground mb-1">{s.activity}</p>
                            <p className="text-lg font-semibold">{s.current} day{(s.current !== 1) && "s"}</p>
                            <p className="text-xs text-muted-foreground">Longest: {s.longest} day{(s.longest !== 1) && "s"}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
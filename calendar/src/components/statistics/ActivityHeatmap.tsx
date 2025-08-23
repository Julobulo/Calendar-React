import Spinner from "../utils/Spinner";
import CalendarHeatmap, { ReactCalendarHeatmapValue, TooltipDataAttrs } from 'react-calendar-heatmap';
import { Tooltip as ReactTooltip } from 'react-tooltip';

interface Props {
    entryCountData: any[];
    loading: boolean;
    heatmapType: string;
    setHeatmapType: (val: "all" | "activities" | "variables" | "notes") => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    maxCount: number;
}

interface DailyActivity {
    date: string;
    count: { activityCount: number, variableCount: number, note: 0 | 1 };
}

const ActivityHeatmap = ({
    entryCountData,
    loading,
    heatmapType,
    setHeatmapType,
    selectedYear,
    setSelectedYear,
    maxCount,
}: Props) => {
    // return (
    //     <div className="bg-white shadow rounded-2xl p-4 my-4">
    //         <h2 className="text-xl font-bold">Activity Heatmap</h2>
    //         <div className="flex space-x-4 mb-4">
    //             <button onClick={() => setHeatmapType("entries")} className={heatmapType === "entries" ? "font-bold" : ""}>Entries</button>
    //             <button onClick={() => setHeatmapType("time")} className={heatmapType === "time" ? "font-bold" : ""}>Time</button>
    //         </div>
    //         {loading ? (
    //             <div className="flex justify-center"><Spinner /></div>
    //         ) : (<CalendarHeatmap
    //             startDate={new Date(selectedYear, 0, 1)}
    //             endDate={new Date(selectedYear, 11, 31)}
    //             values={entryCountData ?? []}
    //             classForValue={(value: ReactCalendarHeatmapValue<string> | undefined) => {
    //                 let count = 0;
    //                 if (heatmapType === "all" || heatmapType === "activities") count += value?.count.activityCount
    //                 if (heatmapType === "all" || heatmapType === "variables") count += value?.count.variableCount
    //                 if (heatmapType === "all" || heatmapType === "notes") count += value?.count.note
    //                 if (!value || !count) return 'fill-gray-200';
    //                 const intensity = count / maxCount; // 0 → 1
    //                 if (intensity < 0.2) return 'fill-green-200';
    //                 if (intensity < 0.4) return 'fill-green-300';
    //                 if (intensity < 0.6) return 'fill-green-400';
    //                 if (intensity < 0.8) return 'fill-green-500';
    //                 return 'fill-green-600';
    //             }}
    //             tooltipDataAttrs={(value: ReactCalendarHeatmapValue<string> | undefined): TooltipDataAttrs => {
    //                 if (!value || !(value as DailyActivity).date) {
    //                     return { 'data-tooltip-id': '', 'data-tooltip-content': '' } as TooltipDataAttrs;
    //                 }
    //                 let entriesCount = 0;
    //                 if (heatmapType === "all" || heatmapType === "activities") entriesCount += value?.count.activityCount
    //                 if (heatmapType === "all" || heatmapType === "variables") entriesCount += value?.count.variableCount
    //                 if (heatmapType === "all" || heatmapType === "notes") entriesCount += value?.count.note
    //                 if (!entriesCount) return { 'data-tooltip-id': '', 'data-tooltip-content': '' } as TooltipDataAttrs

    //                 let label = '';
    //                 if (heatmapType === 'all') {
    //                     label = `entr${entriesCount === 1 ? 'y' : 'ies'}`;
    //                 } else if (heatmapType === 'activities') {
    //                     label = `activit${entriesCount === 1 ? 'y' : 'ies'}`;
    //                 } else if (heatmapType === 'variables') {
    //                     label = `variable${entriesCount === 1 ? '' : 's'}`;
    //                 } else if (heatmapType === 'notes') {
    //                     label = `note${entriesCount === 1 ? '' : 's'}`;
    //                 }

    //                 return {
    //                     'data-tooltip-id': 'heatmap-tooltip',
    //                     'data-tooltip-content': `${value.date}: ${entriesCount} ${label}`,
    //                 } as TooltipDataAttrs;
    //             }}
    //         />)}
    //         {/* )} */}
    //         <ReactTooltip id="heatmap-tooltip" /> {/* attaches to all elements with data-tooltip-id="heatmap-tooltip" */}
    //     </div>
    // );

    return (
        <div className="bg-white shadow rounded-2xl p-4 space-y-4 my-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Activity Heatmap</h2>
                <select
                    className="p-2 border rounded-md"
                    value={heatmapType}
                    onChange={(e) => setHeatmapType(e.target.value as "all" | "activities" | "variables" | "notes")}
                >
                    <option value="all">All Entries</option>
                    <option value="activities">Activities</option>
                    <option value="variables">Variables</option>
                    <option value="notes">Notes</option>
                </select>
                <div className="flex justify-center items-center mb-4">
                    <button
                        onClick={() => setSelectedYear(selectedYear - 1)}
                        className="px-2 mx-2 py-1 text-sm bg-gray-100 rounded-l"
                    >
                        &lt;
                    </button>
                    <span className="text-lg font-semibold">{selectedYear}</span>
                    <button
                        onClick={() => setSelectedYear(selectedYear + 1)}
                        className="px-2 mx-2 py-1 text-sm bg-gray-100 rounded-l"
                    >
                        &gt;
                    </button>
                </div>
            </div>
            {loading ? (
                <div className="flex justify-center">
                    <Spinner />
                </div>
            ) : (
                <CalendarHeatmap
                    startDate={new Date(selectedYear, 0, 1)}
                    endDate={new Date(selectedYear, 11, 31)}
                    values={entryCountData ?? []}
                    classForValue={(value: ReactCalendarHeatmapValue<string> | undefined) => {
                        let count = 0;
                        if (heatmapType === "all" || heatmapType === "activities") count += value?.count.activityCount
                        if (heatmapType === "all" || heatmapType === "variables") count += value?.count.variableCount
                        if (heatmapType === "all" || heatmapType === "notes") count += value?.count.note
                        if (!value || !count) return 'fill-gray-200';
                        const intensity = count / maxCount; // 0 → 1
                        if (intensity < 0.2) return 'fill-green-200';
                        if (intensity < 0.4) return 'fill-green-300';
                        if (intensity < 0.6) return 'fill-green-400';
                        if (intensity < 0.8) return 'fill-green-500';
                        return 'fill-green-600';
                    }}
                    tooltipDataAttrs={(value: ReactCalendarHeatmapValue<string> | undefined): TooltipDataAttrs => {
                        if (!value || !(value as DailyActivity).date) {
                            return { 'data-tooltip-id': '', 'data-tooltip-content': '' } as TooltipDataAttrs;
                        }
                        let entriesCount = 0;
                        if (heatmapType === "all" || heatmapType === "activities") entriesCount += value?.count.activityCount
                        if (heatmapType === "all" || heatmapType === "variables") entriesCount += value?.count.variableCount
                        if (heatmapType === "all" || heatmapType === "notes") entriesCount += value?.count.note
                        if (!entriesCount) return { 'data-tooltip-id': '', 'data-tooltip-content': '' } as TooltipDataAttrs

                        let label = '';
                        if (heatmapType === 'all') {
                            label = `entr${entriesCount === 1 ? 'y' : 'ies'}`;
                        } else if (heatmapType === 'activities') {
                            label = `activit${entriesCount === 1 ? 'y' : 'ies'}`;
                        } else if (heatmapType === 'variables') {
                            label = `variable${entriesCount === 1 ? '' : 's'}`;
                        } else if (heatmapType === 'notes') {
                            label = `note${entriesCount === 1 ? '' : 's'}`;
                        }

                        return {
                            'data-tooltip-id': 'heatmap-tooltip',
                            'data-tooltip-content': `${value.date}: ${entriesCount} ${label}`,
                        } as TooltipDataAttrs;
                    }}
                />)}
            <ReactTooltip id="heatmap-tooltip" />
            {/* attaches to all elements with data-tooltip-id="heatmap-tooltip" */}
        </div>
    )
};

export default ActivityHeatmap;

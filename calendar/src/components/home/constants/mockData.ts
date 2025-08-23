import { format } from "date-fns";
import { getDiffBetweenTimes } from "../../../utils/helpers";

export const mockActivities = [
  {
    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-14"),
    entries: [
      { activity: "Studying", start: "08:00", end: "10:10", description: "2h10min started my chemistry presentation for friday" },
      { activity: "YouTube", start: "10:15", end: "11:15", description: "1h Watched productivity videos" },
      { activity: "Workout", start: "11:30", end: "13:00", description: "Push day: hit chest and triceps for 1h30min" },
      { activity: "Reading", start: "13:15", end: "13:45", description: "30min Fiction before bed" },
      { activity: "Programming", start: "14:00", end: "16:05", description: "Worked for 2h5min on my website's UI with my friend @Alexis" },
    ],
    note: "Had a productive day, talked to @Alice and @Bob in the afternoon.",
    variables: [{ variable: "Weight (kg)", value: "70.9" }],
    location: { name: "New York", lat: 40.712776, lng: -74.005974 },
  },
  {
    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-15"),
    entries: [
      { activity: "Studying", start: "08:00", end: "10:00", description: "2h Focused on math exercises" },
      { activity: "YouTube", start: "10:15", end: "11:00", description: "Watched science explainers for 45min" },
      { activity: "Workout", start: "11:15", end: "11:55", description: "Cardio for 20min and abs for another 20min" },
    ],
    note: "Stayed mostly at the desk today, good study flow.",
    variables: [{ variable: "Weight (kg)", value: "70.3" }],
    location: { name: "New York", lat: 40.712776, lng: -74.005974 },
  },
  {
    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-16"),
    entries: [
      { activity: "Studying", start: "08:00", end: "09:40", description: "1h40min physics revision" },
      { activity: "Chores", start: "09:45", end: "10:15", description: "Cleaned room for 10min and laundry for 20min" },
      { activity: "Reading", start: "10:30", end: "11:10", description: "40min, finished a short novel" },
    ],
    note: "Getting ready to leave for grandma's tomorrow.",
    variables: [{ variable: "Weight (kg)", value: "70.1" }],
    location: { name: "New York", lat: 40.712776, lng: -74.005974 },
  },
  {
    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-17"),
    entries: [
      { activity: "Studying", start: "07:30", end: "08:30", description: "1h Reviewed flashcards on the train" },
      { activity: "YouTube", start: "08:35", end: "08:55", description: "20min Watched news highlights" },
      { activity: "Travel", start: "09:00", end: "13:00", description: "4h Train ride from New York to Boston" },
    ],
    note: "Chill travel day. Grandma cooked dinner!",
    variables: [{ variable: "Weight (kg)", value: "69.8" }],
    location: { name: "Grandma's house in Boston", lat: 42.360081, lng: -71.058884 },
  },
  {
    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-18"),
    entries: [
      { activity: "Studying", start: "08:00", end: "09:20", description: "1h20min Worked on chemistry problems" },
      { activity: "Reading", start: "09:30", end: "10:20", description: "50min Reading in the garden" },
      { activity: "Chores", start: "10:30", end: "11:30", description: "1h helped grandma with cleaning her house" },
    ],
    note: "Boston is peaceful. Studied outside in the sun.",
    variables: [{ variable: "Weight (kg)", value: "69.6" }],
    location: { name: "Grandma's house in Boston", lat: 42.360081, lng: -71.058884 },
  },
  {
    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-19"),
    entries: [
      { activity: "YouTube", start: "08:00", end: "08:40", description: "Watched judo tutorials for 40min" },
      { activity: "Workout", start: "08:45", end: "09:35", description: "Bodyweight full-body workout, 50min" },
      { activity: "Reading", start: "09:40", end: "10:00", description: "Started a new book (20min)" },
    ],
    note: "Keeping up with the routine even away from home.",
    variables: [{ variable: "Weight (kg)", value: "69.3" }],
    location: { name: "Grandma's house in Boston", lat: 42.360081, lng: -71.058884 },
  },
  {
    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-20"),
    entries: [
      { activity: "YouTube", start: "08:00", end: "09:30", description: "Watched documentaries, 1h30min" },
      { activity: "Studying", start: "09:40", end: "10:40", description: "1h light review of math" },
      { activity: "Rest", start: "10:45", end: "10:45", description: "Relaxed all day" },
    ],
    note: "Took a break but still did a bit of study.",
    variables: [{ variable: "Weight (kg)", value: "69" }],
    location: { name: "Grandma's house in Boston", lat: 42.360081, lng: -71.058884 },
  },
];

export const streaks = [
  { activity: "Workout", current: 2, longest: 10 },
  { activity: "Study", current: 5, longest: 18 },
  { activity: "Reading", current: 1, longest: 7 }
];

export const compareActivities = mockActivities.map(activity => {
  const date = format(new Date(activity.date), "EEE"); // e.g., "Mon"
  let studyTime = 0;
  let youtubeTime = 0;

  activity.entries.forEach(entry => {
    if (entry.activity.toLowerCase().includes("study")) {
      studyTime += getDiffBetweenTimes(entry.start || "", entry.end || "");
    } else if (entry.activity.toLowerCase().includes("youtube")) {
      youtubeTime += getDiffBetweenTimes(entry.start || "", entry.end || "");
    }
  });

  return {
    date,
    Study: +(studyTime / 60).toFixed(1), // Convert to hours
    YouTube: +(youtubeTime / 60).toFixed(1),
  };
});


export const activityDurationMap = mockActivities.reduce((acc, { entries }) => {
  for (const { activity, start, end } of entries) {
    acc[activity] = (acc[activity] || 0) + getDiffBetweenTimes(start || "", end || "");
  }
  return acc;
}, {} as Record<string, number>);

export const sortedActivitySummary = Object.entries(activityDurationMap)
  .filter(([_, time]) => time > 0)
  .map(([name, time]) => ({ name, time }))
  .sort((a, b) => b.time - a.time);

export const totalActivityTime = sortedActivitySummary.reduce((sum, { time }) => sum + time, 0);

export const highestAvgPerWeek = [
  { activity: "Studying", avg: 630 },
  { activity: "Workout", avg: 210 },
  { activity: "YouTube", avg: 270 },
  { activity: "Reading", avg: 180 },
  { activity: "Chores", avg: 150 },
  { activity: "Travel", avg: 120 },
  { activity: "Rest", avg: 90 },
];

export const allActivityNames = Array.from(
  new Set(mockActivities.flatMap((a) => a.entries.map((e) => e.activity)))
);

export const chartData = mockActivities.map((activity) => {
  const day = activity.date.toLocaleDateString("en-US", { weekday: "short" });
  const dayData: any = { day };

  for (const entry of activity.entries) {
    if (getDiffBetweenTimes(entry.start || "", entry.end || "") > 0) {
      dayData[entry.activity] = getDiffBetweenTimes(entry.start || "", entry.end || "");
    }
  }

  return dayData;
});

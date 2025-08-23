import { Card, CardContent } from "../utils/Card";

export const FeaturesSection = () => (
  <section className="space-y-6">
    <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Features</h2>
    <div className="grid md:grid-cols-3 gap-6">
      {[
        { emoji: "📅", title: "Log Each Day", description: "Add activities, time, and notes — it's quick and flexible" },
        { emoji: "📊", title: "View Your Progress", description: "Visualize your habits over time with clean charts" },
        { emoji: "🧠", title: "Stay Accountable", description: "Seeing your data helps you stay consistent" }
      ].map((feature, i) => (
        <Card key={i} className="p-4 text-center hover:scale-[1.03] transition-transform">
          <CardContent>
            <div className="text-3xl">{feature.emoji}</div>
            <h3 className="font-semibold mt-2">{feature.title}</h3>
            <p className="text-sm mt-1">{feature.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
);

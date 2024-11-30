

const Statistics = () => {
  const statsData = {
    totalSales: 3452,
    activeUsers: 1204,
    revenue: 98750,
    trends: [
      { month: "Jan", value: 5000 },
      { month: "Feb", value: 6000 },
      { month: "Mar", value: 7000 },
      { month: "Apr", value: 8000 },
    ],
    categories: [
      { name: "Category A", value: 50 },
      { name: "Category B", value: 30 },
      { name: "Category C", value: 20 },
    ],
  };

  return (
    <div className="p-10">
      {/* Key Metrics */}
      <div className="flex space-x-10 mb-10">
        <div className="text-center">
          <div className="text-lg font-bold">Total Sales</div>
          <div className="text-2xl">{statsData.totalSales}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">Active Users</div>
          <div className="text-2xl">{statsData.activeUsers}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">Revenue</div>
          <div className="text-2xl">${statsData.revenue}</div>
        </div>
      </div>

      {/* Line Graph (Trend) */}
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-4">Trends Over Time</h3>
        <div className="bg-gray-200 p-6 rounded-lg">
          <svg width="100%" height="200">
            {/* Fake Line Graph */}
            <polyline
              points="0,150 50,120 100,110 150,90"
              fill="none"
              stroke="blue"
              strokeWidth="3"
            />
            {/* X and Y axis labels */}
            <text x="10" y="160" className="text-xs">Jan</text>
            <text x="60" y="160" className="text-xs">Feb</text>
            <text x="110" y="160" className="text-xs">Mar</text>
            <text x="160" y="160" className="text-xs">Apr</text>
          </svg>
        </div>
      </div>

      {/* Bar Chart (Categories) */}
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-4">Categories Breakdown</h3>
        <div className="flex space-x-4">
          {statsData.categories.map((category, index) => (
            <div key={index} className="w-1/4">
              <div className="text-xs font-bold text-center">{category.name}</div>
              <div
                className="bg-blue-500 text-white text-center"
                style={{ height: `${category.value * 2}px` }}
              >
                {category.value}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pie Chart (Fake) */}
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-4">Revenue Distribution</h3>
        <div className="flex justify-center items-center">
          <div
            className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-400 to-blue-700"
            style={{
              clipPath: "polygon(50% 50%, 100% 0%, 100% 100%, 50% 50%)",
            }}
          ></div>
        </div>
        <div className="text-center mt-4 text-xs">Pie chart placeholder</div>
      </div>
    </div>
  );
};

export default Statistics;

const Home = () => {
    return (
      <div className="flex justify-center items-center text-center p-10 pt-5">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">
            Welcome to the Dashboard
          </h1>
          <p className="text-lg mb-6 text-gray-600">
            This is a simple and interactive dashboard built for managing and tracking your calendar events and statistics. It allows you to view your activities, manage your calendar, and track your progress.
          </p>
          <p className="text-lg mb-6 text-gray-600">
            With this dashboard, you can:
          </p>
          <ul className="list-inside list-disc text-lg text-gray-600 mb-6">
            <li>View and manage your calendar events.</li>
            <li>Track various statistics related to your activities.</li>
            <li>Get an overview of your performance over time.</li>
          </ul>
          <p className="text-lg text-gray-600">
            To get started, simply navigate to the <a href="/calendar">Calendar</a> or <a href="/statistics">Statistics</a> page using the sidebar.
          </p>
        </div>
      </div>
    );
  };
  
  export default Home;
  
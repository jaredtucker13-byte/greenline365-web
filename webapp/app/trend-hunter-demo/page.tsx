'use client';

import DailyTrendHunter from '../components/DailyTrendHunter';

export default function TrendHunterDemo() {
  const handleTrendsLoaded = (trends: any[]) => {
    console.log('Trends loaded:', trends);
  };

  return (
    <div className=\"min-h-screen bg-gradient-to-b from-black via-gray-900 to-black\">
      {/* Header */}
      <div className=\"container mx-auto px-4 py-8\">
        <div className=\"text-center mb-8\">
          <h1 className=\"text-5xl font-bold text-white mb-4\">
            Daily Trend Hunter Demo
          </h1>
          <p className=\"text-gray-400 text-lg\">
            Test the Daily Trend Hunter with your N8N webhook
          </p>
        </div>

        {/* Daily Trend Hunter Component */}
        <DailyTrendHunter
          userId=\"67f6536d-6521-4ac8-a6a5-9827bb35f4cc\"
          trendType=\"manual\"
          onTrendsLoaded={handleTrendsLoaded}
        />

        {/* Info Section */}
        <div className=\"mt-16 max-w-4xl mx-auto\">
          <div className=\"bg-black/40 backdrop-blur-xl border border-[#00e676]/20 rounded-2xl p-8\">
            <h2 className=\"text-2xl font-bold text-white mb-4\">
              How It Works
            </h2>
            <div className=\"space-y-4 text-gray-300\">
              <div className=\"flex items-start gap-3\">
                <span className=\"text-2xl\">1️⃣</span>
                <div>
                  <p className=\"font-semibold text-white\">Enter Zip Code</p>
                  <p className=\"text-sm text-gray-400\">Input a 5-digit US zip code</p>
                </div>
              </div>
              <div className=\"flex items-start gap-3\">
                <span className=\"text-2xl\">2️⃣</span>
                <div>
                  <p className=\"font-semibold text-white\">N8N Webhook Processes</p>
                  <p className=\"text-sm text-gray-400\">Your production webhook analyzes local trends</p>
                </div>
              </div>
              <div className=\"flex items-start gap-3\">
                <span className=\"text-2xl\">3️⃣</span>
                <div>
                  <p className=\"font-semibold text-white\">Trends Displayed</p>
                  <p className=\"text-sm text-gray-400\">Results are stored in database with auto-journaling</p>
                </div>
              </div>
              <div className=\"flex items-start gap-3\">
                <span className=\"text-2xl\">4️⃣</span>
                <div>
                  <p className=\"font-semibold text-white\">3-Hour Expiry (Live Pulse)</p>
                  <p className=\"text-sm text-gray-400\">Live trends expire after 3 hours for real-time relevance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className=\"mt-8 bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8\">
            <h3 className=\"text-xl font-bold text-white mb-4\">Technical Details</h3>
            <div className=\"space-y-2 text-sm font-mono text-gray-400\">
              <p><span className=\"text-[#00e676]\">Webhook:</span> https://n8n.srv1f56042.hstgr.cloud/webhook-test/...</p>
              <p><span className=\"text-[#00e676]\">Backend API:</span> /api/daily-trend-hunter</p>
              <p><span className=\"text-[#00e676]\">Database:</span> local_trends, trend_history, user_actions</p>
              <p><span className=\"text-[#00e676]\">Auto-Journaling:</span> Enabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

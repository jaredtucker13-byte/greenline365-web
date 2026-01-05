
"use client";
import { useState } from "react";

export default function BookingWidget() {
  const [selectedDate, setSelectedDate] = useState("");

  return (
    <div className="flex flex-col gap-4 text-left">
      <label className="text-xs font-semibold text-gray-700">
        Select a date
      </label>

      <div className="border border-gray-300 rounded-lg p-3 bg-white shadow-sm">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
        />
      </div>

      <button
        type="button"
        disabled={!selectedDate}
        className="w-full rounded bg-green-600 px-4 py-2 text-white font-semibold disabled:bg-gray-300"
      >
        {selectedDate ? `Continue with ${selectedDate}` : "Continue"}
      </button>
    </div>
  );
}
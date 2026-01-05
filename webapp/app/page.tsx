import BookingWidget from "./components/BookingWidget";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-2xl text-center mb-12">
        <h1 className="text-5xl font-extrabold text-green-700 mb-6">
          GreenLine365
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your daily AI-assisted planning and accountability partner. 
          Stop guessing, start growing.
        </p>
        <div className="flex justify-center gap-4">
          <button className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition">
            Open Chat
          </button>
          <button className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-full font-bold hover:bg-green-50 transition">
            Join Waitlist
          </button>
        </div>
      </div>

      {/* THIS IS THE ACTUAL CALENDAR WIDGET */}
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl">
        <h3 className="text-lg font-bold mb-4 text-center">Schedule Your Demo</h3>
        <BookingWidget />
      </div>
    </main>
  );
}
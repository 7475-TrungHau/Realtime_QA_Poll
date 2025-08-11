import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Real-time Q&amp;A Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Create interactive events, engage your audience with live Q&amp;A
            sessions and real-time polling
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-blue-600 text-4xl mb-4">❓</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Live Q&amp;A
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Audience can ask questions in real-time and vote on the most
              important ones
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-green-600 text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Real-time Polls
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create interactive polls and see results update instantly as people
              vote
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-purple-600 text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Easy to Use
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Simple interface for both event creators and participants, no
              registration required for guests
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
            Create your first event or join an existing one. Sign in to create
            events or participate as a guest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/event"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              Browse Events
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
            >
              Sign In to Create
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full flex flex-col items-center text-center gap-8">
        {/* Hero image */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          <Image
            src="/OpenTax.webp"
            alt="OpenTax"
            width={640}
            height={360}
            priority
            className="w-full h-auto"
          />
        </div>

        {/* Description */}
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
          OpenTax is a free, open&#8209;source framework for Indian Income Tax. It aims to democratise
          tax processing by making complex tax rules, calculations, and ITR generation accessible to
          everyone — tax professionals, developers, startups, and large&#8209;scale platforms.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/filing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 transition-colors"
          >

            See OpenTax in Action
          </Link>

          <a
            href="https://github.com/Nootus/OpenTax"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </a>
        </div>

        {/* About link */}
        <p className="text-sm text-gray-500">
          <Link href="/about" className="text-blue-600 hover:underline font-medium">
            Click here
          </Link>{' '}
          to get more details on OpenTax and contribution guidelines.
        </p>
      </div>
    </div>
  );
}

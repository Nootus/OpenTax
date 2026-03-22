import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Build Information - IndiaTax.AI',
  description: 'Application build information and deployment details',
};

// This timestamp is generated at build time
const buildTimestamp = new Date().toISOString();

export default function BuildInfoPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Background with grid pattern */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{ backgroundImage: 'url(/background.webp)' }}
        />
        {/* Top fade overlay */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-white to-transparent z-10" />
        {/* Bottom fade overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white to-transparent z-10" />
        {/* Left fade overlay */}
        <div className="absolute top-0 bottom-0 left-0 w-48 bg-gradient-to-r from-white to-transparent z-10" />
        {/* Right fade overlay */}
        <div className="absolute top-0 bottom-0 right-0 w-48 bg-gradient-to-l from-white to-transparent z-10" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">
        <main className="pb-28">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Build Information
                </h1>
                <p className="text-lg text-gray-600">
                  Application deployment details
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-8 md:p-12 border border-gray-200">
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                      Last Build Time
                    </h2>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-2">ISO Format:</p>
                      <p className="text-xl font-mono text-gray-800 mb-4 break-all">
                        {buildTimestamp}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">Formatted:</p>
                      <p className="text-2xl text-gray-900">
                        {new Date(buildTimestamp).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZoneName: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#FAFBF9] flex flex-col justify-center items-center p-6 text-[#111827]">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#0F3F2E]"></div>
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#0F3F2E] flex items-center justify-center text-white shadow-sm ring-4 ring-[#0F3F2E]/10">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M9 12l2 2 4-4" strokeWidth="2.4"></path>
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">404</h1>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Page Not Found</h2>
        
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved. Verify the URL and try again.
        </p>

        <Link 
          href="/login" 
          className="w-full inline-flex justify-center items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0F3F2E] hover:bg-[#14533D] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F3F2E]"
        >
          Return to Portal
        </Link>
      </div>
      
      <div className="mt-8 text-xs text-gray-400 font-medium tracking-wide">
        CYBERVEST &copy; {new Date().getFullYear()}
      </div>
    </main>
  );
}

import { Github, ExternalLink, PlaySquare, Shield } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CYBERVEST | Links",
  description: "Cybersecurity Risk Intelligence Platform - Links",
};

export default function LinksPage() {
  return (
    <div className="min-h-screen bg-[#0A0F14] text-white flex flex-col items-center justify-center p-6 sm:p-10 font-sans selection:bg-[#2e6951] selection:text-white">
      {/* Background ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2e6951] opacity-20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#1a4030] opacity-20 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center">
        
        {/* Header / Logo */}
        <div className="mb-10 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2e6951] to-[#1a4030] flex items-center justify-center shadow-lg shadow-[#2e6951]/20 border border-white/10 mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              CYBERVEST
            </h1>
            <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
              Cybersecurity Risk Intelligence Platform
            </p>
          </div>
        </div>

        {/* Links Container */}
        <div className="w-full space-y-4">
          
          {/* Button 1: GitHub */}
          <a
            href="https://github.com/buildwithrehman/CYBERVEST"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center p-4 bg-[#141B22] border border-white/10 rounded-2xl hover:bg-[#1C2631] hover:border-[#2e6951]/50 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-[#2e6951]/10 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mr-4 group-hover:bg-[#2e6951]/20 group-hover:text-[#4ade80] transition-colors">
              <Github className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-white mb-0.5 truncate">
                GitHub Repository
              </h2>
              <p className="text-xs text-slate-400 line-clamp-2">
                View the CyberVest source code and project repository.
              </p>
            </div>
            <div className="ml-3 shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-[#4ade80]" />
            </div>
          </a>

          {/* Button 2: Live Prototype */}
          <a
            href="https://cybervest-sigma.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center p-4 bg-[#141B22] border border-white/10 rounded-2xl hover:bg-[#1C2631] hover:border-[#2e6951]/50 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-[#2e6951]/10 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mr-4 group-hover:bg-[#2e6951]/20 group-hover:text-[#4ade80] transition-colors">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-white mb-0.5 truncate">
                Live Prototype
              </h2>
              <p className="text-xs text-slate-400 line-clamp-2">
                Open and explore the deployed CyberVest prototype.
              </p>
            </div>
            <div className="ml-3 shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-[#4ade80]" />
            </div>
          </a>

          {/* Button 3: Video Demo */}
          <a
            href="https://drive.google.com/file/d/1wQmPkzran9P7VBIZlgEnuug6SEYSCqhq/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center p-4 bg-[#141B22] border border-white/10 rounded-2xl hover:bg-[#1C2631] hover:border-[#2e6951]/50 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-[#2e6951]/10 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mr-4 group-hover:bg-[#2e6951]/20 group-hover:text-[#4ade80] transition-colors">
              <PlaySquare className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-white mb-0.5 truncate">
                Video Demo
              </h2>
              <p className="text-xs text-slate-400 line-clamp-2">
                Watch the CyberVest demonstration video.
              </p>
            </div>
            <div className="ml-3 shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-[#4ade80]" />
            </div>
          </a>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center pb-6">
          <p className="text-xs text-slate-500 font-medium">
            Secure enterprise risk analytics.
          </p>
        </div>

      </div>
    </div>
  );
}

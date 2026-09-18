import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - CYBERVEST',
  description: 'Terms of Service for CYBERVEST cyber risk quantification platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F3F2E] flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F3F2E]">CYBERVEST</span>
          </div>
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-grow max-w-3xl mx-auto px-6 py-12 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-slate-500 text-sm mb-10">Effective Date: [Insert Date Placeholder]</p>
          
          <div className="space-y-8 text-slate-700 text-base leading-relaxed">
            
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the CYBERVEST platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the application. These terms apply to all visitors, users, and others who access the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">2. Description of CYBERVEST</h2>
              <p>
                CYBERVEST is a cyber risk quantification and optimization platform designed to support decision-making regarding cybersecurity investments, control gaps, and financial risk exposure estimation based on the FAIR methodology.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">3. Account Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials (including passwords) and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or any other security breaches.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">4. Organization and User Responsibilities</h2>
              <p>
                Organizations using CYBERVEST are responsible for managing the roles, permissions (RBAC), and access of their members. Users must act on behalf of their authorized organization and may not attempt to access or manipulate data belonging to other organizations on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">5. Acceptable Use</h2>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Use the service for any illegal or unauthorized purpose.</li>
                <li>Interfere with or disrupt the integrity or performance of the platform.</li>
                <li>Attempt to gain unauthorized access to the application, its related systems, or other organizations&apos; data.</li>
                <li>Reverse-engineer or attempt to extract the source code of the software.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">6. Cybersecurity Data and Uploaded Evidence</h2>
              <p>
                You retain ownership of any telemetry, assets, and evidence files you upload to the platform. However, you are solely responsible for the legality, reliability, and appropriateness of this data. Do not upload classified material, personally identifiable information (PII) beyond what is required for user administration, or malware/harmful artifacts to the Evidence Vault.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">7. Decision-Support Estimates (No Financial/Legal Advice)</h2>
              <p>
                The financial exposure metrics, Expected Annual Loss (EAL), Return on Security Investment (ROSI), and risk optimization outputs provided by CYBERVEST are <strong>decision-support estimates</strong> based on statistical models (including FAIR). They are NOT guarantees, warranties of security, financial advice, or legal compliance guarantees. You are solely responsible for your business and investment decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">8. AI-Generated Explanations</h2>
              <p>
                CYBERVEST utilizes Artificial Intelligence (AI) and Machine Learning (ML) to provide informational explanations, summaries, and predictive insights. These AI-generated outputs are for context and guidance only and are <strong>not the quantitative source of truth</strong>. You should independently verify any critical AI-generated insights before acting on them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">9. Intellectual Property</h2>
              <p>
                The CYBERVEST platform, including its original content, features, interfaces, and proprietary algorithms, are owned by [Company Legal Name Placeholder] and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">10. Third-Party Services</h2>
              <p>
                The platform utilizes third-party infrastructure providers (e.g., Supabase) for authentication, storage, and processing. Your use of the service acknowledges that data is transmitted to these trusted third parties necessary for application functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">11. Availability and Service Limitations</h2>
              <p>
                We strive to ensure CYBERVEST is highly available, but we do not guarantee uninterrupted, secure, or error-free operation. We reserve the right to modify, suspend, or discontinue the service with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">12. Security and Responsible Use</h2>
              <p>
                While we implement robust security controls (including RLS and encryption), no system is impenetrable. You agree to use the platform responsibly, securely manage your access credentials, and report any identified vulnerabilities directly to us rather than exploiting them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">13. Limitation of Liability</h2>
              <p>
                In no event shall [Company Legal Name Placeholder], nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, or goodwill, arising from your use of or inability to use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">14. Termination and Suspension</h2>
              <p>
                We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">15. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">16. Governing Law & Contact Information</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of [Governing Jurisdiction Placeholder], without regard to its conflict of law provisions.
              </p>
              <p className="mt-2">If you have any questions about these Terms, please contact us at:</p>
              <ul className="mt-3 space-y-1">
                <li><strong>Company:</strong> [Company Legal Name Placeholder]</li>
                <li><strong>Email:</strong> [Contact Email Placeholder]</li>
                <li><strong>Address:</strong> [Physical Address Placeholder]</li>
              </ul>
            </section>

          </div>
        </div>
      </main>

      <footer className="w-full py-6 text-center text-xs text-slate-500 mt-auto bg-white border-t border-slate-200">
        <p>© 2026 CYBERVEST Intelligence Inc. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}

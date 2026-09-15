"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/auth/supabase";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"signin" | "forgot">("signin");
  
  // Sign In State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const validateSignIn = () => {
    let isValid = true;
    setEmailError(false);
    setPasswordError(false);
    setSignInError(false);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(true);
      isValid = false;
    }
    if (!password) {
      setPasswordError(true);
      isValid = false;
    }
    return isValid;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignIn()) return;

    setSignInLoading(true);
    setSignInError(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setSignInError(true);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setSignInError(true);
    } finally {
      setSignInLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) return;

    setForgotLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Always show success to prevent enumeration
      setForgotSuccess(true);
    } catch (err) {
      setForgotSuccess(true);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col lg:flex-row w-full max-w-[1440px] mx-auto min-h-screen text-[#111827]">
      {/* LEFT SIDE: CYBERVEST Brand Intelligence Canvas */}
      <section className="hidden lg:flex lg:w-[48%] xl:w-[45%] bg-[#F5F8F6] border-b lg:border-b-0 lg:border-r border-surface-border p-8 sm:p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        
        {/* Abstract Background SVG */}
        <div className="absolute inset-0 pointer-events-none opacity-65 flex items-center justify-center">
          <svg className="w-full h-full text-brand-800" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="300" cy="300" r="230" stroke="#0F3F2E" strokeOpacity="0.05" strokeWidth="1.5" strokeDasharray="4 6"></circle>
            <circle cx="300" cy="300" r="160" stroke="#0F3F2E" strokeOpacity="0.07" strokeWidth="1.5"></circle>
            <circle cx="300" cy="300" r="90" stroke="#0F3F2E" strokeOpacity="0.08" strokeWidth="1.2"></circle>
            
            <path d="M120 380 L220 310 L300 350 L400 240 L490 270" stroke="#0F3F2E" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round"></path>
            <path d="M180 430 L220 310 L300 210 L410 180" stroke="#0F3F2E" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="3 3"></path>
            <path d="M300 210 L400 240 L380 370 L300 350" stroke="#0F3F2E" strokeOpacity="0.12" strokeWidth="1.2"></path>
            
            <circle cx="220" cy="310" r="5" fill="#0F3F2E" fillOpacity="0.3"></circle>
            <circle cx="220" cy="310" r="2" fill="#FFFFFF"></circle>
            
            <circle cx="300" cy="350" r="4.5" fill="#0F3F2E" fillOpacity="0.25"></circle>
            <circle cx="300" cy="350" r="2" fill="#FFFFFF"></circle>

            <circle cx="400" cy="240" r="6" fill="#0F3F2E" fillOpacity="0.35"></circle>
            <circle cx="400" cy="240" r="2.5" fill="#FFFFFF"></circle>

            <circle cx="490" cy="270" r="4" fill="#0F3F2E" fillOpacity="0.3"></circle>
            <circle cx="300" cy="210" r="5" fill="#0F3F2E" fillOpacity="0.28"></circle>
          </svg>
        </div>

        {/* Top Brand Mark Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-800 flex items-center justify-center text-white shadow-sm ring-4 ring-brand-100/60">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M9 12l2 2 4-4" strokeWidth="2.4"></path>
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#0F3F2E]">CYBERVEST</span>
              <span className="block text-[11px] font-medium tracking-wider text-gray-500 uppercase -mt-1">Financial Intelligence</span>
            </div>
          </div>
        </div>

        {/* Center Narrative & Core Value Proposition */}
        <div className="relative z-10 py-10 lg:py-0 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100/80 border border-brand-200/60 text-brand-800 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-800"></span>
            Enterprise Cyber Risk Quantification (CRQ)
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-[42px] font-bold tracking-tight text-[#0F3F2E] leading-[1.18]">
            Cyber Risk.<br/>
            <span className="text-[#14533D]">Quantified.</span> Optimized.
          </h1>

          <p className="mt-4 text-gray-600 text-base sm:text-lg leading-relaxed font-normal">
            Turn security telemetry into financial risk intelligence and investment decisions.
          </p>

          {/* Three Compact Benefits Cards */}
          <div className="mt-8 space-y-3">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/80 border border-surface-border shadow-sm hover:border-brand-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-800 shrink-0 mt-0.5">
                <span className="text-xs font-bold font-sans">₹</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 leading-snug">Quantify cyber risk in INR</h2>
                <p className="text-xs text-gray-500 mt-0.5">Translate threat vectors directly into Value at Risk (VaR) and probabilistic financial exposure.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/80 border border-surface-border shadow-sm hover:border-brand-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-800 shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 leading-snug">Simulate mitigation scenarios</h2>
                <p className="text-xs text-gray-500 mt-0.5">Test policy shifts and security control upgrades against multi-million rupee loss scenarios.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/80 border border-surface-border shadow-sm hover:border-brand-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-800 shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 leading-snug">Optimize security investment</h2>
                <p className="text-xs text-gray-500 mt-0.5">Maximize defense ROI through mathematically defensible capital allocation models.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Footer on Left Panel */}
        <div className="relative z-10 pt-6 border-t border-brand-200/50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            <span>SOC 2 Type II &amp; ISO 27001 Certified</span>
          </div>
          <span className="text-gray-500">v2.4.8 Enterprise</span>
        </div>
      </section>

      {/* RIGHT SIDE: Centered Rounded Auth Card Area */}
      <section className="lg:w-[52%] xl:w-[55%] flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14 w-full h-full min-h-screen lg:min-h-0 bg-[#FAFBF9]">
        <div className="w-full max-w-[460px] mx-auto my-auto relative flex-1 flex flex-col justify-center">

          {/* ================= VIEW 1: SIGN IN CARD ================= */}
          {view === "signin" && (
            <div className="bg-white rounded-2xl border border-surface-border shadow-subtle-card p-8 sm:p-10 relative">
              
              <div className="mb-7 text-left">
                {/* Mobile-only logo display */}
                <div className="flex lg:hidden items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-800 flex items-center justify-center text-white">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <span className="font-bold text-base text-brand-800">CYBERVEST</span>
                </div>
                
                <h2 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">Welcome back</h2>
                <p className="text-sm text-gray-500 mt-1.5 font-normal">Sign in to CYBERVEST</p>
              </div>

              {signInError && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <div className="leading-relaxed">
                    <span className="font-semibold">Authentication failed:</span> Invalid email or password. Please try again.
                  </div>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                    Email address
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      autoComplete="email" 
                      placeholder="name@enterprise.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={signInLoading}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm placeholder-gray-400 bg-white focus:outline-none focus:ring-2 transition-all shadow-sm ${emailError ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-red-50/20' : signInError ? 'border-red-300 focus:ring-brand-800 focus:border-brand-800 text-gray-900' : 'border-surface-border focus:ring-brand-800 focus:border-brand-800 text-gray-900'}`}
                    />
                    {emailError && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-red-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-600 mt-1.5 font-medium flex items-center gap-1">
                      <span>Enter a valid email address</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Password
                    </label>
                    <button type="button" onClick={() => setView("forgot")} className="text-xs font-medium text-brand-800 hover:text-brand-600 transition-colors focus:outline-none focus:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      id="password" 
                      name="password" 
                      autoComplete="current-password" 
                      placeholder="Enter your password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={signInLoading}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm placeholder-gray-400 bg-white focus:outline-none focus:ring-2 transition-all shadow-sm pr-10 ${passwordError ? 'border-red-500 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-red-50/20' : signInError ? 'border-red-300 focus:ring-brand-800 focus:border-brand-800 text-gray-900' : 'border-surface-border focus:ring-brand-800 focus:border-brand-800 text-gray-900'}`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      aria-label="Toggle password visibility" 
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-600 mt-1.5 font-medium flex items-center gap-1">
                      <span>Password is required</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center pt-1">
                  <input type="checkbox" id="remember-me" name="remember-me" defaultChecked className="w-4 h-4 rounded border-gray-300 text-brand-800 focus:ring-brand-800 cursor-pointer accent-[#0F3F2E]" />
                  <label htmlFor="remember-me" className="ml-2.5 block text-xs text-gray-600 cursor-pointer select-none">
                    Remember me for 30 days
                  </label>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={signInLoading}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-[#0F3F2E] hover:bg-forest-800 active:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F3F2E] transition-all shadow-sm cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    <span>{signInLoading ? "Signing in..." : "Sign in"}</span>
                    {signInLoading && <Loader2 className="animate-spin ml-2 h-4 w-4 text-white opacity-75" />}
                  </button>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-gray-500 font-medium tracking-wider uppercase">OR</span>
                  </div>
                </div>

                <button type="button" onClick={() => alert('Redirecting to Enterprise Okta/Azure AD SSO...')} className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-surface-border bg-white hover:bg-gray-50/80 active:bg-gray-100 text-gray-700 text-sm font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                  </svg>
                  <span>Continue with SSO</span>
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-surface-border flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <span>Secure enterprise authentication</span>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: FORGOT PASSWORD FLOW ================= */}
          {view === "forgot" && (
            <div className="bg-white rounded-2xl border border-surface-border shadow-subtle-card p-8 sm:p-10 relative">
              
              <button type="button" onClick={() => { setView("signin"); setForgotSuccess(false); setForgotEmail(""); }} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-800 mb-5 transition-colors focus:outline-none group">
                <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>Back to sign in</span>
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reset your password</h2>
                <p className="text-sm text-gray-500 mt-2 font-normal leading-relaxed">
                  Enter your work email and we&apos;ll send you instructions to reset your password.
                </p>
              </div>

              {!forgotSuccess ? (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                      Work email
                    </label>
                    <input 
                      type="email" 
                      id="reset-email" 
                      name="reset-email" 
                      required 
                      placeholder="name@enterprise.com" 
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={forgotLoading}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-brand-800 focus:border-brand-800 transition-all shadow-sm"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-[#0F3F2E] hover:bg-forest-800 active:bg-forest-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F3F2E] transition-all shadow-sm cursor-pointer mt-2 disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    <span>{forgotLoading ? "Sending link..." : "Send reset link"}</span>
                    {forgotLoading && <Loader2 className="animate-spin ml-2 h-4 w-4 text-white opacity-75" />}
                  </button>
                </form>
              ) : (
                <div>
                  <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 text-center mb-5">
                    <div className="w-10 h-10 rounded-full bg-brand-800 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="text-base font-semibold text-brand-900">Check your email</h3>
                    <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                      If an account exists for <strong className="text-gray-900">{forgotEmail}</strong>, password reset instructions have been sent.
                    </p>
                  </div>
                  
                  <button type="button" onClick={() => { setView("signin"); setForgotSuccess(false); setForgotEmail(""); }} className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-[#0F3F2E] bg-white border border-forest-800/20 hover:bg-mint transition-all text-center block">
                    Return to sign in
                  </button>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-surface-border flex items-center justify-center text-xs text-gray-500">
                <span>Enterprise Session Protection • 256-bit TLS</span>
              </div>
            </div>
          )}
        </div>

        {/* Global Footer */}
        <footer className="w-full py-3 text-center text-xs text-gray-500 mt-auto pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 lg:gap-4">
            <p>© 2025 CYBERVEST Intelligence Inc. All rights reserved.</p>
            <div className="flex items-center gap-2 sm:gap-4">
              <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
              <span className="hidden sm:inline">•</span>
              <a href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</a>
              <span className="hidden sm:inline">•</span>
              <a href="#" className="hover:text-gray-600 transition-colors">Security Whitepaper</a>
            </div>
          </div>
        </footer>

      </section>
    </main>
  );
}

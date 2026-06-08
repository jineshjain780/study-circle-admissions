import { useState, useEffect } from "react";
import LeadForm from "./components/LeadForm";
import AdminPanel from "./components/AdminPanel";
import heroImg from "./assets/images/study_circle_hero_1779977191260.png";
import { 
  Compass, 
  MapPin, 
  ShieldCheck, 
  Star, 
  GraduationCap, 
  Users, 
  Settings, 
  Activity,
  Sparkles,
  BookOpen
} from "lucide-react";

export default function App() {
  const [viewMode, setViewMode] = useState<"landing" | "admin">("landing");
  const [lastSubmittedInquiry, setLastSubmittedInquiry] = useState<any>(null);

  useEffect(() => {
    // Check if '?admin=true' or similar is defined to toggle dashboard silently
    if (window.location.search.includes("admin=true") || window.location.hash.includes("admin=true")) {
      setViewMode("admin");
    }
  }, []);

  const handleFormSuccess = (data: any) => {
    setLastSubmittedInquiry(data);
  };

  return (
    <div id="app-root" className="min-h-screen bg-white text-gray-800 font-sans antialiased selection:bg-purple-100 selection:text-purple-900">
      
      {/* Top Utility Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div 
            id="brand-logo" 
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setViewMode("landing")}
          >
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-purple-150 transform hover:rotate-3 duration-200">
              <GraduationCap className="w-5.5 h-5.5" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-display font-bold text-lg md:text-xl tracking-tight text-gray-900">
                Study Circle
              </span>
              <span className="text-[10px] block uppercase font-semibold font-mono tracking-wider text-purple-600">
                Coaching Institute
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-purple-50 text-purple-700 font-semibold py-1.5 px-3 rounded-full flex items-center gap-1.5 border border-purple-100/50">
              <MapPin className="w-3.5 h-3.5 text-purple-500" />
              <span>Surat, Gujarat</span>
            </span>
            
            {viewMode === "admin" && (
              <button
                id="header-back-to-landing-btn"
                onClick={() => setViewMode("landing")}
                className="text-xs font-semibold text-purple-600 hover:bg-purple-50 border border-purple-200 rounded-full py-1.5 px-3.5 transition cursor-pointer"
              >
                Landing Page
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Render */}
      <main>
        {viewMode === "admin" ? (
          <div className="py-6">
            <AdminPanel onBackToLanding={() => setViewMode("landing")} />
          </div>
        ) : (
          /* PRIMARY VISITOR LANDING VIEW */
          <div id="landing-hero-view" className="relative overflow-hidden bg-gradient-to-b from-purple-50/10 to-transparent">
            
            {/* Ambient Background Accents */}
            <div className="absolute top-1/4 left-0 w-72 h-72 bg-purple-50/40 rounded-full blur-3xl -z-10" />
            <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-50/30 rounded-full blur-3xl -z-10" />

            <div className="max-w-6xl mx-auto px-4 pt-0.5 pb-4 md:py-2 lg:py-4">
              
              {/* TWO COLUMN GRID HOISTED ABOVE-THE-FOLD */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
                
                {/* Left Column: Heading, Tag, and Surat Disclaimer (Cols 1 to 7) */}
                <div id="hero-content-block" className="lg:col-span-7 space-y-2.5 text-center lg:text-left">
                  
                  {/* Notice Alert Tag */}
                  <div className="inline-block mt-0.5">
                    <div className="inline-flex items-center gap-1.5 bg-purple-50/80 border border-purple-100 text-purple-700 py-1 px-2.5 rounded-lg text-xs font-semibold tracking-wide shadow-xs bg-white">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>Admissions Open for Batch 2026-2027</span>
                    </div>
                  </div>

                  <h1 className="text-2xl md:text-3xl lg:text-4.5xl font-display font-bold text-gray-900 tracking-tight leading-tight">
                    Study Circle Admissions
                  </h1>

                  {/* Surat Residency Alert - Right below statement */}
                  <div className="bg-amber-50/60 border border-amber-100/70 p-2.5 rounded-lg flex items-start gap-2 max-w-xl mx-auto lg:mx-0 w-full text-left">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm font-semibold text-amber-800 leading-relaxed">
                      Admissions available only for students residing or studying in Surat, Gujarat.
                    </span>
                  </div>
                  
                </div>

                {/* Right Column: Centered Compact Lead Form (Cols 8 to 12) */}
                <div id="hero-form-block" className="lg:col-span-5 w-full mt-2 lg:mt-0">
                  <LeadForm onSuccess={handleFormSuccess} />
                  
                  {/* Trust badges footer of form */}
                  <div className="mt-2.5 flex justify-center items-center gap-6 text-gray-400 font-mono text-[9px]">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-green-500" />
                      SECURE INQUIRY
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      PARENT APPROVED
                    </span>
                  </div>
                </div>

              </div>

              {/* BOTTOM SCROLL-TO DETAILS SECTION */}
              <div className="border-t border-gray-100/80 pt-16 mt-16 space-y-12">
                <div className="text-center space-y-3">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
                    Why Choose Study Circle?
                  </h2>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    A premium coaching ecosystem designed for unparalleled guidance, outstanding board performance, and long term carrier mentorship.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  
                  {/* Left Column: Strengths and Key Details */}
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start p-4 hover:bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition duration-300">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">Personalized Mentorship</h4>
                        <p className="text-xs md:text-sm text-gray-500 leading-normal mt-0.5">Tailored learning strategies and standard performance mappings for high board scores.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start p-4 hover:bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition duration-300">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">Elite Faculty Crew</h4>
                        <p className="text-xs md:text-sm text-gray-500 leading-normal mt-0.5">Surat's topmost veteran premium educators dedicated to conceptual depth.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start p-4 hover:bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition duration-300">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">Targeted Curriculum</h4>
                        <p className="text-xs md:text-sm text-gray-500 leading-normal mt-0.5">Comprehensive, structured study modules, assignment booklets, and regular assessments.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start p-4 hover:bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition duration-300">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base">Weekly Mock Exams</h4>
                        <p className="text-xs md:text-sm text-gray-500 leading-normal mt-0.5">Regular adaptive tests under examination conditions with instant scoring analysis.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Premium Illustration and Coaching Center Tags */}
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-xs max-w-sm bg-white p-6 flex justify-center items-center w-full">
                      <img 
                        id="hero-illustration"
                        src={heroImg} 
                        alt="Study Circle Academic Premium Illustration" 
                        className="w-full max-h-[200px] object-contain transform hover:scale-[1.01] duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs py-1 px-2 rounded-lg border border-gray-100 text-[10px] font-mono font-medium text-gray-400">
                        Surat's Top Instructors
                      </div>
                    </div>

                    {/* Official Coaching Centers chips */}
                    <div className="w-full max-w-sm bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
                       <span className="text-xs font-bold text-gray-400 font-mono tracking-wider uppercase mb-1 text-center">Our Coaching Centers</span>
                       <div className="flex flex-wrap justify-center gap-1.5">
                         <span className="text-[10px] font-medium bg-white text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100">Citylight (Sunrise Enclave)</span>
                         <span className="text-[10px] font-medium bg-white text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100">Adajan (Western Arena)</span>
                         <span className="text-[10px] font-medium bg-white text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100">Katargam (Mahek Icon)</span>
                         <span className="text-[10px] font-medium bg-white text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100">Vesu (Happy Hallmark)</span>
                         <span className="text-[10px] font-medium bg-white text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100">Vesu (J9 High Street)</span>
                       </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer disclaimer block */}
      <footer className="border-t border-gray-100 bg-gray-50/50 mt-16 py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Study Circle Classes. All rights reserved.
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Citylight (Sunrise Enclave) • Adajan (Western Arena) • Katargam (Mahek Icon) • Vesu (Happy Hallmark) • Vesu (J9 High Street) Centers in Surat, Gujarat.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-center text-xs">
            <span className="text-gray-400">Admissions available only for residents of Surat, Gujarat.</span>
            <span>•</span>
            <button
              id="footer-secret-admin"
              onClick={() => setViewMode(viewMode === "landing" ? "admin" : "landing")}
              className="text-gray-300 hover:text-gray-400 transition"
              title="Systems Control"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

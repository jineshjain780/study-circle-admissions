import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowRight, ArrowLeft, Loader2, Phone, User, Landmark, BookOpen, AlertCircle } from "lucide-react";

interface LeadFormProps {
  onSuccess: (data: any) => void;
}

export default function LeadForm({ onSuccess }: LeadFormProps) {
  // Form State
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [standard, setStandard] = useState<'9th' | '10th' | '11th' | '12th' | "">("");
  const [board, setBoard] = useState<'CBSE' | 'GSEB' | "">("");
  const [stream, setStream] = useState<'Science' | 'Commerce' | "">("");
  const [centers, setCenters] = useState<string[]>([]);
  
  // Interaction & UI state
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate mobile number rules
  const validateMobile = (num: string) => {
    const cleaned = num.replace(/\D/g, "");
    if (cleaned.length !== 10) return false;
    if (cleaned[0] === "0") return false;
    
    // Reject identical digits
    const allSame = cleaned.split("").every(char => char === cleaned[0]);
    if (allSame) return false;

    return true;
  };

  // Determine standard centers options
  const getCenterOptions = () => {
    if (standard === "9th" || standard === "10th") {
      if (board === "GSEB") {
        return [
          "Adajan (Western Arena)"
        ];
      }
      return [
        "Citylight (Sunrise Enclave)",
        "Vesu (Happy Hallmark)",
        "Adajan (Western Arena)",
        "Katargam (Mahek Icon)"
      ];
    }
    if (standard === "11th" || standard === "12th") {
      if (stream === "Science") {
        return [
          "Adajan (Western Arena)"
        ];
      }
      if (stream === "Commerce") {
        return [
          "Citylight (Sunrise Enclave)",
          "Vesu (Happy Hallmark)",
          "Adajan (Western Arena)",
          "Katargam (Mahek Icon)",
          "Vesu (J9 High Street)"
        ];
      }
    }
    return [];
  };

  // Symmetrically a 5-step form (Name, Mobile, Standard, Specialization, Centers)
  const totalSteps = 5;

  const getCurrentStepLabel = () => {
    if (step === 1) return "Student Name";
    if (step === 2) return "Mobile Number";
    if (step === 3) return "Select Standard";
    if (step === 4) {
      if (standard === "9th" || standard === "10th") return "Select Board";
      return "Select Stream";
    }
    return "Preferred Centers";
  };

  const handleNext = () => {
    setError("");
    
    // Validations per step
    if (step === 1) {
      if (!name.trim()) {
        setError("Please enter the student's name to proceed.");
        return;
      }
      setStep(2);
    } 
    else if (step === 2) {
      if (!validateMobile(mobile)) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
      setStep(3);
    } 
    else if (step === 3) {
      if (!standard) {
        setError("Please select a standard.");
        return;
      }
      setBoard("");
      setStream("");
      setCenters([]);
      setStep(4);
    } 
    else if (step === 4) {
      if (standard === "9th" || standard === "10th") {
        if (!board) {
          setError("Please select a board.");
          return;
        }
      } else {
        if (!stream) {
          setError("Please select a stream.");
          return;
        }
      }
      setCenters([]); // Reset centers on stream/board change
      setStep(5);
    }
  };

  const handlePrev = () => {
    setError("");
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Toggle center selections
  const handleToggleCenter = (center: string) => {
    if (centers.includes(center)) {
      setCenters(prev => prev.filter(c => c !== center));
    } else {
      setCenters(prev => [...prev, center]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (centers.length === 0) {
      setError("Please select at least one preferred center.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile,
          standard,
          board: (standard === "9th" || standard === "10th") ? board : null,
          stream: (standard === "11th" || standard === "12th") ? stream : null,
          centers
        })
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry. Please try again.");
      }

      const savedData = await response.json();
      setIsSuccess(true);
      onSuccess(savedData);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate actual percentage progress bar mapping 1-5 steps elegantly
  const actualStepIndex = step;
  const progressPercent = Math.round((actualStepIndex / totalSteps) * 100);

  if (isSuccess) {
    return (
      <motion.div 
        id="success-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-purple-50 text-center flex flex-col items-center justify-center min-h-[350px]"
      >
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-5 text-green-500 animate-bounce">
          <Check className="w-8 h-8" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">
          Inquiry Submitted!
        </h2>
        <p className="text-gray-650 text-sm leading-relaxed max-w-sm mb-6">
          Thank you for contacting Study Circle. Our expert counseling team will contact you shortly regarding admissions.
        </p>
        <button
          id="btn-sub-new"
          onClick={() => {
            setName("");
            setMobile("");
            setStandard("");
            setBoard("");
            setStream("");
            setCenters([]);
            setStep(1);
            setIsSuccess(false);
          }}
          className="px-5 py-2.5 bg-purple-50 text-purple-600 hover:bg-purple-100 font-medium rounded-full text-xs md:text-sm inline-flex items-center gap-2 transition"
        >
          Submit Another Inquiry
        </button>
      </motion.div>
    );
  }

  return (
    <div id="lead-form-container" className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 flex flex-col justify-start">
      
      {/* Progress Section */}
      <div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-2.5 font-mono">
          <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full">{getCurrentStepLabel()}</span>
          <span>Step {actualStepIndex} of {totalSteps}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-5">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-purple-600 h-full rounded-full"
          />
        </div>
 
        {/* Form Body - Render with Slide Animations on Step Change */}
        <div className="py-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex gap-2.5 items-center mb-1">
                  <User className="w-5 h-5 text-purple-600" />
                  <label className="text-lg font-bold text-gray-900 text-left">What is the Student's Name?</label>
                </div>
                <div className="relative">
                  <input
                    id="input-name"
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter student name"
                    className="w-full pl-5 pr-5 py-3.5 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 font-medium rounded-2xl border border-gray-100 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition outline-none text-base"
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  />
                </div>
              </motion.div>
            )}
 
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex gap-2.5 items-center mb-1">
                  <Phone className="w-5 h-5 text-purple-600" />
                  <label className="text-lg font-bold text-gray-900 text-left">Enter student or parent's Mobile Number</label>
                </div>
                <div className="relative">
                  <input
                    id="input-mobile"
                    type="tel"
                    maxLength={10}
                    required
                    autoFocus
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setMobile(val);
                      setError("");
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-5 pr-5 py-3.5 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 font-medium rounded-2xl border border-gray-100 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition outline-none text-base font-sans"
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  />
                </div>
                <span className="text-xs text-gray-405 block mt-1 text-left">We will send admission updates on this mobile number.</span>
              </motion.div>
            )}
 
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex gap-2.5 items-center mb-1">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <label className="text-lg font-bold text-gray-900 text-left">Choose Academic Standard</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['9th', '10th', '11th', '12th'] as const).map((std) => (
                    <button
                      id={`std-btn-${std}`}
                      key={std}
                      type="button"
                      onClick={() => {
                        setStandard(std);
                        setError("");
                      }}
                      className={`py-4 rounded-2xl border-2 text-center font-semibold text-base transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        standard === std
                          ? "bg-purple-50/50 border-purple-600 text-purple-700 shadow-[0_4px_12px_rgba(91,33,182,0.06)]"
                          : "bg-white border-slate-100 hover:border-purple-200 text-slate-600"
                      }`}
                    >
                      <span className="text-xl md:text-2xl font-bold">{std}</span>
                      <span className="text-[10px] uppercase font-mono tracking-wider font-medium opacity-70">Standard</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
 
            {step === 4 && (standard === "9th" || standard === "10th") && (
              <motion.div
                key="step-4-board"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex gap-2.5 items-center mb-1">
                  <Landmark className="w-5 h-5 text-purple-600" />
                  <label className="text-lg font-bold text-gray-900 text-left">Choose Board Selection</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['CBSE', 'GSEB'] as const).map((brd) => (
                    <button
                      id={`board-btn-${brd}`}
                      key={brd}
                      type="button"
                      onClick={() => {
                        setBoard(brd);
                        setError("");
                      }}
                      className={`py-5 rounded-2xl border-2 text-center font-semibold text-base transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        board === brd
                          ? "bg-purple-50/50 border-purple-600 text-purple-700 shadow-[0_4px_12px_rgba(91,33,182,0.06)]"
                          : "bg-white border-slate-100 hover:border-purple-200 text-slate-600"
                      }`}
                    >
                      <span className="text-base font-semibold md:text-lg">{brd}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (standard === "11th" || standard === "12th") && (
              <motion.div
                key="step-4-stream"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex gap-2.5 items-center mb-1">
                  <Landmark className="w-5 h-5 text-purple-600" />
                  <label className="text-lg font-bold text-gray-900 text-left">Choose Stream Selection</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['Science', 'Commerce'] as const).map((strm) => (
                    <button
                      id={`stream-btn-${strm}`}
                      key={strm}
                      type="button"
                      onClick={() => {
                        setStream(strm);
                        setError("");
                      }}
                      className={`py-5 rounded-2xl border-2 text-center font-semibold text-base transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        stream === strm
                          ? "bg-purple-50/50 border-purple-600 text-purple-700 shadow-[0_4px_12px_rgba(91,33,182,0.06)]"
                          : "bg-white border-slate-100 hover:border-purple-200 text-slate-600"
                      }`}
                    >
                      <span className="text-base font-semibold md:text-lg">{strm}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
 
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <label className="text-lg font-bold text-gray-900 block mb-1 text-left">
                  Select Preferred Centers <span className="text-xs text-gray-400 font-normal font-sans">(One or multiple)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {getCenterOptions().map((center) => {
                    const active = centers.includes(center);
                    return (
                      <button
                        id={`center-checkbox-${center.replace(/\s+/g, "-")}`}
                        key={center}
                        type="button"
                        onClick={() => {
                          handleToggleCenter(center);
                          setError("");
                        }}
                        className={`px-4 py-3.5 rounded-2xl border-2 text-left flex items-center justify-between font-medium text-sm md:text-base cursor-pointer transform duration-150 transition-all ${
                          active
                            ? "bg-purple-50/50 border-purple-600 text-purple-750 shadow-[0_4px_12px_rgba(91,33,182,0.06)]"
                            : "bg-white border-slate-100 hover:border-purple-200 text-slate-600"
                        }`}
                      >
                        <span className="truncate pr-1">{center}</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 shrink-0 ${
                          active ? "bg-purple-600 border-purple-600 text-white" : "border-gray-300"
                        }`}>
                          {active && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
 
      {/* Error & Controls Section */}
      <div className="mt-5 space-y-4">
        {error && (
          <motion.div 
            id="form-error-display"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-1.5 text-red-600 text-xs bg-red-50 p-2.5 rounded-xl border border-red-100 animate-pulse"
          >
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
 
        <div className="flex gap-3">
          {step > 1 && (
            <button
              id="btn-form-prev"
              type="button"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="px-4 py-3 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 hover:text-slate-800 rounded-2xl font-medium text-sm md:text-base border border-slate-200 transition flex items-center gap-1.5 justify-center min-w-[80px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
 
          {step < 5 ? (
            <button
              id="btn-form-next"
              type="button"
              onClick={handleNext}
              className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold rounded-2xl text-base transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_20px_-6px_rgba(91,33,182,0.35)] hover:shadow-[0_12px_24px_-4px_rgba(91,33,182,0.45)]"
            >
              <span>Continue</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          ) : (
            <button
              id="btn-form-submit"
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-80 active:scale-95 text-white font-semibold rounded-2xl text-base transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_20px_-6px_rgba(91,33,182,0.35)] hover:shadow-[0_12px_24px_-4px_rgba(91,33,182,0.45)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Inquiry</span>
                  <Check className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

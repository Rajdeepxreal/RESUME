/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { Download, FileText, X, ExternalLink, Mail, Phone, MapPin, ZoomIn, ZoomOut } from "lucide-react";
import { ThreeDPaper } from "./shaders/3d-paper/ThreeDPaper";
import { SylvaLivingWorldScene } from "./shaders/sylva-living-world/SylvaLivingWorldScene";

const PDF_PATH = "/assets/aistudio/Resumewithprojectsfinal_e311e569.pdf";
const PDF_FILENAME = "Rajdeep_Borkakati_Resume.pdf";

export function Scene() {
  return (
    <div className="shader-frame">
      <SylvaLivingWorldScene variant="living-green" />
      <ThreeDPaper
        variant="site-of-the-year"
        transparent
        style={{ position: "absolute", inset: 0, zIndex: 10 }}
      />
    </div>
  );
}

export default function App() {
  const [readerOpen, setReaderOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const sceneWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "threeui:zoomState") {
        setZoomPct(Math.round(Number(e.data.zoom || 1) * 100));
      } else if (e.data.type === "threeui:pointerMove" || e.data.type === "threeui:pointerLeave") {
        const sylvaIframe = sceneWrapRef.current?.querySelector(
          ".sylva-living-world-scene iframe",
        ) as HTMLIFrameElement | null;
        sylvaIframe?.contentWindow?.postMessage(e.data, "*");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function sendZoomCommand(type: "threeui:zoomIn" | "threeui:zoomOut" | "threeui:zoomReset") {
    const iframe = sceneWrapRef.current?.querySelector(
      ".three-d-paper iframe",
    ) as HTMLIFrameElement | null;
    iframe?.contentWindow?.postMessage({ type }, "*");
  }

  useEffect(() => {
    if (!readerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReaderOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [readerOpen]);

  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(PDF_PATH, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Verify PDF magic header (%PDF) so HTML redirects are never saved as corrupted .pdf files
      if (
        bytes.length < 5 ||
        bytes[0] !== 0x25 ||
        bytes[1] !== 0x50 ||
        bytes[2] !== 0x44 ||
        bytes[3] !== 0x46
      ) {
        throw new Error("Invalid PDF response");
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = PDF_FILENAME;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch {
      setDownloadError("Could not download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main ref={sceneWrapRef} className="relative w-screen h-screen overflow-hidden bg-[#4a4d44]">
      <Scene />

      {/* Discreet bottom-right utility controls — zero central occlusion */}
      <div className="fixed bottom-4 right-4 sm:right-5 z-20 flex flex-col items-end gap-1.5 pointer-events-auto max-w-[calc(100vw-2rem)]">
        {downloadError ? (
          <p className="text-xs font-mono text-red-300 bg-[#101811]/95 border border-red-400/35 px-2.5 py-1 rounded">
            {downloadError}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="inline-flex items-center bg-[#101811]/88 backdrop-blur-md border border-[#d6f0bc]/20 rounded overflow-hidden shadow-lg">
            <button
              type="button"
              onClick={() => sendZoomCommand("threeui:zoomOut")}
              aria-label="Zoom out"
              title="Zoom out"
              className="p-1.5 text-[#f4f7ef]/85 hover:text-[#C4FA50] hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C4FA50]"
            >
              <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => sendZoomCommand("threeui:zoomReset")}
              aria-label="Reset zoom"
              title="Reset zoom and orientation"
              className="px-2 py-1 text-[11px] font-mono tabular-nums text-[#f4f7ef]/85 hover:text-[#C4FA50] border-x border-[#d6f0bc]/15 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {zoomPct}%
            </button>
            <button
              type="button"
              onClick={() => sendZoomCommand("threeui:zoomIn")}
              aria-label="Zoom in"
              title="Zoom in"
              className="p-1.5 text-[#f4f7ef]/85 hover:text-[#C4FA50] hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C4FA50]"
            >
              <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setReaderOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide text-[#f4f7ef]/90 hover:text-[#C4FA50] bg-[#101811]/88 backdrop-blur-md border border-[#d6f0bc]/20 hover:border-[#C4FA50]/50 rounded shadow-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C4FA50]"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Readable Resume</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#0c140c] bg-[#C4FA50] hover:bg-[#d4fc79] disabled:opacity-60 rounded shadow-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{downloading ? "Preparing PDF…" : "Download PDF"}</span>
          </button>
        </div>
      </div>

      {/* Accessible Semantic Resume Modal */}
      {readerOpen ? (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#0b110c]/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-modal-title"
          onClick={() => setReaderOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-[#0d150f] border border-[#d6f0bc]/20 rounded-lg p-6 sm:p-8 text-[#f4f7ef] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#d6f0bc]/15">
              <div>
                <h2 id="resume-modal-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f7ef]">
                  Rajdeep Borkakati
                </h2>
                <p className="mt-1 text-sm text-[#8AE8A8] font-mono">
                  Mechanical Engineering · Tezpur University, Assam
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#f4f7ef]/80 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C4FA50]" aria-hidden="true" />
                    Morigaon, Assam
                  </span>
                  <a href="tel:+919395345418" className="inline-flex items-center gap-1 hover:text-[#C4FA50]">
                    <Phone className="w-3.5 h-3.5 text-[#C4FA50]" aria-hidden="true" />
                    +91 9395345418
                  </a>
                  <a href="mailto:rajdeeptmt@gmail.com" className="inline-flex items-center gap-1 hover:text-[#C4FA50]">
                    <Mail className="w-3.5 h-3.5 text-[#C4FA50]" aria-hidden="true" />
                    rajdeeptmt@gmail.com
                  </a>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-mono">
                  <a
                    href="https://github.com/Rajdeepxreal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#C4FA50] hover:underline"
                  >
                    github.com/Rajdeepxreal
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                  <a
                    href="https://linkedin.com/in/rajdeep-borkakati-430b09250"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#8AE8A8] hover:underline"
                  >
                    linkedin.com/in/rajdeep-borkakati-430b09250
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReaderOpen(false)}
                aria-label="Close readable resume"
                className="p-2 text-[#f4f7ef]/70 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-6 text-sm leading-relaxed">
              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8AE8A8] mb-2">Career Objective</h3>
                <p className="text-[#f4f7ef]/85">
                  Mechanical Engineering graduate (B.Tech, Tezpur University, 2026) skilled in preventive maintenance,
                  root cause analysis and data-driven production monitoring. Works in Python and C++, builds web
                  interfaces in HTML, CSS and JavaScript, and uses AI-assisted development to prototype tools quickly.
                  Seeking an entry-level manufacturing role where I can improve equipment reliability and productivity.
                </p>
              </section>

              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8AE8A8] mb-2">Education</h3>
                <div className="flex flex-wrap justify-between gap-2 font-semibold text-[#f4f7ef]">
                  <span>B.Tech in Mechanical Engineering, Tezpur University, Assam</span>
                  <span className="font-mono text-xs text-[#C4FA50]">Aug 2022 – June 2026 · CGPA: 6.55</span>
                </div>
                <p className="mt-1 text-xs text-[#f4f7ef]/70">
                  Relevant modules: Manufacturing Technology, Maintenance Engineering, Industrial Management, Thermodynamics
                </p>
              </section>

              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#C4FA50] mb-3">Technical Projects</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="font-semibold text-[#f4f7ef]">Factory Analytics</h4>
                      <span className="text-xs font-mono text-[#8AE8A8]">Python, Streamlit, pandas</span>
                    </div>
                    <ul className="mt-1.5 list-disc list-inside space-y-1 text-[#f4f7ef]/80">
                      <li>
                        Built three manufacturing tools: maintenance log analysis (downtime, MTBF, repeat failures), an OEE
                        dashboard (Availability × Performance × Quality) and a machining cost calculator (spindle speed,
                        feed, cycle time, cost per part).
                      </li>
                      <li>
                        Automatic column matching for uploaded CSV files; rows with bad data are reported with the reason
                        instead of being dropped silently.
                      </li>
                      <li>Optional AI-written reports through Anthropic, OpenAI-compatible or Google Gemini APIs.</li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="font-semibold text-[#f4f7ef]">Exoskeleton Neuro-Rehabilitation Game Therapy System</h4>
                      <span className="text-xs font-mono text-[#8AE8A8]">ESP32, MPU-6050, servo actuator</span>
                    </div>
                    <ul className="mt-1.5 list-disc list-inside space-y-1 text-[#f4f7ef]/80">
                      <li>Wrote ESP32 firmware that streams sensor data at 30 Hz over WebSocket and receives servo commands.</li>
                      <li>Built a browser dashboard with a 3D view and live charts to monitor the actuator during therapy games.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#C4FA50] mb-2">Internship Experience</h3>
                <div className="flex flex-wrap justify-between gap-2 font-semibold text-[#f4f7ef]">
                  <h4>Vocational Trainee, Diesel Locomotive Shed</h4>
                  <span className="font-mono text-xs text-[#8AE8A8]">June 2025 - July 2025</span>
                </div>
                <ul className="mt-1.5 list-disc list-inside space-y-1 text-[#f4f7ef]/80">
                  <li>Studied HHP locomotive power assemblies and diesel engine maintenance cycles.</li>
                  <li>
                    Gained exposure to industrial safety protocols, preventive maintenance schedules and root cause analysis
                    (RCA) of mechanical failures.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8AE8A8] mb-2">Technical Skills</h3>
                <ul className="space-y-1.5 text-[#f4f7ef]/80">
                  <li>
                    <strong className="text-[#f4f7ef]">Industrial operations:</strong> Preventive and predictive maintenance,
                    root cause analysis (RCA), overall equipment effectiveness (OEE)
                  </li>
                  <li>
                    <strong className="text-[#f4f7ef]">Mechatronics and IoT:</strong> Sensor fusion (IMU, ultrasonic, pressure),
                    microcontrollers (Arduino, ESP32), I2C and SPI protocols, signal processing
                  </li>
                  <li>
                    <strong className="text-[#f4f7ef]">Design and analysis:</strong> AutoCAD, SolidWorks, finite element
                    analysis (FEA) basics, MATLAB
                  </li>
                  <li>
                    <strong className="text-[#f4f7ef]">Programming and tools:</strong> Python, pandas, HTML, Streamlit, C++,
                    React, Node.js, Excel
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#C4FA50] mb-2">Certifications (NPTEL)</h3>
                <ul className="space-y-1 text-[#f4f7ef]/80">
                  <li>Automation in Manufacturing · IIT Guwahati (Jul–Oct 2025, Elite, 84%)</li>
                  <li>Work System Design · IIT Roorkee (Jul–Oct 2025, Elite, 78%)</li>
                  <li>Introduction to Internet of Things · IIT Kharagpur (Jul–Oct 2025, Elite, 78%)</li>
                  <li>Introduction to Industry 4.0 and Industrial Internet of Things · IIT Kharagpur (Jan–Apr 2026, Elite, 83%)</li>
                  <li>Understanding Incubation and Entrepreneurship · IIT Bombay (Jan–Apr 2026, Elite, 95%)</li>
                </ul>
              </section>

              <section className="pt-4 border-t border-[#d6f0bc]/15 flex flex-wrap justify-between gap-2 text-xs text-[#f4f7ef]/70 font-mono">
                <span>Core: Analytical thinking (RCA) · Operational grit (shift ops & cross-functional coordination)</span>
                <span>Languages: English, Assamese, Hindi · Morigaon, Assam</span>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

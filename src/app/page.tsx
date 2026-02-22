"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, Trash2, CheckCircle, AlertTriangle, Info, ArrowRight, ShieldCheck, Database, RefreshCw, Languages } from "lucide-react";
import { useLangStore } from "@/store/langStore";
import { translations } from "@/lib/i18n/translations";

type ScanResult = {
  id: string | null;
  isNew: boolean;
  name: string;
  version: string;
  license: string;
  company: string;
  usage_restrictions: string;
  risk_analysis: string;
  alternative_solutions: string;
  hasDifferences: boolean;
  differences: Record<string, { old: string | null; new: string | null }> | null;
  existingData?: any;
};

type SavedTool = {
  id: string;
  name: string;
  version: string;
  license: string;
  company: string;
  usage_restrictions: string;
  risk_analysis: string;
  alternative_solutions: string;
  updated_at: number;
};

export default function Home() {
  const { lang, toggleLang } = useLangStore();
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<"scan" | "repo">("scan");
  
  // Scan State
  const [scanInput, setScanInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanError, setScanError] = useState("");

  // Repo State
  const [savedTools, setSavedTools] = useState<SavedTool[]>([]);
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    setIsScanning(true);
    setScanError("");
    setScanResults([]);

    const toolNames = scanInput.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolNames }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan tools");
      setScanResults(data.results || []);
    } catch (err: any) {
      setScanError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const fetchRepo = async () => {
    setIsLoadingRepo(true);
    try {
      const res = await fetch("/api/tools");
      const data = await res.json();
      if (res.ok) {
        setSavedTools(data.tools || []);
      }
    } catch (err) {
      console.error("Error fetching tools:", err);
    } finally {
      setIsLoadingRepo(false);
    }
  };

  useEffect(() => {
    if (activeTab === "repo") {
      fetchRepo();
    }
  }, [activeTab]);

  const handleSaveNew = async (result: ScanResult) => {
    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.name,
          version: result.version,
          license: result.license,
          company: result.company,
          usage_restrictions: result.usage_restrictions,
          risk_analysis: result.risk_analysis,
          alternative_solutions: result.alternative_solutions,
        }),
      });
      if (res.ok) {
        setScanResults((prev) => prev.filter((r) => r.name !== result.name));
      }
    } catch (err) {
      console.error("Failed to save new tool:", err);
    }
  };

  const handleUpdateDiff = async (result: ScanResult) => {
    if (!result.id) return;
    try {
      const res = await fetch(`/api/tools/${result.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: result.version,
          license: result.license,
          company: result.company,
          usage_restrictions: result.usage_restrictions,
          risk_analysis: result.risk_analysis,
          alternative_solutions: result.alternative_solutions,
        }),
      });
      if (res.ok) {
        setScanResults((prev) => prev.filter((r) => r.name !== result.name));
      }
    } catch (err) {
      console.error("Failed to update tool:", err);
    }
  };

  const handleIgnore = (name: string) => {
    setScanResults((prev) => prev.filter((r) => r.name !== name));
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      const res = await fetch(`/api/tools/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedTools((prev) => prev.filter((tool) => tool.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete tool:", err);
    }
  };

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2 text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
              <span className="font-bold text-xl tracking-tight text-slate-900">
                {lang === 'zh' ? '合规' : 'Compliance'}<span className="text-indigo-600">OS</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("scan")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "scan" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4" />
                    <span>{t.scannerTab}</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("repo")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "repo" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4" />
                    <span>{t.repoTab}</span>
                  </div>
                </button>
              </div>

              {/* Language Switcher */}
              <button 
                onClick={toggleLang}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center space-x-1"
                title="Toggle Language"
              >
                <Languages className="w-5 h-5" />
                <span className="text-xs font-bold uppercase">{lang}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Workspace: Scanner */}
        {activeTab === "scan" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{t.newScanTitle}</h2>
              <p className="text-sm text-slate-500 mb-4">{t.newScanDesc}</p>
              
              <div className="flex flex-col space-y-4">
                <textarea
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none text-sm placeholder:text-slate-400"
                  disabled={isScanning}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleScan}
                    disabled={isScanning || !scanInput.trim()}
                    className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t.analyzingBtn}
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        {t.analyzeBtn}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {scanError && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start space-x-3 text-sm border border-red-100">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}
            </div>

            {/* Scan Results */}
            {scanResults.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-xs mr-3">{scanResults.length}</span>
                  {t.analysisReports}
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  {scanResults.map((result, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-bold text-slate-900">{result.name}</h4>
                          {result.isNew ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {t.newDiscovery}
                            </span>
                          ) : result.hasDifferences ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              {t.updatesFound}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {t.upToDate}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-500">v{result.version}</span>
                      </div>

                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.company}</p>
                            <p className="text-sm text-slate-800">{result.company || t.unknown}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.licenseType}</p>
                            <p className="text-sm text-slate-800 font-medium">{result.license || t.unknown}</p>
                          </div>
                          
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.usageRestrictions}</p>
                            <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {result.usage_restrictions || t.noneSpecified}
                            </div>
                          </div>
                          
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">{t.riskAnalysis}</p>
                            <div className="bg-red-50/50 p-3 rounded border border-red-100 text-sm text-slate-700 leading-relaxed flex items-start space-x-2">
                              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <span className="whitespace-pre-wrap">{result.risk_analysis || t.lowRisk}</span>
                            </div>
                          </div>
                          
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">{t.alternativeSolutions}</p>
                            <div className="bg-emerald-50/50 p-3 rounded border border-emerald-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {result.alternative_solutions || t.noneFound}
                            </div>
                          </div>
                        </div>

                        {/* Diff Viewer */}
                        {result.hasDifferences && result.differences && (
                          <div className="mb-6 bg-amber-50 rounded-lg p-4 border border-amber-100">
                            <h5 className="text-sm font-semibold text-amber-800 mb-3 flex items-center">
                              <RefreshCw className="w-4 h-4 mr-2" />
                              {t.diffDetected}
                            </h5>
                            <div className="space-y-3">
                              {Object.entries(result.differences).map(([key, vals]) => (
                                <div key={key} className="text-sm">
                                  <span className="font-medium text-slate-700 capitalize block mb-1">{key.replace('_', ' ')}:</span>
                                  <div className="flex flex-col md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-3">
                                    <div className="flex-1 bg-red-100/50 p-2 rounded border border-red-200">
                                      <span className="text-xs font-semibold text-red-800 mb-1 block">{t.currentDb}</span>
                                      <span className="text-slate-700 break-words line-through">{vals.old || t.unknown}</span>
                                    </div>
                                    <div className="hidden md:flex items-center justify-center pt-6">
                                      <ArrowRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex-1 bg-emerald-100/50 p-2 rounded border border-emerald-200">
                                      <span className="text-xs font-semibold text-emerald-800 mb-1 block">{t.newScan}</span>
                                      <span className="text-slate-700 break-words">{vals.new || t.unknown}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => handleIgnore(result.name)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            {t.ignore}
                          </button>
                          
                          {result.isNew ? (
                            <button
                              onClick={() => handleSaveNew(result)}
                              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {t.saveToRepo}
                            </button>
                          ) : result.hasDifferences ? (
                            <button
                              onClick={() => handleUpdateDiff(result)}
                              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-sm shadow-amber-200"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              {t.updateRepo}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center px-4 py-2 bg-slate-100 text-emerald-700 text-sm font-medium rounded-lg cursor-default border border-slate-200"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {t.matchesDb}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workspace: Repository */}
        {activeTab === "repo" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t.repoTitle}</h2>
                <p className="text-sm text-slate-500 mt-1">{t.repoDesc}</p>
              </div>
            </div>

            {isLoadingRepo ? (
              <div className="flex justify-center items-center h-64 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : savedTools.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">{t.repoEmptyTitle}</h3>
                <p className="text-sm text-slate-500">{t.repoEmptyDesc}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTools.map((tool) => (
                  <div key={tool.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col group hover:shadow-md hover:border-indigo-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        <h4 className="font-bold text-slate-900 text-lg truncate" title={tool.name}>{tool.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 truncate" title={`${tool.version} • ${tool.company}`}>
                          v{tool.version} • {tool.company || t.unknown}
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 max-w-[120px] truncate" title={tool.license}>
                        {tool.license}
                      </span>
                    </div>

                    <div className="flex-1 space-y-4 mb-6">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                          <Info className="w-3 h-3 mr-1" /> {t.restrictions}
                        </p>
                        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed" title={tool.usage_restrictions}>{tool.usage_restrictions || t.none}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1 text-red-400" /> {t.risks}
                        </p>
                        <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed" title={tool.risk_analysis}>{tool.risk_analysis || t.none}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                      <p className="text-[11px] text-slate-400 font-mono">
                        {t.updated} {new Date(tool.updated_at).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => handleDeleteTool(tool.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50 flex items-center space-x-1"
                        title={t.remove}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs font-medium hidden group-hover:block">{t.remove}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

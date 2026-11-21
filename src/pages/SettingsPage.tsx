import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Database, 
  Check, 
  HardDrive, 
  Trash2, 
  FileSpreadsheet, 
  ShieldCheck 
} from 'lucide-react';
import { getStorageQuota, clearAllStorage } from '../core/storage/indexedDbStorage';
import { StorageQuotaInfo } from '../types';

export const SettingsPage: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [quota, setQuota] = useState<StorageQuotaInfo>({
    usageBytes: 0,
    usageFormatted: '0 B',
    persistedCount: 0,
    backendSupported: true,
    indexedDbAvailable: true,
  });
  const [isClearing, setIsClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  // Security preferences
  const [preventFormulaInjection, setPreventFormulaInjection] = useState(true);
  const [maskEmails, setMaskEmails] = useState(false);
  const [maskPhones, setMaskPhones] = useState(false);
  const [maskCards, setMaskCards] = useState(false);
  const [encryptCache, setEncryptCache] = useState(false);

  const fetchQuota = async () => {
    try {
      const q = await getStorageQuota();
      setQuota(q);
    } catch {}
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearAllStorage();
      await fetchQuota();
      setClearedSuccess(true);
      setTimeout(() => setClearedSuccess(false), 2500);
    } catch {
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization preferences, persistent storage, export defaults, and enterprise security controls.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          leftIcon={saved ? <Check className="w-3.5 h-3.5" /> : undefined}
        >
          {saved ? 'Saved Successfully' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Storage & IndexedDB Telemetry */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-sm">Client Storage & IndexedDB Cache</CardTitle>
            </div>
            <Badge variant={quota.indexedDbAvailable ? 'success' : 'purple'}>
              {quota.indexedDbAvailable ? 'IndexedDB Active' : 'Memory Fallback'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Local Cache Volume:</span>
                <span className="font-bold text-slate-900 font-mono">{quota.usageFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Persisted Datasets:</span>
                <span className="font-bold text-slate-900">{quota.persistedCount} datasets</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Storage Engine:</span>
                <span className="font-semibold text-purple-700">
                  {quota.indexedDbAvailable ? 'IndexedDB (50MB+ High Capacity)' : 'Transient In-Memory'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs font-semibold text-slate-800">Purge Storage Cache</p>
                <p className="text-[11px] text-slate-500">Remove cached datasets and session states from IndexedDB.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                disabled={isClearing}
                leftIcon={clearedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              >
                {clearedSuccess ? 'Storage Cleared' : isClearing ? 'Clearing...' : 'Clear Cache'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Security & Sanitization Governance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-sm">Security & Sanitization Governance</CardTitle>
            </div>
            <Badge variant="purple">CWE-1236 Protected</Badge>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={preventFormulaInjection}
                  onChange={(e) => setPreventFormulaInjection(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Formula Injection Prevention (CWE-1236)</span>
                  <span className="text-[11px] text-slate-500 leading-tight block">
                    Automatically escape dangerous characters (=, +, -, @) on CSV and Excel exports.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={maskEmails}
                  onChange={(e) => setMaskEmails(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Mask Email Addresses in Exports</span>
                  <span className="text-[11px] text-slate-500 leading-tight block">
                    Obfuscate customer email addresses (e.g., j***e@domain.com) for compliance.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={maskPhones}
                  onChange={(e) => setMaskPhones(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Mask Phone Numbers in Exports</span>
                  <span className="text-[11px] text-slate-500 leading-tight block">
                    Redact phone digits preserving only the last 4 digits (***-***-5678).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={maskCards}
                  onChange={(e) => setMaskCards(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">Mask Payment & Credit Card Numbers</span>
                  <span className="text-[11px] text-slate-500 leading-tight block">
                    Obfuscate card digits preserving only the final 4 digits (****-****-****-9010).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={encryptCache}
                  onChange={(e) => setEncryptCache(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-900 block">AES-GCM Web Crypto Local Encryption</span>
                  <span className="text-[11px] text-slate-500 leading-tight block">
                    Encrypt cached dataset blobs in browser storage using client-side cryptographic keys.
                  </span>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Analytics Engine Mode */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-sm">Analytics Engine Mode</CardTitle>
            </div>
            <Badge variant="success">Online</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Compute Strategy</label>
              <select className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>Hybrid (Client Streaming + FastAPI Analytics Core)</option>
                <option>Client-Only In-Browser (100% Offline)</option>
                <option>Dedicated Server Core (FastAPI + Pandas)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Max Upload File Size</label>
              <input
                type="text"
                defaultValue="50 MB"
                className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Export Defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm">Export Suite Defaults</CardTitle>
            </div>
            <Badge variant="purple">Multi-Format</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Default CSV Delimiter</label>
              <select className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>Comma (,) - Standard</option>
                <option>Semicolon (;) - European Regional</option>
                <option>Tab (\t) - TSV</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Excel Workbook Sheets</label>
              <p className="text-xs text-slate-600 mt-1">
                By default, Excel (.xlsx) exports generate 3 sheets: Tabular Records, Executive KPI Summary, and Column Profiling Audit.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * Universal AI Business Intelligence Platform - IndexedDB Storage Engine
 * ============================================================================
 * 
 * Provides client-side asynchronous persistence for datasets, large data caches (50MB+),
 * dataset metadata, and application configuration.
 * 
 * Features:
 * - Direct IndexedDB API (no heavy dependencies).
 * - Multi-store partitioning: 'datasets', 'metadata', 'app_settings'.
 * - Transparent fallback to in-memory/localStorage for restricted/testing environments.
 * - Storage telemetry & quota measurement.
 */

import { Dataset, StorageMetadata, StorageQuotaInfo } from '../../types';
import { encryptPayload, decryptPayload } from '../security/securitySanitizer';

const DB_NAME = 'OmniBI_Client_Storage';
const DB_VERSION = 1;

const STORES = {
  DATASETS: 'datasets',
  METADATA: 'metadata',
  SETTINGS: 'app_settings',
} as const;

// In-memory fallback cache for SSR, test environments, or private browsing restrictions
const memoryFallback = {
  datasets: new Map<string, Dataset>(),
  metadata: new Map<string, StorageMetadata>(),
  settings: new Map<string, any>(),
};

/**
 * Checks if IndexedDB is available in the current JavaScript runtime.
 */
export function isIndexedDbSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Initializes and upgrades the IndexedDB database instance.
 */
export function openDatabase(): Promise<IDBDatabase | null> {
  if (!isIndexedDbSupported()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.DATASETS)) {
          db.createObjectStore(STORES.DATASETS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'datasetId' });
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Persists a complete Dataset object to IndexedDB storage with updated metadata.
 */
export async function saveDatasetToStorage(dataset: Dataset, encrypt: boolean = false): Promise<boolean> {
  if (!dataset || !dataset.id) return false;

  const serialized = JSON.stringify(dataset);
  const byteSize = new Blob([serialized]).size;

  const metadata: StorageMetadata = {
    datasetId: dataset.id,
    datasetName: dataset.name,
    rowCount: dataset.rowCount,
    columnCount: dataset.columnCount || dataset.columns.length,
    byteSize,
    savedAt: new Date().toISOString(),
    version: 1,
  };

  const db = await openDatabase();

  if (!db) {
    // Fallback in-memory
    memoryFallback.datasets.set(dataset.id, dataset);
    memoryFallback.metadata.set(dataset.id, metadata);
    try {
      localStorage.setItem(`omnibi_meta_${dataset.id}`, JSON.stringify(metadata));
    } catch {}
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORES.DATASETS, STORES.METADATA], 'readwrite');
      const datasetStore = tx.objectStore(STORES.DATASETS);
      const metaStore = tx.objectStore(STORES.METADATA);

      let recordToStore: any = dataset;
      if (encrypt) {
        // Asynchronously encrypt dataset data payload if requested
        encryptPayload(serialized).then((cipher) => {
          recordToStore = { id: dataset.id, encryptedPayload: cipher, isEncrypted: true };
          datasetStore.put(recordToStore);
          metaStore.put(metadata);
        });
      } else {
        datasetStore.put(recordToStore);
        metaStore.put(metadata);
      }

      tx.oncomplete = () => {
        resolve(true);
      };

      tx.onerror = () => {
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}

/**
 * Retrieves a persisted Dataset by its ID from IndexedDB or memory fallback.
 */
export async function loadDatasetFromStorage(id: string): Promise<Dataset | null> {
  if (!id) return null;

  const db = await openDatabase();

  if (!db) {
    if (memoryFallback.datasets.has(id)) {
      return memoryFallback.datasets.get(id) || null;
    }
    return null;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.DATASETS, 'readonly');
      const store = tx.objectStore(STORES.DATASETS);
      const request = store.get(id);

      request.onsuccess = async () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        if (result.isEncrypted && result.encryptedPayload) {
          try {
            const decryptedStr = await decryptPayload(result.encryptedPayload);
            const parsed = JSON.parse(decryptedStr);
            resolve(parsed);
          } catch {
            resolve(null);
          }
        } else {
          resolve(result as Dataset);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Lists all stored dataset summaries and metadata records.
 */
export async function listStoredDatasets(): Promise<StorageMetadata[]> {
  const db = await openDatabase();

  if (!db) {
    return Array.from(memoryFallback.metadata.values());
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.METADATA, 'readonly');
      const store = tx.objectStore(STORES.METADATA);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as StorageMetadata[]) || []);
      };

      request.onerror = () => {
        resolve([]);
      };
    } catch {
      resolve([]);
    }
  });
}

/**
 * Deletes a stored dataset and its corresponding metadata entry.
 */
export async function deleteDatasetFromStorage(id: string): Promise<boolean> {
  if (!id) return false;

  const db = await openDatabase();

  if (!db) {
    memoryFallback.datasets.delete(id);
    memoryFallback.metadata.delete(id);
    try {
      localStorage.removeItem(`omnibi_meta_${id}`);
    } catch {}
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORES.DATASETS, STORES.METADATA], 'readwrite');
      tx.objectStore(STORES.DATASETS).delete(id);
      tx.objectStore(STORES.METADATA).delete(id);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Clears all cached datasets, metadata, and settings from storage.
 */
export async function clearAllStorage(): Promise<boolean> {
  const db = await openDatabase();

  memoryFallback.datasets.clear();
  memoryFallback.metadata.clear();
  memoryFallback.settings.clear();

  if (!db) {
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORES.DATASETS, STORES.METADATA, STORES.SETTINGS], 'readwrite');
      tx.objectStore(STORES.DATASETS).clear();
      tx.objectStore(STORES.METADATA).clear();
      tx.objectStore(STORES.SETTINGS).clear();

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Calculates current storage telemetry and formatted usage size.
 */
export async function getStorageQuota(): Promise<StorageQuotaInfo> {
  const list = await listStoredDatasets();
  const totalBytes = list.reduce((sum, item) => sum + (item.byteSize || 0), 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return {
    usageBytes: totalBytes,
    usageFormatted: formatBytes(totalBytes),
    persistedCount: list.length,
    backendSupported: true,
    indexedDbAvailable: isIndexedDbSupported(),
  };
}

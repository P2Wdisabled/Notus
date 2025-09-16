"use client";

import { useState } from "react";

export default function TestOpenDocPage() {
  const [documentId, setDocumentId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testOpenDoc = async () => {
    if (!documentId) {
      alert("Veuillez entrer un ID de document");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/openDoc?id=${documentId}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: "Erreur de connexion" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Test API openDoc
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID du document à tester
              </label>
              <input
                type="number"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Entrez l'ID du document"
              />
            </div>

            <button
              onClick={testOpenDoc}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? "Test en cours..." : "Tester openDoc"}
            </button>

            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Résultat :
                </h3>
                <div
                  className={`p-4 rounded-lg ${
                    result.success
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}
                >
                  <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "./ui";

export default function GoogleTestButton() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testGoogleAuth = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Test de la configuration NextAuth
      const response = await fetch("/api/auth/providers");
      const providers = await response.json();
      
      if (providers.google) {
        setResult("✅ SUCCESS: Configuration Google OAuth détectée");
        
        // Tenter la connexion
        const signInResult = await signIn("google", { 
          callbackUrl: "/",
          redirect: false 
        });
        
        if (signInResult?.error) {
          setResult(`❌ ERROR: ${signInResult.error}`);
        } else if (signInResult?.url) {
          setResult("✅ SUCCESS: Redirection Google générée - ouverture dans un nouvel onglet");
          window.open(signInResult.url, "_blank");
        }
      } else {
        setResult("❌ ERROR: Provider Google non configuré");
      }
    } catch (error) {
      console.error("Test error:", error);
      setResult(`❌ ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">🔧 Test Google OAuth</h3>

      <Button
        onClick={testGoogleAuth}
        disabled={loading}
        loading={loading}
        variant="outline"
        className="w-full"
      >
        {loading ? "Test en cours..." : "Tester Google OAuth"}
      </Button>

      {result && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <p className="font-medium">{result}</p>
        </div>
      )}
    </div>
  );
}

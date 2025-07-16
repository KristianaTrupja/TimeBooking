import { Button } from "@/components/ui/button";
import { useState } from "react";

type Result = {
  status: string;
  message: string;
} | null;

export default function TestDbConnection() {
  const [result, setResult] = useState<Result>(null);

  const testConnection = async () => {
    try {
      const res = await fetch('/api/testdb');
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ status: 'error', message: err.message });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center my-4">
      <Button onClick={testConnection} className="px-8 py-5">
        Test MySQL Connection
      </Button>
      {result && (
        <div className="mt-3">
          <strong>Status:</strong> {result.status} <br />
          <strong>Message:</strong> {result.message}
        </div>
      )}
    </div>
  );
}

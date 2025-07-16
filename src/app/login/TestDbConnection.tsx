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
    <div>
      <button onClick={testConnection} style={{ padding: '8px 16px' }}>
        Test MySQL Connection
      </button>
      {result && (
        <div style={{ marginTop: 10 }}>
          <strong>Status:</strong> {result.status} <br />
          <strong>Message:</strong> {result.message}
        </div>
      )}
    </div>
  );
}

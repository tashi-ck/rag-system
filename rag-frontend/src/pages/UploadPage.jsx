import { useState, useCallback } from "react";
import { uploadDocument } from "../services/api";

export default function UploadPage() {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus]     = useState(null);   // null | "uploading" | "success" | "error"
  const [result, setResult]     = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setResult(null);
    try {
      const { data } = await uploadDocument(file);
      setResult(data);
      setStatus("success");
      setFile(null);
    } catch (err) {
      setStatus("error");
      setResult({ error: err.response?.data?.detail || "Upload failed." });
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Upload document</h1>
      <p className="text-sm text-gray-500 mb-6">PDF or Word (.docx) — max 20 MB</p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input").click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                    transition-colors ${dragging
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-300 hover:bg-gray-50"}`}
      >
        <input id="file-input" type="file" accept=".pdf,.docx,.doc" className="hidden"
          onChange={(e) => setFile(e.target.files[0])} />
        <div className="text-3xl mb-2">📄</div>
        {file ? (
          <p className="text-sm font-medium text-gray-800">{file.name}</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 font-medium">Drop file here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX supported</p>
          </>
        )}
      </div>

      {file && (
        <button onClick={handleUpload} disabled={status === "uploading"}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium
                     rounded-lg py-2 text-sm transition-colors disabled:opacity-60">
          {status === "uploading" ? "Uploading and processing…" : "Upload and process"}
        </button>
      )}

      {/* Result */}
      {status === "success" && result && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-green-800">✅ Document processed</p>
          <p className="text-green-700 mt-1">
            {result.chunk_count} chunks created and embedded.
          </p>
        </div>
      )}
      {status === "error" && result && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-red-800">❌ Upload failed</p>
          <p className="text-red-700 mt-1">{result.error}</p>
        </div>
      )}
    </div>
  );
}
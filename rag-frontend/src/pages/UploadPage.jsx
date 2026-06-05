import { useState, useCallback, useEffect } from "react";
import { uploadDocument, getMyDocuments, deleteDocument } from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";

export default function UploadPage() {
  const [file, setFile]               = useState(null);
  const [dragging, setDragging]       = useState(false);
  const [status, setStatus]           = useState(null);
  const [result, setResult]           = useState(null);
  const [docs, setDocs]               = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, name}

  useEffect(() => {
    setDocsLoading(true);
    getMyDocuments()
      .then(({ data }) => setDocs(data))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false));
  }, [status]);

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
      document.getElementById("file-input").value = "";
    } catch (err) {
      setStatus("error");
      setResult({ error: err.response?.data?.detail || "Upload failed. Please try again." });
    }
  }

  async function handleDeleteDocument() {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget.id);
      setDocs((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    } catch {
      // Could add error toast here
    } finally {
      setDeleteTarget(null);
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  }

  function fileIcon(name) {
    return name?.toLowerCase().endsWith(".pdf") ? "📕" : "📘";
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Upload document</h1>
      <p className="text-sm text-gray-500 mb-6">
        PDF or Word (.docx) — max 20 MB. Answers are scoped to your documents only.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input").click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                    transition-colors select-none
                    ${dragging
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-300 hover:border-indigo-300 hover:bg-gray-50"}`}
      >
        <input id="file-input" type="file" accept=".pdf,.docx,.doc"
          className="hidden" onChange={(e) => setFile(e.target.files[0])} />
        <div className="text-3xl mb-2">{file ? fileIcon(file.name) : "📄"}</div>
        {file ? (
          <>
            <p className="text-sm font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-600">
              Drop file here or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF and DOCX supported</p>
          </>
        )}
      </div>

      {file && (
        <button onClick={handleUpload} disabled={status === "uploading"}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium
                     rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60
                     disabled:cursor-not-allowed">
          {status === "uploading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Uploading and processing…
            </span>
          ) : "Upload and process"}
        </button>
      )}

      {status === "success" && result && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-green-800">✅ Document processed</p>
          <p className="text-green-700 mt-1">
            <span className="font-medium">{result.filename}</span> was split into{" "}
            <span className="font-medium">{result.chunk_count} chunks</span> and embedded.
          </p>
          <button onClick={() => setStatus(null)}
            className="mt-2 text-xs text-green-600 hover:text-green-800 underline">
            Upload another
          </button>
        </div>
      )}

      {status === "error" && result && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-red-800">❌ Upload failed</p>
          <p className="text-red-700 mt-1">{result.error}</p>
          <button onClick={() => setStatus(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline">
            Try again
          </button>
        </div>
      )}

      {/* Document list */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Your documents
          </p>
          {docs.length > 0 && (
            <span className="text-xs text-gray-400">
              {docs.length} file{docs.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {docsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse"/>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-lg px-4 py-8
                          text-center text-sm text-gray-400">
            No documents yet. Upload one above to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id}
                className="group flex items-center gap-3 border border-gray-200
                           rounded-lg px-3 py-2.5 bg-white hover:border-gray-300
                           transition-colors">
                <span className="text-xl shrink-0">{fileIcon(doc.name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400">
                    Uploaded {formatDate(doc.upload_date)}
                  </p>
                </div>
                {doc.chunk_count != null && (
                  <span className="text-xs text-indigo-600 bg-indigo-50 border
                                   border-indigo-100 rounded-full px-2 py-0.5 shrink-0">
                    {doc.chunk_count} chunks
                  </span>
                )}
                {/* Delete button */}
                <button
                  onClick={() => setDeleteTarget({ id: doc.id, name: doc.name })}
                  className="opacity-0 group-hover:opacity-100 shrink-0 w-7 h-7
                             rounded-lg flex items-center justify-center
                             text-gray-400 hover:text-red-600 hover:bg-red-50
                             border border-transparent hover:border-red-200
                             transition-all"
                  aria-label={`Delete ${doc.name}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858
                         L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete document?"
        message={`This will permanently delete "${deleteTarget?.name}" and all its chunks. This cannot be undone.`}
        onConfirm={handleDeleteDocument}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
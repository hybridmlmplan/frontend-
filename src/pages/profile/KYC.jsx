// src/pages/profile/KYC.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../../api/axiosConfig";
import { useStore } from "../../store";

/**
 * KYC.jsx
 * KYC upload & status page for Hybrid MLM frontend.
 *
 * Endpoints used (adjust if backend differs):
 *  - GET  /user/kyc                -> { status, documents: [{ id, type, url, name, uploadedAt }], remarks }
 *  - POST /user/kyc/upload         -> accepts FormData { file, docType } -> returns uploaded doc meta
 *  - POST /user/kyc/submit         -> submits KYC for review
 *  - POST /user/kyc/:id/delete     -> delete an uploaded doc (optional)
 *
 * Paste this file as src/pages/profile/KYC.jsx
 */

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function KYC() {
  const { state, actions } = useStore();
  const { user } = state;

  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("aadhaar");
  const [error, setError] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    fetchKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchKyc() {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.get("/user/kyc");
      // resp: either resp.data or resp.data.data depending on backend
      const data = resp.data || resp;
      setKyc(data);
    } catch (err) {
      setError(err?.message || "Failed to load KYC status");
    } finally {
      setLoading(false);
    }
  }

  function validateFile(file) {
    if (!file) return "No file selected";
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Invalid file type. Accepts JPG, PNG, PDF.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Max 5MB allowed.";
    }
    return null;
  }

  function handleFileChange(e) {
    setError(null);
    const file = e.target.files?.[0];
    const v = validateFile(file);
    if (v) {
      setSelectedFile(null);
      setError(v);
      return;
    }
    setSelectedFile(file);
  }

  async function handleUpload(e) {
    e.preventDefault();
    setError(null);
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("docType", selectedDocType);

      // optional: show upload progress
      const resp = await api.post("/user/kyc/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          // could display progress -> progressEvent.loaded / progressEvent.total
        },
      });

      const data = resp.data || resp;
      // optimistic: add to local state if backend returns uploaded doc
      if (data && data.document) {
        setKyc((prev) => {
          const docs = prev?.documents ? [...prev.documents] : [];
          docs.unshift(data.document);
          return { ...(prev || {}), documents: docs };
        });
        actions.addNotification({ type: "success", message: "Document uploaded." });
      } else {
        // if backend returns full KYC
        await fetchKyc();
        actions.addNotification({ type: "success", message: "Document uploaded." });
      }
      // reset file input
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId) {
    if (!window.confirm("Delete this document?")) return;
    setError(null);
    try {
      await api.post(`/user/kyc/${encodeURIComponent(docId)}/delete`);
      // remove locally
      setKyc((prev) => {
        if (!prev?.documents) return prev;
        return { ...prev, documents: prev.documents.filter((d) => d.id !== docId) };
      });
      actions.addNotification({ type: "info", message: "Document deleted." });
    } catch (err) {
      setError(err?.message || "Delete failed");
    }
  }

  async function handleSubmitForReview() {
    if (!kyc || !(kyc.documents && kyc.documents.length > 0)) {
      setError("Upload at least one document before submitting.");
      return;
    }
    if (kyc.status === "pending") {
      setError("KYC already pending review.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/user/kyc/submit");
      actions.addNotification({ type: "success", message: "KYC submitted for review." });
      await fetchKyc();
    } catch (err) {
      setError(err?.message || "Failed to submit for review");
    } finally {
      setSubmitting(false);
    }
  }

  // small helper to render doc preview
  function renderDocPreview(doc) {
    if (!doc) return null;
    const ext = (doc.name || "").split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return (
        <div className="w-full h-40 flex items-center justify-center bg-gray-50 rounded">
          <div className="text-sm text-gray-600">PDF: {doc.name}</div>
        </div>
      );
    }
    // assume image
    return (
      <img
        src={doc.url}
        alt={doc.name}
        className="w-full h-40 object-contain rounded border bg-white"
      />
    );
  }

  return (
    <div className="p-6 pt-24">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">KYC Verification</h1>
            <p className="text-sm text-gray-500">
              Upload government ID and proof documents. KYC is required for withdrawals & commissions.
            </p>
          </div>

          <div className="text-right text-sm">
            <div className="font-medium">{user?.name || user?.id || "User"}</div>
            <div className="text-gray-500">{user?.email || user?.phone}</div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">KYC Status</div>
              <div className="text-lg font-semibold mt-1">
                {loading ? "Loading..." : (kyc?.status ? kyc.status.toUpperCase() : "Not started")}
              </div>
              {kyc?.remarks && (
                <div className="mt-2 text-sm text-yellow-700">Remarks: {kyc.remarks}</div>
              )}
            </div>

            <div>
              {kyc?.status === "verified" && (
                <div className="px-3 py-1 rounded bg-green-100 text-green-800 font-medium">Verified</div>
              )}
              {kyc?.status === "pending" && (
                <div className="px-3 py-1 rounded bg-yellow-100 text-yellow-800 font-medium">Pending</div>
              )}
              {(!kyc || kyc?.status === "not_submitted" || kyc?.status === "rejected") && (
                <div className="px-3 py-1 rounded bg-gray-100 text-gray-800 font-medium">Not submitted</div>
              )}
            </div>
          </div>
        </div>

        {/* Upload form */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Upload Documents</h2>

          <form onSubmit={handleUpload} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Document type</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="voter">Voter ID</option>
                  <option value="passport">Passport</option>
                  <option value="address">Address Proof</option>
                  <option value="photo">Passport Photo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Select file (jpg/png/pdf, max 5MB)</label>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="w-full"
                />
              </div>
            </div>

            {selectedFile && (
              <div className="p-3 border rounded bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{selectedFile.name}</div>
                    <div className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                      className="text-xs px-2 py-1 border rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="px-4 py-2 border rounded"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Uploaded documents list */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Uploaded Documents</h2>
            <div className="text-sm text-gray-500">Total: {kyc?.documents?.length || 0}</div>
          </div>

          {kyc?.documents && kyc.documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kyc.documents.map((doc) => (
                <div key={doc.id} className="border rounded overflow-hidden">
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-24 flex-shrink-0">
                        {renderPreviewForUrl(doc.url, doc.name)}
                      </div>

                      <div className="flex-1">
                        <div className="font-medium">{doc.name || doc.type}</div>
                        <div className="text-xs text-gray-500">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : "-"}</div>
                        <div className="mt-3 flex gap-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 border rounded"
                          >
                            View
                          </a>

                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-xs px-2 py-1 border rounded text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-gray-500">No documents uploaded yet.</div>
          )}
        </div>

        {/* Submit for review */}
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="max-w-xl mx-auto">
            <p className="text-sm text-gray-600 mb-3">
              After uploading required documents, click below to submit your KYC for verification. Our team will review and update the status.
            </p>

            <div className="flex justify-center gap-2">
              <button
                onClick={handleSubmitForReview}
                disabled={submitting || (kyc?.status === "pending")}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {submitting ? "Submitting..." : (kyc?.status === "pending" ? "Already submitted" : "Submit for verification")}
              </button>

              <button onClick={() => fetchKyc()} className="px-4 py-2 border rounded">
                Refresh status
              </button>
            </div>

            {kyc?.status === "rejected" && kyc?.remarks && (
              <div className="mt-3 text-sm text-red-600">
                Rejected reason: {kyc.remarks}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: small preview renderer for file URL
 * If image -> show image thumbnail; if pdf -> show PDF placeholder
 */
function renderPreviewForUrl(url, name) {
  if (!url) {
    return <div className="w-24 h-16 bg-gray-50 flex items-center justify-center text-xs text-gray-400">No preview</div>;
  }
  const ext = (name || url || "").split(".").pop().toLowerCase();
  if (ext === "pdf") {
    return (
      <div className="w-24 h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-600">
        PDF
      </div>
    );
  }
  return <img src={url} alt={name} className="w-24 h-16 object-contain bg-white rounded" />;
}

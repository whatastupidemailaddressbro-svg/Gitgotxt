import React, { useState } from "react";
import { User } from "firebase/auth";
import {
  X,
  HardDrive,
  FileText,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Download,
  Copy,
  Send,
  Sparkles,
} from "lucide-react";
import { uploadToGoogleDrive, createGoogleDoc, sendViaGmail } from "../services/googleWorkspace";
import { GoogleAuthButton } from "./GoogleAuthButton";

interface SaveDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  containerText: string;
  asciiTree: string;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onDownloadTxt: () => void;
}

type DestinationTab = "drive" | "docs" | "gmail" | "standard";

export const SaveDestinationModal: React.FC<SaveDestinationModalProps> = ({
  isOpen,
  onClose,
  repoName,
  containerText,
  asciiTree,
  user,
  accessToken,
  onSignIn,
  onSignOut,
  onDownloadTxt,
}) => {
  const [activeTab, setActiveTab] = useState<DestinationTab>("drive");

  // Form states
  const safeRepoName = repoName.replace(/[/\\?%*:|"<>]/g, "_");
  const [driveFilename, setDriveFilename] = useState(`${safeRepoName}_container.txt`);
  const [docsTitle, setDocsTitle] = useState(`${repoName} - RepoPack Container`);
  const [gmailRecipient, setGmailRecipient] = useState(user?.email || "");
  const [gmailSubject, setGmailSubject] = useState(`RepoPack Container: ${repoName}`);

  // Action status
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [driveResult, setDriveResult] = useState<{ id: string; webViewLink?: string } | null>(null);
  const [docsResult, setDocsResult] = useState<{ documentId: string; docUrl: string } | null>(null);
  const [gmailResult, setGmailResult] = useState<{ id: string } | null>(null);

  // Mandatory confirmation dialog state
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    action: "drive" | "docs" | "gmail";
    title: string;
    details: string;
  } | null>(null);

  if (!isOpen) return null;

  // Keep recipient synced if user just signed in
  if (user?.email && !gmailRecipient) {
    setGmailRecipient(user.email);
  }

  // --- Handlers with Mandatory Confirmation ---

  const requestSaveToDrive = () => {
    setErrorMsg(null);
    if (!accessToken) {
      setErrorMsg("Please sign in with Google to save directly to your Google Drive.");
      return;
    }
    setPendingConfirmation({
      action: "drive",
      title: "Save File to Google Drive",
      details: `This will upload '${driveFilename}' (${(containerText.length / 1024).toFixed(1)} KB) directly into your Google Drive root.`,
    });
  };

  const executeSaveToDrive = async () => {
    if (!accessToken) return;
    setPendingConfirmation(null);
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await uploadToGoogleDrive(accessToken, driveFilename, containerText);
      setDriveResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload file to Google Drive.");
    } finally {
      setIsProcessing(false);
    }
  };

  const requestSaveToDocs = () => {
    setErrorMsg(null);
    if (!accessToken) {
      setErrorMsg("Please sign in with Google to create a Google Doc.");
      return;
    }
    setPendingConfirmation({
      action: "docs",
      title: "Create Google Document",
      details: `This will create a new Google Doc titled '${docsTitle}' containing the repository directory tree and code files.`,
    });
  };

  const executeSaveToDocs = async () => {
    if (!accessToken) return;
    setPendingConfirmation(null);
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await createGoogleDoc(accessToken, docsTitle, containerText);
      setDocsResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create Google Doc.");
    } finally {
      setIsProcessing(false);
    }
  };

  const requestSendGmail = () => {
    setErrorMsg(null);
    const targetEmail = gmailRecipient.trim() || user?.email || "";
    if (!targetEmail) {
      setErrorMsg("Please specify a recipient email address.");
      return;
    }
    if (!accessToken) {
      setErrorMsg("Please sign in with Google to send via Gmail API.");
      return;
    }
    setPendingConfirmation({
      action: "gmail",
      title: "Send Container via Gmail",
      details: `This will send an email from your Gmail account to '${targetEmail}' with subject '${gmailSubject}' and attach '${driveFilename}'.`,
    });
  };

  const executeSendGmail = async () => {
    if (!accessToken) return;
    setPendingConfirmation(null);
    setIsProcessing(true);
    setErrorMsg(null);
    const targetEmail = gmailRecipient.trim() || user?.email || "";
    try {
      const bodySummary = [
        `RepoPack Repository Container Export`,
        `Repository: ${repoName}`,
        `Total Size: ${(containerText.length / 1024).toFixed(1)} KB`,
        `Timestamp: ${new Date().toUTCString()}`,
        ``,
        `Directory Structure:`,
        asciiTree,
        ``,
        `The complete repository text container is attached to this email as '${driveFilename}'.`,
        `To unpack it on your computer, run:`,
        `  bash ${driveFilename} ./restored_repo`,
      ].join("\n");

      const res = await sendViaGmail(
        accessToken,
        targetEmail,
        gmailSubject,
        bodySummary,
        driveFilename,
        containerText
      );
      setGmailResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send email via Gmail API.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Mailto launcher for standard desktop/mobile email
  const handleOpenMailto = () => {
    const targetEmail = gmailRecipient.trim() || user?.email || "";
    const subjectEncoded = encodeURIComponent(gmailSubject);
    const bodyEncoded = encodeURIComponent(
      `RepoPack Text Container for ${repoName}\n\n` +
      `Directory Structure:\n${asciiTree.slice(0, 1500)}\n\n` +
      `[Note: Save the attached or downloaded container file to restore files].`
    );
    window.location.href = `mailto:${encodeURIComponent(targetEmail)}?subject=${subjectEncoded}&body=${bodyEncoded}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-200 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Save & Export Repository Container
              </h3>
              <p className="text-[11px] text-zinc-400">
                Export to Google Drive, Google Docs, Gmail, or local formats
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <GoogleAuthButton
              user={user}
              isLoading={false}
              onSignIn={onSignIn}
              onSignOut={onSignOut}
            />
            <button
              id="btn-close-save-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 border-b border-zinc-800 bg-zinc-950/60 overflow-x-auto gap-1 py-1.5">
          <button
            id="tab-save-drive"
            type="button"
            onClick={() => { setActiveTab("drive"); setErrorMsg(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "drive"
                ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Google Drive</span>
          </button>

          <button
            id="tab-save-docs"
            type="button"
            onClick={() => { setActiveTab("docs"); setErrorMsg(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "docs"
                ? "bg-zinc-800 text-blue-400 border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Google Docs</span>
          </button>

          <button
            id="tab-save-gmail"
            type="button"
            onClick={() => { setActiveTab("gmail"); setErrorMsg(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "gmail"
                ? "bg-zinc-800 text-rose-400 border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail (Self Email)</span>
          </button>

          <button
            id="tab-save-standard"
            type="button"
            onClick={() => { setActiveTab("standard"); setErrorMsg(null); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "standard"
                ? "bg-zinc-800 text-amber-400 border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Local & Standard Mail</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Export Error</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Active Operation Progress Indicator */}
          {isProcessing && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/30 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {activeTab === "drive"
                      ? "Uploading container to Google Drive..."
                      : activeTab === "docs"
                      ? "Creating and writing Google Doc..."
                      : "Dispatching email via Gmail API..."}
                  </span>
                </div>
                <span className="font-mono text-zinc-400 text-[11px]">In progress</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full w-full animate-pulse" />
              </div>
            </div>
          )}

          {/* TAB 1: GOOGLE DRIVE */}
          {activeTab === "drive" && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-100 text-sm">Save to Google Drive</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Uploads the complete self-extracting text container into your personal Google Drive storage as a plain text archive.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Destination Filename in Google Drive
                </label>
                <input
                  type="text"
                  value={driveFilename}
                  onChange={(e) => setDriveFilename(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  placeholder="repo_container.txt"
                />
              </div>

              {driveResult ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Successfully saved to Google Drive!</span>
                  </div>
                  <p className="text-zinc-300 text-xs">
                    File ID: <code className="font-mono text-zinc-400">{driveResult.id}</code>
                  </p>
                  {driveResult.webViewLink && (
                    <a
                      href={driveResult.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                    >
                      <span>Open in Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="pt-2">
                  {user ? (
                    <button
                      id="btn-confirm-save-drive"
                      type="button"
                      disabled={isProcessing}
                      onClick={requestSaveToDrive}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading to Google Drive...</span>
                        </>
                      ) : (
                        <>
                          <HardDrive className="w-4 h-4" />
                          <span>Upload Container to Google Drive</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
                      <p className="text-zinc-400 text-xs">
                        Google authentication is required to upload files to your Google Drive.
                      </p>
                      <div className="flex justify-center">
                        <GoogleAuthButton
                          user={null}
                          isLoading={false}
                          onSignIn={onSignIn}
                          onSignOut={onSignOut}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DOCS */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-100 text-sm">Save to Google Docs</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Creates a new formatted Google Document containing the repository directory structure and source files, ready to share or collaborate on.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Google Document Title
                </label>
                <input
                  type="text"
                  value={docsTitle}
                  onChange={(e) => setDocsTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl font-medium text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="My Repo - RepoPack Container"
                />
              </div>

              {docsResult ? (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Google Doc created successfully!</span>
                  </div>
                  <p className="text-zinc-300 text-xs">
                    Document ID: <code className="font-mono text-zinc-400">{docsResult.documentId}</code>
                  </p>
                  <a
                    href={docsResult.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white font-bold text-xs hover:bg-blue-400 transition-colors"
                  >
                    <span>Open in Google Docs</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="pt-2">
                  {user ? (
                    <button
                      id="btn-confirm-save-docs"
                      type="button"
                      disabled={isProcessing}
                      onClick={requestSaveToDocs}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Creating Google Doc...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          <span>Create Google Doc</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
                      <p className="text-zinc-400 text-xs">
                        Google authentication is required to create documents in your Google account.
                      </p>
                      <div className="flex justify-center">
                        <GoogleAuthButton
                          user={null}
                          isLoading={false}
                          onSignIn={onSignIn}
                          onSignOut={onSignOut}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GMAIL */}
          {activeTab === "gmail" && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-100 text-sm">Send via Gmail (To Any Email or Self)</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Dispatches an email through the official Gmail API with a formatted repository summary and the full <strong className="text-zinc-200">.txt container attached</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={gmailRecipient}
                    onChange={(e) => setGmailRecipient(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl font-medium text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                    placeholder={user?.email || "e.g. you@example.com"}
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Enter any destination address (or your own email to send it to yourself).
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={gmailSubject}
                    onChange={(e) => setGmailSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl font-medium text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {gmailResult ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Email sent successfully to {gmailRecipient}!</span>
                  </div>
                  <p className="text-zinc-300 text-xs">
                    Gmail Message ID: <code className="font-mono text-zinc-400">{gmailResult.id}</code>
                  </p>
                  <span className="text-[11px] text-zinc-400 block">
                    Check your Gmail inbox. The message includes the repository summary and container attachment.
                  </span>
                </div>
              ) : (
                <div className="pt-2 space-y-2">
                  {user ? (
                    <button
                      id="btn-confirm-send-gmail"
                      type="button"
                      disabled={isProcessing}
                      onClick={requestSendGmail}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending via Gmail API...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Container via Gmail</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
                      <p className="text-zinc-400 text-xs">
                        Sign in with Google to enable sending this container directly to any destination via Gmail.
                      </p>
                      <div className="flex justify-center">
                        <GoogleAuthButton
                          user={null}
                          isLoading={false}
                          onSignIn={onSignIn}
                          onSignOut={onSignOut}
                        />
                      </div>
                    </div>
                  )}

                  {/* Standard mailto alternative button */}
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={handleOpenMailto}
                      className="text-xs text-zinc-400 hover:text-zinc-200 underline decoration-zinc-600 cursor-pointer"
                    >
                      Or open in your operating system's default email client (mailto:)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STANDARD / LOCAL */}
          {activeTab === "standard" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <h4 className="font-semibold text-zinc-100 text-sm mb-1">Standard Export Options</h4>
                <p className="text-zinc-400 text-xs">
                  Save directly to disk without requiring any third-party accounts or cloud permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="btn-modal-dl-txt"
                  type="button"
                  onClick={onDownloadTxt}
                  className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 flex items-center space-x-2.5 text-left transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-zinc-200 block">Download .txt Container</span>
                    <span className="text-zinc-500 text-[11px]">Direct file download to disk</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOpenMailto}
                  className="p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 flex items-center space-x-2.5 text-left transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-semibold text-zinc-200 block">Draft in Local Email Client</span>
                    <span className="text-zinc-500 text-[11px]">Opens mail app via mailto</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mandatory User Confirmation Dialog Modal Overlay */}
        {pendingConfirmation && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {pendingConfirmation.title}
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    Google Workspace Permission Confirmation
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300">
                {pendingConfirmation.details}
              </div>

              <p className="text-[11px] text-zinc-400">
                RepoPack will access Google Workspace services solely to perform this requested action.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingConfirmation(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-execute-confirmed-action"
                  type="button"
                  onClick={() => {
                    if (pendingConfirmation.action === "drive") executeSaveToDrive();
                    else if (pendingConfirmation.action === "docs") executeSaveToDocs();
                    else if (pendingConfirmation.action === "gmail") executeSendGmail();
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Confirm & Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Drive, Docs, and Gmail APIs configured</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

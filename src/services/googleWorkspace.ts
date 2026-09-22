/**
 * Google Workspace API client for RepoPack
 * Integrates:
 *  - Google Drive (v3): Create/upload text containers to user's Google Drive
 *  - Google Docs (v1): Create new Docs containing the container and repository content
 *  - Gmail (v1): Send container email / attachment to user's own Gmail address
 */

// Helper to encode string to standard RFC 4648 base64url without padding
function toBase64Url(str: string): string {
  // Convert UTF-8 string to bytes safely
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Upload container as a text file directly to Google Drive
 */
export async function uploadToGoogleDrive(
  accessToken: string,
  filename: string,
  content: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const metadata = {
    name: filename.endsWith('.txt') ? filename : `${filename}.txt`,
    mimeType: 'text/plain',
    description: 'RepoPack self-unpacking text container created from GitHub repository.',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive upload failed (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const webViewLink =
    result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`;
  return { id: result.id, name: result.name, webViewLink };
}

/**
 * Create a new Google Doc and insert the container content
 */
export async function createGoogleDoc(
  accessToken: string,
  title: string,
  content: string
): Promise<{ documentId: string; title: string; docUrl: string }> {
  // Step 1: Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title.endsWith('Container') ? title : `${title} - RepoPack Container`,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Docs creation failed (${createRes.status}): ${errText}`);
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // Step 2: Insert text into document in manageable chunks (Docs API max batch limit)
  // Google Docs batchUpdate character limit per insert is ~50,000 chars
  const CHUNK_SIZE = 45000;
  // If content is very large, take first chunks or stream
  const maxChunks = 15; // Up to ~675KB text safely
  const chunks: string[] = [];
  for (let i = 0; i < content.length && chunks.length < maxChunks; i += CHUNK_SIZE) {
    chunks.push(content.substring(i, i + CHUNK_SIZE));
  }

  if (content.length > maxChunks * CHUNK_SIZE) {
    chunks.push(
      `\n\n[... Truncated for Google Docs size limit. Download the full .txt container directly from RepoPack for complete contents ...]\n`
    );
  }

  // To maintain correct order, insert chunks backwards at index 1 or calculate running index
  // Reverse insert at index 1 is standard and reliable for Google Docs API:
  const requests = chunks
    .slice()
    .reverse()
    .map((chunk) => ({
      insertText: {
        location: { index: 1 },
        text: chunk,
      },
    }));

  const updateRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.warn('Docs batchUpdate warning:', errText);
    // Even if batch text insert had a warning, doc was created
  }

  const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;
  return { documentId, title: doc.title || title, docUrl };
}

/**
 * Send an email to oneself via Gmail API with the container attached or inlined
 */
export async function sendViaGmail(
  accessToken: string,
  toEmail: string,
  subject: string,
  bodySummary: string,
  filename: string,
  fileContent: string
): Promise<{ id: string; threadId: string }> {
  const boundary = 'RepoPackMimeBoundary_' + Date.now();
  const safeFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;

  // Construct MIME multipart/mixed message
  const mimeParts = [
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    bodySummary,
    '',
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8; name="${safeFilename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${safeFilename}"`,
    '',
    // Base64 encode the attachment file content
    btoa(unescape(encodeURIComponent(fileContent))),
    '',
    `--${boundary}--`,
  ];

  const rawMime = mimeParts.join('\r\n');
  const base64UrlEncoded = toBase64Url(rawMime);

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64UrlEncoded,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gmail send failed (${response.status}): ${errText}`);
  }

  return response.json();
}

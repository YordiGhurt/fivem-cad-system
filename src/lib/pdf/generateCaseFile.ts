import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

interface CaseFileData {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  citizenName: string | null;
  citizenId: string | null;
  createdBy: { username: string };
  assignedTo: { username: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const statusLabels: Record<string, string> = {
  OPEN: 'Offen',
  UNDER_REVIEW: 'In Prüfung',
  CLOSED: 'Geschlossen',
  ARCHIVED: 'Archiviert',
};

const statusColors: Record<string, string> = {
  OPEN: '#3b82f6',
  UNDER_REVIEW: '#eab308',
  CLOSED: '#64748b',
  ARCHIVED: '#475569',
};

export async function generateCaseFilePDF(caseFile: CaseFileData): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'case-files');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `casefile-${caseFile.id}-${Date.now()}.pdf`;
  const filepath = path.join(dir, filename);

  const safeDescription = caseFile.description
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const statusLabel = statusLabels[caseFile.status] ?? caseFile.status;
  const statusColor = statusColors[caseFile.status] ?? '#64748b';

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Parteiakte – ${caseFile.caseNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { margin: 0; font-size: 22px; color: #1e3a5f; }
    .doc-type { font-size: 14px; font-weight: bold; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .case-number { font-family: monospace; font-size: 13px; color: #64748b; margin-top: 4px; }
    .status-badge { display: inline-block; background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; background: #eef2ff; padding: 16px; border-radius: 8px; border: 1px solid #c7d2fe; }
    .meta-item label { font-size: 11px; text-transform: uppercase; color: #64748b; display: block; }
    .meta-item span { font-weight: 600; color: #1e293b; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 13px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
    .content { line-height: 1.7; white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
    .official-seal { text-align: center; margin: 20px 0; font-size: 11px; color: #64748b; border: 2px dashed #e2e8f0; padding: 10px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="doc-type">Parteiakte</div>
      <h1>${caseFile.title}</h1>
      <div class="case-number">${caseFile.caseNumber}</div>
    </div>
    <span class="status-badge">${statusLabel}</span>
  </div>
  <div class="meta">
    <div class="meta-item">
      <label>Bürger</label>
      <span>${caseFile.citizenName ?? '—'}</span>
    </div>
    <div class="meta-item">
      <label>Bürger-ID</label>
      <span>${caseFile.citizenId ?? '—'}</span>
    </div>
    <div class="meta-item">
      <label>Erstellt von</label>
      <span>${caseFile.createdBy.username}</span>
    </div>
    <div class="meta-item">
      <label>Zugewiesen an</label>
      <span>${caseFile.assignedTo?.username ?? '—'}</span>
    </div>
    <div class="meta-item">
      <label>Erstellt am</label>
      <span>${format(new Date(caseFile.createdAt), 'dd.MM.yyyy HH:mm')}</span>
    </div>
    <div class="meta-item">
      <label>Aktualisiert am</label>
      <span>${format(new Date(caseFile.updatedAt), 'dd.MM.yyyy HH:mm')}</span>
    </div>
  </div>
  <div class="section">
    <h2>Fallbeschreibung</h2>
    <div class="content">${safeDescription}</div>
  </div>
  <div class="official-seal">
    Amtliches Dokument – FiveM CAD System
  </div>
  <div class="footer">
    Generiert am ${format(new Date(), 'dd.MM.yyyy HH:mm:ss')} | FiveM CAD System
  </div>
</body>
</html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: filepath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/case-files/${filename}`;
}

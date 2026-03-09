import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

interface ChargeData {
  id: string;
  citizenName: string;
  citizenId: string | null;
  description: string;
  status: string;
  issuedBy: { username: string };
  law: { code: string; title: string } | null;
  createdAt: Date;
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ausstehend',
  ACTIVE: 'Aktiv',
  DISMISSED: 'Eingestellt',
  SERVED: 'Vollstreckt',
};

const statusColors: Record<string, string> = {
  PENDING: '#eab308',
  ACTIVE: '#3b82f6',
  DISMISSED: '#64748b',
  SERVED: '#22c55e',
};

export async function generateChargePDF(charge: ChargeData): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'charges');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `charge-${charge.id}-${Date.now()}.pdf`;
  const filepath = path.join(dir, filename);

  const safeDescription = charge.description
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const statusLabel = statusLabels[charge.status] ?? charge.status;
  const statusColor = statusColors[charge.status] ?? '#64748b';

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Anklage – ${charge.citizenName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    .header { border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { margin: 0; font-size: 22px; color: #1e3a5f; }
    .doc-type { font-size: 14px; font-weight: bold; color: #f97316; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .status-badge { display: inline-block; background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; background: #fff7ed; padding: 16px; border-radius: 8px; border: 1px solid #fed7aa; }
    .meta-item label { font-size: 11px; text-transform: uppercase; color: #64748b; display: block; }
    .meta-item span { font-weight: 600; color: #1e293b; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 13px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
    .content { line-height: 1.7; white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px; }
    .law-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; }
    .law-box .code { font-family: monospace; font-weight: bold; color: #166534; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="doc-type">Anklage</div>
      <h1>${charge.citizenName}</h1>
      ${charge.citizenId ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">ID: ${charge.citizenId}</div>` : ''}
    </div>
    <span class="status-badge">${statusLabel}</span>
  </div>
  <div class="meta">
    <div class="meta-item">
      <label>Anklage-ID</label>
      <span>${charge.id}</span>
    </div>
    <div class="meta-item">
      <label>Ankläger</label>
      <span>${charge.issuedBy.username}</span>
    </div>
    <div class="meta-item">
      <label>Erstellt am</label>
      <span>${format(new Date(charge.createdAt), 'dd.MM.yyyy HH:mm')}</span>
    </div>
    <div class="meta-item">
      <label>Status</label>
      <span>${statusLabel}</span>
    </div>
  </div>
  ${charge.law ? `
  <div class="section">
    <h2>Gesetzliche Grundlage</h2>
    <div class="law-box">
      <div class="code">${charge.law.code}</div>
      <div style="margin-top:4px;color:#1e293b;">${charge.law.title}</div>
    </div>
  </div>` : ''}
  <div class="section">
    <h2>Anklagebeschreibung</h2>
    <div class="content">${safeDescription}</div>
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
  return `${baseUrl}/charges/${filename}`;
}

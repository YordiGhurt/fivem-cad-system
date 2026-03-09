import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

interface WarrantData {
  id: string;
  citizenName: string;
  citizenId: string | null;
  reason: string;
  charges: string;
  status: string;
  issuedBy: { username: string };
  expiresAt: Date | null;
  createdAt: Date;
}

export async function generateWarrantPDF(warrant: WarrantData): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'warrants');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `warrant-${warrant.id}-${Date.now()}.pdf`;
  const filepath = path.join(dir, filename);

  const safeReason = warrant.reason
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeCharges = warrant.charges
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const statusColor = warrant.status === 'ACTIVE' ? '#ef4444' : warrant.status === 'SERVED' ? '#22c55e' : '#64748b';

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Haftbefehl – ${warrant.citizenName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    .header { border-bottom: 3px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { margin: 0; font-size: 22px; color: #1e3a5f; }
    .header .doc-type { font-size: 14px; font-weight: bold; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; }
    .status-badge { display: inline-block; background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; background: #fef2f2; padding: 16px; border-radius: 8px; border: 1px solid #fecaca; }
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
      <div class="doc-type">Haftbefehl</div>
      <h1>${warrant.citizenName}</h1>
      ${warrant.citizenId ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">ID: ${warrant.citizenId}</div>` : ''}
    </div>
    <span class="status-badge">${warrant.status}</span>
  </div>
  <div class="meta">
    <div class="meta-item">
      <label>Haftbefehl-ID</label>
      <span>${warrant.id}</span>
    </div>
    <div class="meta-item">
      <label>Ausgestellt von</label>
      <span>${warrant.issuedBy.username}</span>
    </div>
    <div class="meta-item">
      <label>Ausgestellt am</label>
      <span>${format(new Date(warrant.createdAt), 'dd.MM.yyyy HH:mm')}</span>
    </div>
    <div class="meta-item">
      <label>Gültig bis</label>
      <span>${warrant.expiresAt ? format(new Date(warrant.expiresAt), 'dd.MM.yyyy HH:mm') : 'Unbefristet'}</span>
    </div>
  </div>
  <div class="section">
    <h2>Begründung</h2>
    <div class="content">${safeReason}</div>
  </div>
  <div class="section">
    <h2>Anklagepunkte</h2>
    <div class="content">${safeCharges}</div>
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
  return `${baseUrl}/warrants/${filename}`;
}

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

interface VerdictData {
  id: string;
  caseNumber: string;
  citizenName: string;
  citizenId: string | null;
  type: string;
  sentence: string | null;
  jailTime: number | null;
  fineAmount: number | null;
  judge: { username: string };
  notes: string | null;
  issuedAt: Date;
}

const verdictTypeLabels: Record<string, string> = {
  GUILTY: 'Schuldig',
  NOT_GUILTY: 'Nicht schuldig',
  PLEA_DEAL: 'Geständnisvereinbarung',
  DISMISSED: 'Eingestellt',
};

const verdictTypeColors: Record<string, string> = {
  GUILTY: '#ef4444',
  NOT_GUILTY: '#22c55e',
  PLEA_DEAL: '#eab308',
  DISMISSED: '#64748b',
};

export async function generateVerdictPDF(verdict: VerdictData): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'verdicts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `verdict-${verdict.id}-${Date.now()}.pdf`;
  const filepath = path.join(dir, filename);

  const safeSentence = (verdict.sentence ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeNotes = (verdict.notes ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const typeLabel = verdictTypeLabels[verdict.type] ?? verdict.type;
  const typeColor = verdictTypeColors[verdict.type] ?? '#64748b';

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Urteil – ${verdict.caseNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    .header { border-bottom: 3px solid #a855f7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { margin: 0; font-size: 22px; color: #1e3a5f; }
    .doc-type { font-size: 14px; font-weight: bold; color: #a855f7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .case-number { font-size: 13px; color: #64748b; font-family: monospace; }
    .verdict-badge { display: inline-block; background: ${typeColor}; color: white; padding: 6px 16px; border-radius: 4px; font-size: 14px; font-weight: bold; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px; background: #faf5ff; padding: 16px; border-radius: 8px; border: 1px solid #e9d5ff; }
    .meta-item label { font-size: 11px; text-transform: uppercase; color: #64748b; display: block; }
    .meta-item span { font-weight: 600; color: #1e293b; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 13px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
    .content { line-height: 1.7; white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 6px; }
    .penalty-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .penalty-item { background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: center; }
    .penalty-item .value { font-size: 20px; font-weight: bold; color: #1e3a5f; }
    .penalty-item .label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 4px; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
    .official-seal { text-align: center; margin: 20px 0; font-size: 11px; color: #64748b; border: 2px dashed #e2e8f0; padding: 10px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="doc-type">Urteil</div>
      <h1>${verdict.citizenName}</h1>
      <div class="case-number">${verdict.caseNumber}</div>
    </div>
    <span class="verdict-badge">${typeLabel}</span>
  </div>
  <div class="meta">
    <div class="meta-item">
      <label>Bürger-ID</label>
      <span>${verdict.citizenId ?? '—'}</span>
    </div>
    <div class="meta-item">
      <label>Richter</label>
      <span>${verdict.judge.username}</span>
    </div>
    <div class="meta-item">
      <label>Urteilsdatum</label>
      <span>${format(new Date(verdict.issuedAt), 'dd.MM.yyyy HH:mm')}</span>
    </div>
    <div class="meta-item">
      <label>Urteilstyp</label>
      <span>${typeLabel}</span>
    </div>
  </div>
  ${verdict.jailTime || verdict.fineAmount ? `
  <div class="section">
    <h2>Strafe</h2>
    <div class="penalty-grid">
      ${verdict.jailTime ? `<div class="penalty-item"><div class="value">${verdict.jailTime} Mon.</div><div class="label">Haftzeit</div></div>` : ''}
      ${verdict.fineAmount ? `<div class="penalty-item"><div class="value">$${verdict.fineAmount.toLocaleString('de-DE')}</div><div class="label">Geldstrafe</div></div>` : ''}
    </div>
  </div>` : ''}
  ${safeSentence ? `
  <div class="section">
    <h2>Urteilsbegründung</h2>
    <div class="content">${safeSentence}</div>
  </div>` : ''}
  ${safeNotes ? `
  <div class="section">
    <h2>Notizen</h2>
    <div class="content">${safeNotes}</div>
  </div>` : ''}
  <div class="official-seal">
    Amtliches Dokument – Department of Justice | FiveM CAD System
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
  return `${baseUrl}/verdicts/${filename}`;
}

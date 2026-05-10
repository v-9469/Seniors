import { jsPDF } from 'jspdf';

/**
 * STAMP_LABELS maps Material Symbols icon names to readable stamp labels.
 */
const STAMP_LABELS = {
  local_florist: 'Flowers',
  favorite: 'Love',
  stars: 'Stars',
  flight_takeoff: 'Fly High',
  cake: 'Celebrate',
  auto_stories: 'Memories',
  heart: 'Love',
};

/**
 * Pastel card fill colors — cycling per message (RGB arrays)
 */
const CARD_FILLS = [
  [232, 224, 242], // soft lavender
  [248, 220, 220], // blush pink
  [220, 238, 220], // sage green
  [252, 242, 218], // warm cream
  [216, 234, 248], // powder blue
  [255, 228, 210], // peach
];

/**
 * Washi-tape accent colors (used as small corner strips)
 */
const TAPE_COLORS = [
  [255, 182, 193], // pink
  [173, 216, 230], // sky blue
  [144, 238, 144], // mint
  [255, 218, 185], // peach
  [216, 191, 216], // thistle
  [255, 255, 160], // soft yellow
];

/**
 * Get image dimensions from a data URL
 */
function getImageDimensions(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 200, height: 150 });
    img.src = imageUrl;
  });
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

/* ─────────────────────────────────────────
   PAGE CHROME
───────────────────────────────────────── */

/**
 * Warm off-white background with a subtle lined-paper texture hint
 */
function drawPageBg(doc) {
  // Base ivory
  doc.setFillColor(252, 249, 244);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Subtle horizontal rule lines (like notebook paper)
  doc.setDrawColor(235, 228, 218);
  doc.setLineWidth(0.12);
  for (let lineY = 30; lineY < PAGE_H - 10; lineY += 7) {
    doc.line(0, lineY, PAGE_W, lineY);
  }

  // Spiral-hole punch dots on left edge
  doc.setFillColor(218, 210, 200);
  for (let dotY = 25; dotY < PAGE_H - 10; dotY += 22) {
    doc.circle(7, dotY, 2.5, 'F');
    doc.setFillColor(252, 249, 244);
    doc.circle(7, dotY, 1.5, 'F');
    doc.setFillColor(218, 210, 200);
  }
}

function addNewPage(doc) {
  doc.addPage();
  drawPageBg(doc);
  return MARGIN + 8;
}

function checkPageBreak(doc, y, threshold = 50) {
  if (y + threshold > PAGE_H - MARGIN) {
    return addNewPage(doc);
  }
  return y;
}

/* ─────────────────────────────────────────
   DECORATIVE HELPERS
───────────────────────────────────────── */

/**
 * Draw a small washi-tape strip at (x, y) with given width and color
 */
function drawTape(doc, x, y, w, rgb, angle = 0) {
  const [r, g, b] = rgb;
  doc.setFillColor(r, g, b);
  // jsPDF doesn't support rotation easily, so we draw a tilted parallelogram
  // via a thin rect with slight height
  doc.roundedRect(x, y, w, 4, 1, 1, 'F');
}

/**
 * Draw a small star shape using lines
 */
function drawStar(doc, cx, cy, size, rgb) {
  const [r, g, b] = rgb;
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.4);
  const pts = 5;
  const outer = size;
  const inner = size * 0.4;
  for (let i = 0; i < pts * 2; i++) {
    const angle = (i * Math.PI) / pts - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : inner;
    const nx = cx + Math.cos(angle) * radius;
    const ny = cy + Math.sin(angle) * radius;
    if (i === 0) doc.lines([[nx - cx, ny - cy]], cx, cy);
  }
  // Simpler: just draw 4 small lines radiating from center
  doc.setLineWidth(0.5);
  const s = size;
  doc.line(cx - s, cy, cx + s, cy);
  doc.line(cx, cy - s, cx, cy + s);
  doc.line(cx - s * 0.7, cy - s * 0.7, cx + s * 0.7, cy + s * 0.7);
  doc.line(cx - s * 0.7, cy + s * 0.7, cx + s * 0.7, cy - s * 0.7);
}

/**
 * Draw a tiny heart outline at (cx, cy)
 */
function drawHeart(doc, cx, cy, size, rgb) {
  const [r, g, b] = rgb;
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.35);
  // Approximate heart as two arcs + lines — simplified to a lozenge
  const s = size;
  doc.lines(
    [
      [s, -s],
      [s, s],
      [0, s],
      [-s, s],
      [-s, -s],
      [0, -s * 0.5],
    ],
    cx - s,
    cy,
    [1, 1],
    null,
    false
  );
  // Simple ♡ via two small rects at angle — use text instead
  doc.setFont('times', 'normal');
  doc.setFontSize(size * 5);
  doc.setTextColor(r, g, b);
  doc.text('♡', cx, cy + size, { align: 'center' });
}

/* ─────────────────────────────────────────
   COVER SECTION
───────────────────────────────────────── */

function drawCoverSection(doc, student, messageCount) {
  const cx = PAGE_W / 2;

  // ── Sunburst / radial lines behind title ──
  doc.setDrawColor(245, 220, 140);
  doc.setLineWidth(0.3);
  for (let a = 0; a < 360; a += 18) {
    const rad = (a * Math.PI) / 180;
    doc.line(
      cx + Math.cos(rad) * 14,
      52 + Math.sin(rad) * 14,
      cx + Math.cos(rad) * 22,
      52 + Math.sin(rad) * 22
    );
  }

  // ── Swirl / circle accent ──
  doc.setDrawColor(212, 168, 67);
  doc.setLineWidth(0.5);
  doc.circle(cx - 36, 48, 5, 'S');
  doc.circle(cx - 36, 48, 3, 'S');

  // ── "Golden" — large display line ──
  doc.setFont('times', 'bold');
  doc.setFontSize(54);
  doc.setTextColor(180, 130, 30); // rich gold
  doc.text('Golden', cx, 68, { align: 'center' });

  // ── "hour" — italic, slightly offset ──
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(38);
  doc.setTextColor(140, 95, 20);
  doc.text('hour', cx + 8, 82, { align: 'center' });

  // ── "Class of 2026" pill badge ──
  const badgeW = 44;
  const badgeH = 8;
  const badgeX = cx - badgeW / 2;
  const badgeY = 88;
  doc.setFillColor(252, 220, 100); // warm yellow pill
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 70, 10);
  doc.text('Class of 2026', cx, badgeY + 5.8, { align: 'center' });

  // ── Gold divider with small diamonds ──
  const divY = 103;
  doc.setDrawColor(212, 168, 67);
  doc.setLineWidth(0.5);
  doc.line(cx - 40, divY, cx - 6, divY);
  doc.line(cx + 6, divY, cx + 40, divY);
  // Diamond centre
  doc.setFillColor(212, 168, 67);
  doc.rect(cx - 3, divY - 2, 6, 4, 'F');

  // ── Decorative corner stars ──
  doc.setFontSize(10);
  doc.setTextColor(212, 168, 67);
  doc.text('✦', MARGIN + 4, 75);
  doc.text('✦', PAGE_W - MARGIN - 8, 75);
  doc.setFontSize(7);
  doc.text('✦', MARGIN + 12, 85);
  doc.text('✦', PAGE_W - MARGIN - 16, 85);

  // ── Student name ──
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(179, 90, 40);
  doc.text(student.name || student.usn, cx, divY + 16, { align: 'center' });

  // ── USN ──
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(150, 135, 118);
  doc.text(student.usn, cx, divY + 24, { align: 'center' });

  // ── Message count ──
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(100, 90, 78);
  const msgLabel = messageCount === 1
    ? '1 heartfelt message ♡'
    : `${messageCount} heartfelt messages ♡`;
  doc.text(msgLabel, cx, divY + 35, { align: 'center' });

  // ── Small washi-tape strip at bottom of cover section ──
  drawTape(doc, MARGIN, divY + 44, 30, TAPE_COLORS[0]);
  drawTape(doc, PAGE_W - MARGIN - 30, divY + 44, 30, TAPE_COLORS[2]);

  return divY + 56;
}

/* ─────────────────────────────────────────
   MESSAGES SECTION HEADER
───────────────────────────────────────── */

function drawMessagesHeader(doc, student, y) {
  const cx = PAGE_W / 2;
  const firstName = (student.name || student.usn).split(' ')[0];

  // Pink-blush background strip for header
  doc.setFillColor(251, 228, 228);
  doc.roundedRect(MARGIN - 4, y - 6, CONTENT_W + 8, 22, 3, 3, 'F');

  // Washi tape strips on corners of header
  drawTape(doc, MARGIN - 4, y - 6, 18, TAPE_COLORS[3]);
  drawTape(doc, PAGE_W - MARGIN - 14, y - 6, 18, TAPE_COLORS[1]);

  // Title text: "[Name]'s messages ♡"
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(17);
  doc.setTextColor(190, 80, 90);
  doc.text(`${firstName}'s messages ♡`, cx, y + 6, { align: 'center' });

  // Subtitle
  doc.setFont('times', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(160, 120, 120);
  doc.text('written by (if available)  ·  sealed with love ✉', cx, y + 13, { align: 'center' });

  return y + 28;
}

/* ─────────────────────────────────────────
   MESSAGE CARD (scrapbook note style)
───────────────────────────────────────── */

function drawMessageCard(doc, msg, index, y, usnToName, imageDim) {
  const fill = CARD_FILLS[index % CARD_FILLS.length];
  const tapeColor = TAPE_COLORS[index % TAPE_COLORS.length];
  const altTape = TAPE_COLORS[(index + 2) % TAPE_COLORS.length];

  const cardX = MARGIN;
  const cardW = CONTENT_W;
  const padX = 9;
  const padY = 8;

  // ── Measure content height ──
  doc.setFont('times', 'normal');
  doc.setFontSize(11.5);
  const lines = doc.splitTextToSize(msg.content, cardW - padX * 2 - 2);
  const lineH = 5.8;
  const bodyH = lines.length * lineH;

  // Image sizing
  let imgW = 0, imgH = 0;
  if (msg.imageUrl && imageDim?.height > 0) {
    const ratio = imageDim.width / imageDim.height;
    imgW = Math.min(cardW - padX * 2, 55);
    imgH = imgW / ratio;
    if (imgH > 55) { imgH = 55; imgW = imgH * ratio; }
  }

  const toLineH = 8;       // "To: name" header height
  const attrH = 8;         // attribution line height
  const imgGap = imgH > 0 ? imgH + 6 : 0;
  const totalCardH = padY + toLineH + bodyH + imgGap + attrH + padY + 2;

  // ── Card shadow (offset rect) ──
  doc.setFillColor(210, 200, 190);
  doc.roundedRect(cardX + 1.5, y + 1.5, cardW, totalCardH, 3, 3, 'F');

  // ── Card background ──
  const [r, g, b] = fill;
  doc.setFillColor(r, g, b);
  doc.setDrawColor(r - 20, g - 20, b - 20);
  doc.setLineWidth(0.2);
  doc.roundedRect(cardX, y, cardW, totalCardH, 3, 3, 'FD');

  // ── Washi tape strips at top corners ──
  drawTape(doc, cardX + 4, y - 3, 16, tapeColor);
  drawTape(doc, cardX + cardW - 20, y - 3, 16, altTape);

  // ── "To: [nickname/name]" header ──
  let toLabel = 'you';
  if (!msg.isAnonymous && msg.senderUsn && usnToName[msg.senderUsn]) {
    // We label based on recipient; msg has recipient context if needed
  }
  // The "To:" is addressed to the viewer (student receiving the PDF)
  const recipientFirst = 'you'; // could be student.name if passed in
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(10.5);
  doc.setTextColor(80, 65, 55);
  doc.text(`To: ${recipientFirst} ♡`, cardX + padX, y + padY + 4);

  // Small memory number badge top-right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 140, 120);
  doc.text(`#${index + 1}`, cardX + cardW - padX, y + padY + 4, { align: 'right' });

  // Thin divider below "To:"
  doc.setDrawColor(r - 30, g - 30, b - 30);
  doc.setLineWidth(0.2);
  doc.line(cardX + padX, y + padY + 6, cardX + cardW - padX, y + padY + 6);

  // ── Message body ──
  doc.setFont('times', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(55, 48, 42);
  const textStartY = y + padY + toLineH + 2;
  lines.forEach((line, li) => {
    doc.text(line, cardX + padX, textStartY + li * lineH);
  });

  // ── Polaroid-style image ──
  let afterBodyY = textStartY + bodyH + 4;
  if (msg.imageUrl && imageDim?.height > 0) {
    try {
      // White polaroid frame
      const polPad = 2;
      const polFrameW = imgW + polPad * 2;
      const polFrameH = imgH + polPad * 2 + 6; // extra bottom for polaroid caption space
      const polX = cardX + cardW - padX - polFrameW;
      const polY = textStartY - 2;

      doc.setFillColor(255, 253, 250);
      doc.setDrawColor(210, 200, 190);
      doc.setLineWidth(0.3);
      doc.rect(polX, polY, polFrameW, polFrameH, 'FD');

      const imgData = msg.imageUrl.split(',')[1] || msg.imageUrl;
      const imgFormat = msg.imageUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(imgData, imgFormat, polX + polPad, polY + polPad, imgW, imgH);
    } catch (e) {
      console.error('Failed to add image to PDF:', e);
    }
  }

  // ── Attribution ──
  const attrY = y + totalCardH - padY - 2;
  doc.setFont('times', 'italic');
  doc.setFontSize(9);

  let attribution;
  if (msg.isAnonymous) {
    const stampName = STAMP_LABELS[msg.stamp] || 'Love';
    attribution = `— Sealed with ${stampName}`;
  } else if (msg.senderUsn) {
    const senderName = usnToName[msg.senderUsn];
    attribution = senderName ? `— ${senderName}` : `— ${msg.senderUsn}`;
  } else {
    attribution = '— Anonymous';
  }

  doc.setTextColor(100, 85, 72);
  doc.text(attribution, cardX + padX, attrY);

  // Stamp label right-aligned
  if (msg.stamp) {
    const stampLabel = STAMP_LABELS[msg.stamp] || msg.stamp;
    doc.setFontSize(8);
    doc.setTextColor(200, 155, 50);
    doc.text(stampLabel, cardX + cardW - padX, attrY, { align: 'right' });
  }

  // ── Small decorative heart bottom-right of card ──
  doc.setFontSize(9);
  doc.setTextColor(r - 40, g - 60, b - 40);
  doc.text('♡', cardX + cardW - padX, y + totalCardH - 2, { align: 'right' });

  return y + totalCardH + 10; // gap between cards
}

/* ─────────────────────────────────────────
   CLOSING SECTION
───────────────────────────────────────── */

function drawClosingSection(doc, y) {
  const cx = PAGE_W / 2;

  // Envelope icon — simple drawn envelope
  const envX = cx - 8;
  const envY = y + 12;
  const envW = 16, envH = 11;
  doc.setFillColor(210, 175, 160);
  doc.rect(envX, envY, envW, envH, 'F');
  doc.setDrawColor(185, 145, 130);
  doc.setLineWidth(0.4);
  doc.rect(envX, envY, envW, envH);
  // Envelope flap V
  doc.line(envX, envY, cx, envY + 5);
  doc.line(cx, envY + 5, envX + envW, envY);
  // Wax seal dot
  doc.setFillColor(185, 60, 60);
  doc.circle(cx, envY + 7.5, 2.5, 'F');
  doc.setFont('times', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(240, 210, 200);
  doc.text('♡', cx, envY + 9, { align: 'center' });

  // Closing text
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(100, 88, 74);
  doc.text('Send love. Spread smiles.', cx, envY + envH + 12, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(140, 120, 100);
  doc.text("Make someone's golden hour. ✦", cx, envY + envH + 20, { align: 'center' });

  // Divider
  doc.setDrawColor(212, 168, 67);
  doc.setLineWidth(0.4);
  doc.line(cx - 28, envY + envH + 26, cx + 28, envY + envH + 26);

  // Note section
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(130, 115, 100);
  doc.text('note: ✦', cx, envY + envH + 34, { align: 'center' });
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(150, 132, 112);
  doc.text('be kind · be you · be golden ♡', cx, envY + envH + 41, { align: 'center' });

  // Washi tape strips decorative
  drawTape(doc, MARGIN, envY + envH + 44, 25, TAPE_COLORS[4]);
  drawTape(doc, PAGE_W - MARGIN - 25, envY + envH + 44, 25, TAPE_COLORS[0]);
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */

/**
 * Beautiful scrapbook-style PDF — one per student.
 * Filename: USN.pdf
 */
export async function exportMessagesPDF(student, messages, allStudents = []) {
  const usnToName = {};
  allStudents.forEach(s => { usnToName[s.usn] = s.name || s.usn; });

  // Pre-load image dimensions
  const imageDims = await Promise.all(
    messages.map(msg => msg.imageUrl ? getImageDimensions(msg.imageUrl) : null)
  );

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // ── Page 1: cover ──
  drawPageBg(doc);
  let y = drawCoverSection(doc, student, messages.length);

  if (messages.length === 0) {
    y = checkPageBreak(doc, y, 40);
    doc.setFont('times', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(170, 155, 135);
    doc.text('No messages yet.', PAGE_W / 2, y + 15, { align: 'center' });
    doc.text('But the best memories are yet to come. ♡', PAGE_W / 2, y + 24, { align: 'center' });
    doc.save(`${student.usn}.pdf`);
    return;
  }

  // ── Messages header ──
  y = checkPageBreak(doc, y, 30);
  y = drawMessagesHeader(doc, student, y);

  // ── Message cards ──
  messages.forEach((msg, idx) => {
    // Estimate card height before drawing
    doc.setFont('times', 'normal');
    doc.setFontSize(11.5);
    const lines = doc.splitTextToSize(msg.content, CONTENT_W - 18 - 2);
    const estH = lines.length * 5.8 + 50 + (imageDims[idx] ? 55 : 0);

    y = checkPageBreak(doc, y, estH);
    y = drawMessageCard(doc, msg, idx, y, usnToName, imageDims[idx]);
  });

  // ── Closing ──
  y = checkPageBreak(doc, y, 70);
  drawClosingSection(doc, y);

  doc.save(`${student.usn}.pdf`);
}

/**
 * Bulk export — one PDF per student who has messages.
 */
export async function exportAllMessagesPDF(students, allMessages, onProgress) {
  const byRecipient = {};
  for (const msg of allMessages) {
    const rid = msg.recipient.toString();
    if (!byRecipient[rid]) byRecipient[rid] = [];
    byRecipient[rid].push(msg);
  }

  const targets = students.filter(s => byRecipient[s._id]?.length > 0);

  for (let i = 0; i < targets.length; i++) {
    await exportMessagesPDF(targets[i], byRecipient[targets[i]._id] || [], students);
    onProgress?.(i + 1, targets.length);
    await new Promise(r => setTimeout(r, 350));
  }

  return targets.length;
}

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
 * Draw warm ivory background on the current page
 */
function drawPageBg(doc, pw, ph) {
  doc.setFillColor(253, 251, 247); // #FDFBF7
  doc.rect(0, 0, pw, ph, 'F');
}

/**
 * Draw a subtle decorative border on each page
 */
function drawPageBorder(doc, pw, ph) {
  const m = 12;
  doc.setDrawColor(201, 187, 176); // outline-variant #C9BBB0
  doc.setLineWidth(0.3);
  doc.rect(m, m, pw - m * 2, ph - m * 2);
  // Inner line (double border effect)
  doc.setDrawColor(222, 213, 204);
  doc.setLineWidth(0.15);
  doc.rect(m + 2, m + 2, pw - (m + 2) * 2, ph - (m + 2) * 2);
}

/**
 * Create a beautiful nostalgic cover section
 */
function drawCoverSection(doc, student, messageCount, pw) {
  const cx = pw / 2;

  // Top ornament line
  const ornY = 60;
  doc.setDrawColor(212, 168, 67); // gold #D4A843
  doc.setLineWidth(0.5);
  doc.line(cx - 30, ornY, cx + 30, ornY);
  doc.setLineWidth(0.2);
  doc.line(cx - 20, ornY - 3, cx + 20, ornY - 3);
  doc.line(cx - 20, ornY + 3, cx + 20, ornY + 3);

  // Title: "Golden Hour"
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(42);
  doc.setTextColor(44, 42, 40); // on-background #2C2A28
  doc.text('Golden Hour', cx, ornY + 20, { align: 'center' });

  // Subtitle: Class of 2026
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(92, 85, 73); // on-surface-variant
  doc.text('A digital keepsake for the Class of 2026', cx, ornY + 32, { align: 'center' });

  // Gold divider
  doc.setDrawColor(212, 168, 67);
  doc.setLineWidth(0.4);
  doc.line(cx - 35, ornY + 40, cx + 35, ornY + 40);

  // Student name
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(179, 90, 40); // primary #B35A28
  doc.text(student.name || student.usn, cx, ornY + 58, { align: 'center' });

  // USN
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(138, 126, 116); // outline
  doc.text(student.usn, cx, ornY + 68, { align: 'center' });

  // Message count
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(92, 85, 73);
  const msgLabel = messageCount === 1 ? '1 heartfelt message' : `${messageCount} heartfelt messages`;
  doc.text(msgLabel, cx, ornY + 84, { align: 'center' });

  return ornY + 110; // Return Y position after cover
}

/**
 * Draw a "polaroid" message card with optional sender attribution
 */
function drawMessageCard(doc, msg, index, y, margin, contentW, pw, usnToName) {
  const cardPadding = 8;
  const cardX = margin - 2;
  const cardW = contentW + 4;

  // Message number badge
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(212, 168, 67); // gold
  doc.text(`Memory #${index + 1}`, margin, y);
  y += 5;

  // Message body
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(44, 42, 40); // faded ink
  const lines = doc.splitTextToSize(msg.content, contentW - cardPadding * 2);

  const lineHeight = 6;
  const bodyHeight = lines.length * lineHeight;
  const totalCardHeight = bodyHeight + cardPadding * 2 + 14; // extra for attribution

  // Draw card background
  doc.setFillColor(255, 253, 249); // slightly warmer than page
  doc.setDrawColor(222, 213, 204); // subtle border
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX, y - 2, cardW, totalCardHeight, 2, 2, 'FD');

  // Write text lines
  const textStartY = y + cardPadding;
  lines.forEach((line, li) => {
    doc.text(line, margin + cardPadding, textStartY + li * lineHeight);
  });

  // Attribution line
  const attrY = textStartY + bodyHeight + 6;
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(138, 126, 116); // outline

  let attribution;
  if (msg.isAnonymous) {
    const stampName = STAMP_LABELS[msg.stamp] || 'Love';
    attribution = `— Sealed with ${stampName}`;
  } else if (msg.senderUsn) {
    const senderName = usnToName[msg.senderUsn];
    attribution = senderName ? `— Sent by ${senderName}` : `— Sent by ${msg.senderUsn}`;
  } else {
    attribution = '— Anonymous';
  }

  doc.text(attribution, margin + cardPadding, attrY);

  // Stamp icon name (right-aligned)
  if (msg.stamp) {
    const stampLabel = STAMP_LABELS[msg.stamp] || msg.stamp;
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(212, 168, 67);
    doc.text(stampLabel, pw - margin - cardPadding, attrY, { align: 'right' });
  }

  return y - 2 + totalCardHeight + 8; // return new Y position with gap
}

/**
 * Draw closing section
 */
function drawClosingSection(doc, pw, y) {
  const cx = pw / 2;
  const closingY = y + 30;

  doc.setFont('times', 'italic');
  doc.setFontSize(16);
  doc.setTextColor(92, 85, 73);
  doc.text('These memories are yours to keep.', cx, closingY, { align: 'center' });
  doc.text('Carry them wherever you go.', cx, closingY + 10, { align: 'center' });

  // Gold ornament
  doc.setDrawColor(212, 168, 67);
  doc.setLineWidth(0.4);
  doc.line(cx - 25, closingY + 20, cx + 25, closingY + 20);

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(160, 150, 140);
  doc.text('Golden Hour · Class of 2026', cx, closingY + 30, { align: 'center' });

  return closingY + 50;
}

/**
 * Beautiful nostalgic PDF — continuous one-page design.
 * Filename: USN.pdf
 */
export function exportMessagesPDF(student, messages, allStudents = []) {
  // Build lookup map for sender names
  const usnToName = {};
  allStudents.forEach(s => {
    usnToName[s.usn] = s.name || s.usn;
  });

  const tempDoc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = tempDoc.internal.pageSize.getWidth();
  const margin = 22;
  const contentW = pageW - margin * 2;

  // Calculate total height needed
  let estimatedHeight = 220; // Cover section height roughly
  
  if (messages.length > 0) {
    estimatedHeight += 30; // Header for messages
    messages.forEach(msg => {
      const testLines = tempDoc.splitTextToSize(msg.content, contentW - 16); // card padding
      estimatedHeight += testLines.length * 6 + 30;
    });
  }
  estimatedHeight += 100; // Closing section height roughly

  // Create actual document with custom height to fit everything on one page
  const doc = new jsPDF({ unit: 'mm', format: [pageW, Math.max(297, estimatedHeight)] });
  const pageH = doc.internal.pageSize.getHeight();

  // Background and Border
  drawPageBg(doc, pageW, pageH);
  drawPageBorder(doc, pageW, pageH);

  // Cover
  let y = drawCoverSection(doc, student, messages.length, pageW);

  if (messages.length === 0) {
    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    doc.setTextColor(160, 150, 140);
    doc.text('No messages received yet.', pageW / 2, y + 20, { align: 'center' });
    doc.text('But the best memories are yet to come.', pageW / 2, y + 28, { align: 'center' });
    doc.save(`${student.usn}.pdf`);
    return;
  }

  // Header for messages
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(16);
  doc.setTextColor(179, 90, 40); // primary
  doc.text('Your Messages', margin, y);

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(138, 126, 116);
  doc.text(`for ${student.name || student.usn}`, margin, y + 6);

  // Gold underline
  doc.setDrawColor(212, 168, 67);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 9, margin + 50, y + 9);

  y += 18;

  // Messages
  messages.forEach((msg, idx) => {
    y = drawMessageCard(doc, msg, idx, y, margin, contentW, pageW, usnToName);
  });

  // Closing
  drawClosingSection(doc, pageW, y);

  doc.save(`${student.usn}.pdf`);
}

/**
 * Bulk export — one PDF per student who has messages. Filename = USN.pdf
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
    exportMessagesPDF(targets[i], byRecipient[targets[i]._id] || [], students);
    onProgress?.(i + 1, targets.length);
    await new Promise(r => setTimeout(r, 350));
  }

  return targets.length;
}

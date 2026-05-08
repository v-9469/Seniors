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
 * Get image dimensions from a data URL
 */
function getImageDimensions(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve({ width: 200, height: 150 }); // fallback
    };
    img.src = imageUrl;
  });
}

const PAGE_W = 210; // A4 width in mm
const PAGE_H = 297; // A4 height in mm
const MARGIN = 22;
const CONTENT_W = PAGE_W - MARGIN * 2;

/**
 * Draw warm ivory background on the current page
 */
function drawPageBg(doc) {
  doc.setFillColor(253, 251, 247); // #FDFBF7
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
}

/**
 * Draw a subtle decorative border on each page
 */
function drawPageBorder(doc) {
  const m = 12;
  doc.setDrawColor(201, 187, 176); // outline-variant #C9BBB0
  doc.setLineWidth(0.3);
  doc.rect(m, m, PAGE_W - m * 2, PAGE_H - m * 2);
  // Inner line (double border effect)
  doc.setDrawColor(222, 213, 204);
  doc.setLineWidth(0.15);
  doc.rect(m + 2, m + 2, PAGE_W - (m + 2) * 2, PAGE_H - (m + 2) * 2);
}

/**
 * Add a new page with background and border
 */
function addNewPage(doc) {
  doc.addPage();
  drawPageBg(doc);
  drawPageBorder(doc);
  return MARGIN; // Return starting Y position
}

/**
 * Create a beautiful nostalgic cover section
 */
function drawCoverSection(doc, student, messageCount, pageW) {
  const cx = pageW / 2;

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
function drawMessageCard(doc, msg, index, y, usnToName, imageDim) {
  const cardPadding = 8;
  const cardX = MARGIN - 2;
  const cardW = CONTENT_W + 4;

  // Message number badge
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(212, 168, 67); // gold
  doc.text(`Memory #${index + 1}`, MARGIN, y);
  y += 5;

  // Message body
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(44, 42, 40); // faded ink
  const lines = doc.splitTextToSize(msg.content, CONTENT_W - cardPadding * 2);

  const lineHeight = 6;
  const bodyHeight = lines.length * lineHeight;
  let totalCardHeight = bodyHeight + cardPadding * 2 + 14; // extra for attribution

  // Add image height if present and imageDim available
  let imageHeight = 0;
  if (msg.imageUrl && imageDim) {
    // Calculate display dimensions preserving aspect ratio
    const aspectRatio = imageDim.width / imageDim.height;
    const imgDisplayW = CONTENT_W - cardPadding * 2;
    imageHeight = imgDisplayW / aspectRatio;
    // Limit max height to avoid huge images
    const maxImgHeight = 80; // mm
    if (imageHeight > maxImgHeight) {
      imageHeight = maxImgHeight;
    }
    totalCardHeight += imageHeight + 4; // Add image height + gap
  }

  // Draw card background
  doc.setFillColor(255, 253, 249); // slightly warmer than page
  doc.setDrawColor(222, 213, 204); // subtle border
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX, y - 2, cardW, totalCardHeight, 2, 2, 'FD');

  // Write text lines
  const textStartY = y + cardPadding;
  lines.forEach((line, li) => {
    doc.text(line, MARGIN + cardPadding, textStartY + li * lineHeight);
  });

  // Add image if present
  let currentY = textStartY + bodyHeight + 4;
  if (msg.imageUrl && imageDim) {
    try {
      // Extract base64 data from data URL
      const imgData = msg.imageUrl.split(',')[1] || msg.imageUrl;
      const imgFormat = msg.imageUrl.includes('image/png') ? 'PNG' : 'JPEG';
      // Calculate display width preserving aspect ratio
      const aspectRatio = imageDim.width / imageDim.height;
      const imgDisplayW = CONTENT_W - cardPadding * 2;
      const imgDisplayH = imgDisplayW / aspectRatio;
      // Limit height
      let finalH = imgDisplayH;
      const maxImgHeight = 80;
      if (finalH > maxImgHeight) {
        finalH = maxImgHeight;
      }
      doc.addImage(imgData, imgFormat, MARGIN + cardPadding, currentY, imgDisplayW, finalH);
      currentY += finalH;
    } catch (e) {
      console.error('Failed to add image to PDF:', e);
    }
  }

  // Attribution line
  const attrY = currentY + 6;
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

  doc.text(attribution, MARGIN + cardPadding, attrY);

  // Stamp icon name (right-aligned)
  if (msg.stamp) {
    const stampLabel = STAMP_LABELS[msg.stamp] || msg.stamp;
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(212, 168, 67);
    doc.text(stampLabel, PAGE_W - MARGIN - cardPadding, attrY, { align: 'right' });
  }

  return y - 2 + totalCardHeight + 8; // return new Y position with gap
}

/**
 * Draw closing section
 */
function drawClosingSection(doc, y) {
  const cx = PAGE_W / 2;
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
 * Check if we need a new page, and add one if necessary
 */
function checkPageBreak(doc, y, threshold = 40) {
  if (y + threshold > PAGE_H - MARGIN) {
    return addNewPage(doc);
  }
  return y;
}

/**
 * Beautiful nostalgic PDF — multi-page design with image support.
 * Filename: USN.pdf
 */
export async function exportMessagesPDF(student, messages, allStudents = []) {
  // Build lookup map for sender names
  const usnToName = {};
  allStudents.forEach(s => {
    usnToName[s.usn] = s.name || s.usn;
  });

  // Preload image dimensions
  const imageDims = [];
  const promises = messages.map(async (msg, idx) => {
    if (msg.imageUrl) {
      const dim = await getImageDimensions(msg.imageUrl);
      imageDims[idx] = dim;
    } else {
      imageDims[idx] = null;
    }
  });
  await Promise.all(promises);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // First page setup
  drawPageBg(doc);
  drawPageBorder(doc);

  // Cover
  let y = drawCoverSection(doc, student, messages.length, PAGE_W);

  y = checkPageBreak(doc, y);

  if (messages.length === 0) {
    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    doc.setTextColor(160, 150, 140);
    doc.text('No messages received yet.', PAGE_W / 2, y + 20, { align: 'center' });
    doc.text('But the best memories are yet to come.', PAGE_W / 2, y + 28, { align: 'center' });
    doc.save(`${student.usn}.pdf`);
    return;
  }

  // Header for messages
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(16);
  doc.setTextColor(179, 90, 40); // primary
  doc.text('Your Messages', MARGIN, y);

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(138, 126, 116);
  doc.text(`for ${student.name || student.usn}`, MARGIN, y + 6);

  // Gold underline
  doc.setDrawColor(212, 168, 67);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y + 9, MARGIN + 50, y + 9);

  y += 18;

  // Messages
  messages.forEach((msg, idx) => {
    y = checkPageBreak(doc, y, 60);
    y = drawMessageCard(doc, msg, idx, y, usnToName, imageDims[idx]);
  });

  // Closing
  y = checkPageBreak(doc, y, 50);
  drawClosingSection(doc, y);

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
    await exportMessagesPDF(targets[i], byRecipient[targets[i]._id] || [], students);
    onProgress?.(i + 1, targets.length);
    await new Promise(r => setTimeout(r, 350));
  }

  return targets.length;
}

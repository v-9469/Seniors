import { jsPDF } from 'jspdf';

/**
 * Simple printable PDF — name header, then all messages as plain text.
 * Filename: USN.pdf
 */
export function exportMessagesPDF(student, messages) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;

  let y = margin;

  const addPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkY = (needed) => {
    if (y + needed > pageH - margin) addPage();
  };

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(student.name || student.usn, margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`USN: ${student.usn}   |   ${messages.length} message${messages.length !== 1 ? 's' : ''}`, margin, y);
  y += 5;

  // Divider
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  if (messages.length === 0) {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(11);
    doc.text('No messages received yet.', margin, y);
    doc.save(`${student.usn}.pdf`);
    return;
  }

  // ── Messages ─────────────────────────────────────────────────────────────
  messages.forEach((msg, idx) => {
    // Message number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    checkY(10);
    doc.text(`#${idx + 1}`, margin, y);
    y += 5;

    // Message body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(msg.content, contentW);
    lines.forEach(line => {
      checkY(6);
      doc.text(line, margin, y);
      y += 6;
    });

    y += 6; // gap between messages

    // Thin separator (except last)
    if (idx < messages.length - 1) {
      checkY(4);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 3, pageW - margin, y - 3);
    }
  });

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
    exportMessagesPDF(targets[i], byRecipient[targets[i]._id] || []);
    onProgress?.(i + 1, targets.length);
    await new Promise(r => setTimeout(r, 350));
  }

  return targets.length;
}

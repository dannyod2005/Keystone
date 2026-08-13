const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function main() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const ink = rgb(0.086, 0.137, 0.239);
  const gold = rgb(0.78, 0.6, 0.16);
  const slate = rgb(0.4, 0.44, 0.52);

  page.drawRectangle({
    x: 24, y: 24, width: width - 48, height: height - 48,
    borderColor: gold, borderWidth: 2,
  });

  const centerText = (text, y, font = fontRegular, size = 14, color = ink) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  };

  centerText('CERTIFICATE OF COMPLETION', height - 120, fontBold, 22, ink);
  centerText('This certifies that', height - 180, fontRegular, 14, slate);
  centerText('Alex Chen', height - 220, fontBold, 30, ink);
  centerText('has successfully completed', height - 265, fontRegular, 14, slate);
  centerText('Supply Chain Fundamentals', height - 300, fontBold, 20, gold);
  centerText(`Completed on August 13, 2026`, height - 350, fontRegular, 12, slate);
  centerText('Keystone Learning', height - 80, fontBold, 14, ink);

  const pdfBytes = await pdfDoc.save();
  console.log('SUCCESS, bytes:', pdfBytes.length);
}
main().catch(e => { console.error('FAILED:', e); process.exit(1); });

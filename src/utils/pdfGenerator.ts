import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (
  elementId: string,
  fileName: string,
  options?: {
    scale?: number;
    orientation?: 'portrait' | 'landscape';
    format?: string | number[];
  }
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const scale = options?.scale || 2;
  const orientation = options?.orientation || 'portrait';
  const format = options?.format || 'a4';

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Calculate ratio to fit content within PDF bounds (with small margins if needed)
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

  const finalWidth = imgWidth * ratio;
  const finalHeight = imgHeight * ratio;

  const imgX = (pdfWidth - finalWidth) / 2;
  const imgY = (pdfHeight - finalHeight) / 2;

  pdf.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight);
  pdf.save(`${fileName}.pdf`);
};

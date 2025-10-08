import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Use the local worker file bundled with the extension
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');

/**
 * Extracts all text content from a given PDF file using pdf.js.
 * This is the reliable method.
 * @param {File} file - The PDF file to process.
 * @returns {Promise<string>} A promise that resolves with the extracted text.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF. It may be image-based, corrupted, or password-protected.');
  }
}

/**
 * Extracts text from a file, routing to the correct parser based on file type.
 * @param {File} file - The file (PDF, DOCX, or TXT) to process.
 * @returns {Promise<string>} A promise that resolves with the extracted text.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  } else if (fileName.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      throw new Error('Failed to extract text from DOCX file.');
    }
  } else if (fileName.endsWith('.txt')) {
    return file.text();
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  }
}
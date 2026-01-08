"""
Text Extractor - Extracts text from various document formats
"""

import PyPDF2
import docx
from io import BytesIO
from typing import Optional


class TextExtractor:
    """Extract text from PDF and DOCX files"""

    def extract(self, file_content: bytes, file_type: str) -> Optional[str]:
        """
        Extract text from file

        Args:
            file_content: Raw file bytes
            file_type: MIME type

        Returns:
            Extracted text or None
        """
        if file_type == "application/pdf":
            return self._extract_from_pdf(file_content)
        elif file_type in ["application/msword",
                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            return self._extract_from_docx(file_content)
        else:
            return None

    def _extract_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF"""
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            return ""

    def _extract_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX"""
        try:
            doc = docx.Document(BytesIO(file_content))
            text = "\n".join([para.text for para in doc.paragraphs])
            return text.strip()
        except Exception as e:
            print(f"Error extracting DOCX: {e}")
            return ""


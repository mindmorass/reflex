import type { HookHandler } from '../types/hooks.js';
import { getChromaClient } from '../storage/client.js';
import type { ContentType } from '../storage/collections.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('hooks:file-upload');

interface FileUploadData {
  filePath: string;
  fileName: string;
  mimeType?: string;
  size: number;
  content?: string | Buffer;
}

interface FileProcessResult {
  type: ContentType;
  text: string;
  metadata: Record<string, unknown>;
}

export const fileUploadHook: HookHandler = async (context) => {
  const data = context.data as FileUploadData;

  logger.info('Processing file upload', {
    fileName: data.fileName,
    size: data.size,
    mimeType: data.mimeType,
  });

  // 1. Detect file type
  const fileType = detectFileType(data);
  logger.debug(`Detected file type: ${fileType}`);

  // 2-4. Process based on file type
  let processResult: FileProcessResult | null = null;

  switch (fileType) {
    case 'document':
      processResult = await processDocument(data);
      break;
    case 'code':
      processResult = await processCode(data);
      break;
    case 'data':
      processResult = await processData(data);
      break;
    default:
      logger.warn(`Unsupported file type: ${fileType}`, { fileName: data.fileName });
      return;
  }

  if (!processResult) {
    logger.warn('Failed to process file', { fileName: data.fileName });
    return;
  }

  // 5. Store in ChromaDB and make content available to agents
  const chromaClient = getChromaClient();

  await chromaClient.store(context.projectId, {
    text: processResult.text,
    type: processResult.type,
    source: data.filePath,
    metadata: {
      fileName: data.fileName,
      mimeType: data.mimeType,
      size: data.size,
      uploadedAt: context.timestamp.toISOString(),
      ...processResult.metadata,
    },
  });

  logger.info('File processed and stored', {
    fileName: data.fileName,
    contentType: processResult.type,
  });
};

type FileCategory = 'document' | 'code' | 'data' | 'unknown';

function detectFileType(data: FileUploadData): FileCategory {
  const extension = data.fileName.split('.').pop()?.toLowerCase() || '';
  const mimeType = data.mimeType || '';

  // Document types
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt'];
  const documentMimes = ['application/pdf', 'application/msword', 'text/plain', 'text/markdown'];

  if (documentExtensions.includes(extension) || documentMimes.some((m) => mimeType.includes(m))) {
    return 'document';
  }

  // Code types
  const codeExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'java', 'go', 'rs', 'c', 'cpp', 'h',
    'cs', 'php', 'swift', 'kt', 'scala', 'sh', 'bash', 'yaml', 'yml', 'toml',
    'html', 'css', 'scss', 'less', 'sql', 'graphql', 'proto',
  ];

  if (codeExtensions.includes(extension)) {
    return 'code';
  }

  // Data types
  const dataExtensions = ['json', 'csv', 'xml', 'parquet', 'avro', 'jsonl', 'ndjson'];
  const dataMimes = ['application/json', 'text/csv', 'application/xml'];

  if (dataExtensions.includes(extension) || dataMimes.some((m) => mimeType.includes(m))) {
    return 'data';
  }

  return 'unknown';
}

async function processDocument(data: FileUploadData): Promise<FileProcessResult | null> {
  // For documents, we extract text content
  // In a full implementation, this would use markitdown MCP server
  // or other document processing libraries

  if (!data.content) {
    logger.warn('No content provided for document');
    return null;
  }

  const text = typeof data.content === 'string'
    ? data.content
    : data.content.toString('utf-8');

  return {
    type: 'document',
    text,
    metadata: {
      documentType: data.fileName.split('.').pop(),
    },
  };
}

async function processCode(data: FileUploadData): Promise<FileProcessResult | null> {
  // For code files, we extract the content and could parse symbols
  // In a full implementation, this would parse and index symbols

  if (!data.content) {
    logger.warn('No content provided for code file');
    return null;
  }

  const text = typeof data.content === 'string'
    ? data.content
    : data.content.toString('utf-8');

  const extension = data.fileName.split('.').pop() || 'unknown';

  return {
    type: 'code',
    text,
    metadata: {
      language: extension,
      lineCount: text.split('\n').length,
    },
  };
}

async function processData(data: FileUploadData): Promise<FileProcessResult | null> {
  // For data files, we parse schema and sample content

  if (!data.content) {
    logger.warn('No content provided for data file');
    return null;
  }

  const text = typeof data.content === 'string'
    ? data.content
    : data.content.toString('utf-8');

  const extension = data.fileName.split('.').pop() || 'unknown';

  let schema: Record<string, unknown> = {};

  if (extension === 'json' || extension === 'jsonl') {
    try {
      const parsed = JSON.parse(text.split('\n')[0]);
      schema = { fields: Object.keys(parsed) };
    } catch {
      // Ignore parse errors for schema detection
    }
  } else if (extension === 'csv') {
    const firstLine = text.split('\n')[0];
    schema = { columns: firstLine.split(',').map((c) => c.trim()) };
  }

  return {
    type: 'document', // Store as document for searchability
    text: text.length > 10000 ? text.substring(0, 10000) + '...' : text,
    metadata: {
      dataFormat: extension,
      schema,
      truncated: text.length > 10000,
    },
  };
}

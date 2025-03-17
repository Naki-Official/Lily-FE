export class APIError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    return { error: error.message, statusCode: error.statusCode };
  }
  
  return { error: 'An unexpected error occurred', statusCode: 500 };
} 
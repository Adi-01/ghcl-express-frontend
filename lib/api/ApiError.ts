export class ApiError extends Error {
  statusCode: number;
  code?: string;
  type?: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    type?: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.type = type;
    this.details = details;
  }
}


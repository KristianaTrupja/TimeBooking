import { NextRequest, NextResponse } from 'next/server';

type RouteHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    if (process.env.NODE_ENV !== 'development') {
      return handler(request, context);
    }

    const start = Date.now();
    
    // Execute the route handler
    const response = await handler(request, context);

    // If want to DISABLE withLogging, enable the next line
    // return response
    
    const duration = Date.now() - start;
    const timestamp = new Date().toLocaleString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit',
      second:'2-digit',
      hour12: false
    }).replace(',', '');
    
    // ANSI color codes
    const colors = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      red: '\x1b[31m',
      orange: '\x1b[33m',
      purple: '\x1b[35m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m'
    };
    
    // Color for HTTP method
    let methodColor = colors.gray;
    switch (request.method) {
      case 'GET':
        methodColor = colors.green;
        break;
      case 'POST':
        methodColor = colors.purple;
        break;
      case 'PUT':
      case 'PATCH':
        methodColor = colors.orange;
        break;
      case 'DELETE':
        methodColor = colors.red;
        break;
    }
    
    // Color for status code (now we have the ACTUAL status)
    let statusColor = colors.gray;
    if (response.status >= 200 && response.status < 300) {
      statusColor = colors.green;
    } else if (response.status >= 300 && response.status < 400) {
      statusColor = colors.orange;
    } else if (response.status >= 400 && response.status < 500) {
      statusColor = colors.red;
    } else if (response.status >= 500) {
      statusColor = colors.red;
    }
    
    console.log(
      `${colors.gray}[${timestamp}]${colors.reset} ` +
      `${methodColor}${request.method}${colors.reset} ` +
      `${request.nextUrl.pathname} ` +
      `${statusColor}${response.status}${colors.reset} ` +
      `${colors.gray}in ${duration}ms${colors.reset}`
    );
    
    return response;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
}

export class ResponseMapper {
  public static success<T>(
    data: T,
    correlationId?: string,
  ): {
    success: true;
    data: T;
    correlationId?: string;
    timestamp: string;
  } {
    const response = {
      success: true as const,
      data,
      timestamp: new Date().toISOString(),
    };

    if (correlationId) {
      return { ...response, correlationId };
    }

    return response;
  }

  public static error(
    message: string,
    correlationId?: string,
    details?: unknown,
  ): {
    success: false;
    error: string;
    details?: unknown;
    correlationId?: string;
    timestamp: string;
  } {
    const response = {
      success: false as const,
      error: message,
      timestamp: new Date().toISOString(),
    };

    if (details !== undefined) {
      Object.assign(response, { details });
    }

    if (correlationId) {
      Object.assign(response, { correlationId });
    }

    return response;
  }

  public static paginated<T>(
    data: T[],
    pagination: PaginationInfo,
    correlationId?: string,
  ): {
    success: true;
    data: {
      items: T[];
      pagination: PaginationInfo & { totalPages: number };
    };
    correlationId?: string;
    timestamp: string;
  } {
    return this.success(
      {
        items: data,
        pagination: {
          ...pagination,
          totalPages: Math.ceil(pagination.total / pagination.limit),
        },
      },
      correlationId,
    );
  }
}

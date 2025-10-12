export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
  }
}

export class InvalidEntityError extends Error {
  constructor(message = 'Invalid entity') {
    super(message)
  }
}

export class BadRequestError extends Error {
  constructor(message = 'Bad request') {
    super(message)
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
  }
}

/**
 * 致命错误，需要进程直接退出
 */
export class FatalError extends Error {
  constructor(message = 'Fatal') {
    super(message)
  }
}

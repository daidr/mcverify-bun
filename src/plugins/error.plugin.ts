import { Elysia, status } from 'elysia'
import { BadRequestError, ForbiddenError, InvalidEntityError, UnauthorizedError } from '@/shared/error-center.interface'

export const ErrorHandler = new Elysia({ name: 'ErrorHandler' })
  .error({
    UnauthorizedError,
    ForbiddenError,
    InvalidEntityError,
    BadRequestError,
  })
  .onError(({ code, error: err }) => {
    switch (code) {
      case 'VALIDATION':
        return status(
          400,
          {
            msg: 'Params validation failed',
            key: 'error.validation_failed',
            extra: err.message,
          },
        )

      case 'NOT_FOUND':
        return status(
          404,
          {
            msg: 'Not found',
            key: 'error.not_found',
            extra: err.message,
          },
        )

      case 'UnauthorizedError':
        return status(
          401,
          {
            msg: err.message,
            key: 'error.unauthorized',
          },
        )

      case 'InvalidEntityError':
        return status(
          400,
          {
            msg: err.message,
            key: 'error.invalid_entity',
          },
        )

      case 'ForbiddenError':
        return status(
          403,
          {
            msg: err.message,
            key: 'error.forbidden',
          },
        )

      case 'BadRequestError':
        return status(
          400,
          {
            msg: err.message,
            key: 'error.bad_request',
          },
        )
    }

    return status(
      500,
      {
        msg: err.toString(),
        extra: err,
        key: 'error.unknown',
      },
    )
  })
  .as('global')

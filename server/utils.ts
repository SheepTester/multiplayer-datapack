import * as express from 'express'

export function asyncHandler (
  handler: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => Promise<void>,
): express.RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}

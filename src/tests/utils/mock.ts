import type { Request, Response } from "express";

export const generateMocks = () => {
  const mockRequest = {
    session: {
      csrfToken: undefined,
    },
    method: "POST",
    headers: {},
    body: {},
  } as unknown as Request;
  const mockResponse = {} as unknown as Response;
  return {
    mockRequest,
    mockResponse,
  };
};

export const next = (err: any) => {
  if (err) throw err;
};

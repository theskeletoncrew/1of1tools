export class OneofOneToolsAPIError extends Error {
  response: Response;
  result: any;

  constructor(response: Response, result: any) {
    if (result.message) {
      super(result.message);
    } else {
      super(response.statusText);
    }
    this.name = "OneofOneToolsAPIError";
    this.response = response;
    this.result = result;
  }

  isAuthenticationFailure(): boolean {
    return this.response.status == 403;
  }
}

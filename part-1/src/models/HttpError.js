export default class HttpError extends Error{
    _statusCode;

    constructor(errorMessage, statusCode){
        super(errorMessage);

        statusCode ? this._statusCode = statusCode : this._statusCode = 500;
    }

    getErrorCode = () => this._statusCode;
}
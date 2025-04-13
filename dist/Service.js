"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const MaintenanceException_1 = __importDefault(require("./exception/MaintenanceException"));
const ForbiddenException_1 = __importDefault(require("./exception/ForbiddenException"));
const AuthException_1 = __importDefault(require("./exception/AuthException"));
const InputErrorException_1 = __importDefault(require("./exception/InputErrorException"));
const api_interface_type_1 = require("api-interface-type");
class Service {
    get Method() { return this.method; }
    get Endpoint() { return this.endpoint; }
    get ApiCode() { return this.apiCode; }
    get Summary() { return `${this.ApiCode !== '' ? this.apiCode + ': ' : ''}${this.summary}`; }
    get ApiUserAvailable() { return this.apiUserAvailable; }
    get AuthToken() { var _a; return (_a = this.request.Authorization) !== null && _a !== void 0 ? _a : ''; }
    constructor(response) {
        this.method = 'GET';
        this.endpoint = '';
        this.apiCode = '';
        this.summary = '';
        this.apiUserAvailable = '';
        this.request = new api_interface_type_1.RequestType();
        this.response = new api_interface_type_1.ResponseType();
        this.isTest = process.env.NODE_ENV === 'test';
        this.isExecuteRollback = false;
        this.pool = this.setPool();
        this.res = response;
    }
    inintialize(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.request.setRequest(request);
            yield this.checkMaintenance();
            this.pool.query(`SET TIME ZONE '${(_a = process.env.TZ) !== null && _a !== void 0 ? _a : 'Asia/Tokyo'}';`);
            yield this.middleware();
        });
    }
    setPool() {
        return new pg_1.Pool({
            user: this.isTest ? process.env.TEST_DB_USER : process.env.DB_USER,
            host: this.isTest ? process.env.TEST_DB_HOST : process.env.DB_HOST,
            database: this.isTest ? process.env.TEST_DB_DATABASE : process.env.DB_DATABASE,
            password: this.isTest ? process.env.TEST_DB_PASSWORD : process.env.DB_PASSWORD,
            port: this.isTest ? Number(process.env.TEST_DB_PORT) : Number(process.env.DB_PORT),
            ssl: (this.isTest ? process.env.TEST_DB_IS_SSL : process.env.DB_IS_SSL) === 'true' ? {
                rejectUnauthorized: false
            } : false
        });
    }
    checkMaintenance() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    middleware() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    outputErrorLog(ex) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    resSuccess() {
        this.res.status(200).json(this.response.ResponseData);
    }
    handleException(ex) {
        // To avoid slowing down the response, make this asynchronous
        this.outputErrorLog(ex).catch((ex) => {
            console.error(ex);
        });
        if (ex instanceof AuthException_1.default) {
            this.res.status(401).json({
                message: "Authentication expired. Please login again."
            });
            return;
        }
        else if (ex instanceof ForbiddenException_1.default) {
            this.res.status(403).json({
                message: 'Forbidden error'
            });
            return;
        }
        else if (ex instanceof InputErrorException_1.default) {
            this.res.status(400).json({
                errorCode: `${this.apiCode}-${ex.ErrorId}`,
                errorMessage: ex.message
            });
            return;
        }
        else if (ex instanceof MaintenanceException_1.default) {
            this.res.status(503).json({
                errorMessage: ex.message
            });
            return;
        }
        this.res.status(500).json({
            message: 'Internal server error'
        });
        return;
    }
    get Pool() { return this.pool; }
    get Client() {
        if (this.client === undefined) {
            throw new Error("Please call this after using the startConnect method.");
        }
        return this.client;
    }
    startConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client = yield this.pool.connect();
            yield this.Client.query('BEGIN');
            this.isExecuteRollback = true;
        });
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.Client.query('COMMIT');
            this.isExecuteRollback = false;
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isExecuteRollback) {
                yield this.Client.query('ROLLBACK');
            }
            this.isExecuteRollback = false;
        });
    }
    release() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.rollback();
            if (this.client !== undefined) {
                yield this.client.release();
            }
            if (this.isTest) {
                // In tests, the connection is terminated because it is shut down every time
                yield this.pool.end();
            }
        });
    }
}
exports.default = Service;

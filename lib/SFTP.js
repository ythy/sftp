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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var path = require("path");
var fs = require("fs");
var SftpClient = require("ssh2-sftp-client");
var fileUtils_1 = require("./fileUtils");
var tools_1 = require("./tools");
var FTPUtils = /** @class */ (function () {
    function FTPUtils() {
    }
    FTPUtils.prototype.connect = function (host, user, password) {
        var _this = this;
        this.client = new SftpClient();
        return new Promise(function (resovle) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.connect({
                            host: host,
                            port: 22,
                            username: user,
                            password: password
                        })];
                    case 1:
                        _a.sent();
                        resovle(1);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    FTPUtils.prototype.upload = function (fileList, localEntry, remoteEntry) {
        var _this = this;
        return new Promise(function (resovle) { return __awaiter(_this, void 0, void 0, function () {
            var _i, fileList_1, uploadFile, localFile, remoteFile, status_1, result, remoteDir, existInRemote, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, fileList_1 = fileList;
                        _a.label = 1;
                    case 1:
                        if (!(_i < fileList_1.length)) return [3 /*break*/, 10];
                        uploadFile = fileList_1[_i];
                        localFile = path.join(localEntry, uploadFile);
                        remoteFile = remoteEntry + uploadFile;
                        return [4 /*yield*/, (0, fileUtils_1.stat)(localFile)];
                    case 2:
                        status_1 = _a.sent();
                        if (!status_1.isDirectory()) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.client
                                .uploadDir(localFile, remoteFile)["catch"](function (err) {
                                (0, tools_1.log)("upload dir error: " + err, "red");
                            })];
                    case 3:
                        result = _a.sent();
                        if (result) {
                            (0, tools_1.log)("upload dir success: " + remoteFile, "green");
                        }
                        return [3 /*break*/, 9];
                    case 4:
                        remoteDir = path.dirname(remoteFile);
                        return [4 /*yield*/, this.client.exists(remoteDir)];
                    case 5:
                        existInRemote = _a.sent();
                        if (!!existInRemote) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.client.mkdir(remoteDir, true)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [4 /*yield*/, this.client
                            .put(localFile, remoteFile)["catch"](function (err) {
                            (0, tools_1.log)("upload file error: " + err, "red");
                        })];
                    case 8:
                        result = _a.sent();
                        if (result) {
                            (0, tools_1.log)("upload file success: " + remoteFile, "green");
                        }
                        _a.label = 9;
                    case 9:
                        _i++;
                        return [3 /*break*/, 1];
                    case 10:
                        resovle(1);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    FTPUtils.prototype.download = function (fileList, localEntry, remoteEntry) {
        var _this = this;
        return new Promise(function (resovle) { return __awaiter(_this, void 0, void 0, function () {
            var _i, fileList_2, uploadFile, remoteFile, localFile, writeStream, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, fileList_2 = fileList;
                        _a.label = 1;
                    case 1:
                        if (!(_i < fileList_2.length)) return [3 /*break*/, 5];
                        uploadFile = fileList_2[_i];
                        remoteFile = remoteEntry + uploadFile;
                        localFile = path.join(localEntry, uploadFile);
                        return [4 /*yield*/, (0, fileUtils_1.mkdir)(path.dirname(localFile))];
                    case 2:
                        _a.sent();
                        writeStream = fs.createWriteStream(localFile);
                        return [4 /*yield*/, this.client
                                .get(remoteFile, writeStream)["catch"](function (err) {
                                (0, tools_1.log)("download error: " + err, "red");
                            })];
                    case 3:
                        result = _a.sent();
                        if (result) {
                            (0, tools_1.log)("download success: " + remoteFile, "green");
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5:
                        resovle(1);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    FTPUtils.prototype.disconnect = function () {
        var _this = this;
        return new Promise(function (resovle) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.end()];
                    case 1:
                        _a.sent();
                        resovle(1);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    return FTPUtils;
}());
exports["default"] = FTPUtils;

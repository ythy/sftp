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
exports.upload = void 0;
var path = require("path");
var fileUtils_1 = require("./lib/fileUtils");
var SftpClient = require("ssh2-sftp-client");
var _baseDir = process.cwd();
var CONFIG_FILE = "config.json";
var _config = {}; //必备参数
var _ftp = {}; //必备参数
function upload(outerFiles) {
    return __awaiter(this, void 0, void 0, function () {
        var fileList, clientNode, _i, fileList_1, uploadFile, localFile, remoteFile, status_1, result, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!outerFiles) {
                        log("error in read file list", "red");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, loadConfig(CONFIG_FILE)];
                case 1:
                    _config = _a.sent();
                    return [4 /*yield*/, loadAbsoluteConfig(_config.ftp_store)];
                case 2:
                    _ftp = _a.sent();
                    fileList = outerFiles.split(",");
                    //开始上传
                    log("start upload files to 45", "yellow");
                    clientNode = new SftpClient();
                    return [4 /*yield*/, clientNode.connect({
                            host: _ftp.ftp_host_test,
                            port: 22,
                            username: _ftp.ftp_user_test,
                            password: _ftp.ftp_pw_test
                        })];
                case 3:
                    _a.sent();
                    _i = 0, fileList_1 = fileList;
                    _a.label = 4;
                case 4:
                    if (!(_i < fileList_1.length)) return [3 /*break*/, 10];
                    uploadFile = fileList_1[_i];
                    localFile = path.join(_config.entry, uploadFile);
                    remoteFile = _config.remote_entry + uploadFile;
                    return [4 /*yield*/, (0, fileUtils_1.stat)(localFile)];
                case 5:
                    status_1 = _a.sent();
                    if (!status_1.isDirectory()) return [3 /*break*/, 7];
                    return [4 /*yield*/, clientNode
                            .uploadDir(localFile, remoteFile)["catch"](function (err) {
                            log("upload dir error: " + err, "red");
                        })];
                case 6:
                    result = _a.sent();
                    if (result) {
                        log("upload dir success: " + remoteFile, "green");
                    }
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, clientNode
                        .put(localFile, remoteFile)["catch"](function (err) {
                        log("upload file error: " + err, "red");
                    })];
                case 8:
                    result = _a.sent();
                    if (result) {
                        log("upload file success: " + remoteFile, "green");
                    }
                    _a.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 4];
                case 10:
                    log("end upload files to 45", "yellow");
                    clientNode.end();
                    return [2 /*return*/];
            }
        });
    });
}
exports.upload = upload;
function log(info, color) {
    if (color === void 0) { color = "normal"; }
    if (color === "normal") {
        console.log(info);
    }
    else if (color === "red") {
        console.log("\x1b[31m%s\x1b[0m", info);
    }
    else if (color === "green") {
        console.log("\x1b[32m%s\x1b[0m", info);
    }
    else if (color === "yellow") {
        console.log("\x1b[33m%s\x1b[0m", info);
    }
    else if (color === "blue") {
        console.log("\x1b[34m%s\x1b[0m", info);
    }
    else if (color === "cyan") {
        console.log("\x1b[36m%s\x1b[0m", info);
    }
}
function loadConfig(file) {
    if (file === void 0) { file = CONFIG_FILE; }
    return (0, fileUtils_1.readJsonFile)(path.resolve(_baseDir, file));
}
function loadAbsoluteConfig(paths) {
    return (0, fileUtils_1.readJsonFile)(paths);
}

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
exports.copyCompileFiles = exports.idc = exports.upload = void 0;
var path = require("path");
var fileUtils_1 = require("./lib/fileUtils");
var SFTP_1 = require("./lib/SFTP");
var tools_1 = require("./lib/tools");
var DBUtils_1 = require("./lib/DBUtils");
var _baseDir = process.cwd();
var CONFIG_FILE = "config_main.json";
var _config = {}; //必备参数
var _ftp = {}; //必备参数
function upload(type, version) {
    return __awaiter(this, void 0, void 0, function () {
        var paths, fileList, sftp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, fileUtils_1.readJsonFile)(path.resolve(_baseDir, CONFIG_FILE))];
                case 1:
                    _config = _a.sent();
                    return [4 /*yield*/, (0, fileUtils_1.readJsonFile)(_config.ftp_store)];
                case 2:
                    _ftp = _a.sent();
                    paths = _config[type];
                    fileList = [paths[1], "static/".concat(type, "/").concat(version, "/")];
                    //开始上传
                    (0, tools_1.log)("start upload files to 45", "yellow");
                    sftp = new SFTP_1["default"]();
                    return [4 /*yield*/, sftp.connect(_ftp.ftp_host_test, _ftp.ftp_user_test, _ftp.ftp_pw_test)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, sftp.upload(fileList, path.join(_config.compileEntry, paths[0]), _config.remote_entry)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, sftp.disconnect()];
                case 5:
                    _a.sent();
                    (0, tools_1.log)("end upload files to 45", "yellow");
                    return [2 /*return*/];
            }
        });
    });
}
exports.upload = upload;
function idc(type, version) {
    return __awaiter(this, void 0, void 0, function () {
        var paths, fileList, backupEntry, node1Backup, node1Upload, node2Upload;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, fileUtils_1.readJsonFile)(path.resolve(_baseDir, CONFIG_FILE))];
                case 1:
                    _config = _a.sent();
                    return [4 /*yield*/, (0, fileUtils_1.readJsonFile)(_config.ftp_store)];
                case 2:
                    _ftp = _a.sent();
                    paths = _config[type];
                    fileList = [paths[1], "static/".concat(type, "/").concat(version, "/")];
                    backupEntry = path.join(_config.backup_entry, type, (0, tools_1.dateFormat)(new Date().getTime()).replace(/[:\/\s]/g, "-"));
                    //开始备份
                    (0, tools_1.log)("start backup file from idc", "yellow");
                    node1Backup = new SFTP_1["default"]();
                    return [4 /*yield*/, node1Backup.connect(_ftp.ftp_host_idc_node1, _ftp.ftp_user_idc_node1, _ftp.ftp_pw_idc_node1)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, node1Backup.download([paths[1]], backupEntry, _config.remote_idc_entry)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, node1Backup.disconnect()];
                case 5:
                    _a.sent();
                    (0, tools_1.log)("end backup files from idc", "yellow");
                    //备份结束
                    //开始上传node1
                    (0, tools_1.log)("start upload files to Node1", "yellow");
                    node1Upload = new SFTP_1["default"]();
                    return [4 /*yield*/, node1Upload.connect(_ftp.ftp_host_idc_node1, _ftp.ftp_user_idc_node1, _ftp.ftp_pw_idc_node1)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, node1Upload.upload(fileList, path.join(_config.compileEntry, paths[0]), _config.remote_idc_entry)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, node1Upload.disconnect()];
                case 8:
                    _a.sent();
                    (0, tools_1.log)("end upload files to Node1", "yellow");
                    //上传结束
                    //开始上传node2
                    (0, tools_1.log)("start upload files to Node2", "yellow");
                    node2Upload = new SFTP_1["default"]();
                    return [4 /*yield*/, node2Upload.connect(_ftp.ftp_host_idc_node2, _ftp.ftp_user_idc_node2, _ftp.ftp_pw_idc_node2)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, node2Upload.upload(fileList, path.join(_config.compileEntry, paths[0]), _config.remote_idc_entry)];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, node2Upload.disconnect()];
                case 11:
                    _a.sent();
                    (0, tools_1.log)("end upload files to Node2", "yellow");
                    return [2 /*return*/];
            }
        });
    });
}
exports.idc = idc;
function copyCompileFiles(type, version) {
    return __awaiter(this, void 0, void 0, function () {
        var dbUtils;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, fileUtils_1.readJsonFile)(path.resolve(_baseDir, CONFIG_FILE))];
                case 1:
                    _config = _a.sent();
                    dbUtils = new DBUtils_1["default"](_config);
                    dbUtils.getJtracByVersionAndType(version, type).then(function (jtracFiles) { return __awaiter(_this, void 0, void 0, function () {
                        var _i, jtracFiles_1, jtrac, filelist, _loop_1, _a, filelist_1, file;
                        var _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    dbUtils.close();
                                    if (!(jtracFiles === null || jtracFiles === void 0 ? void 0 : jtracFiles.length) || (jtracFiles === null || jtracFiles === void 0 ? void 0 : jtracFiles.length) === 0) {
                                        console.log("error in search");
                                        return [2 /*return*/];
                                    }
                                    _i = 0, jtracFiles_1 = jtracFiles;
                                    _c.label = 1;
                                case 1:
                                    if (!(_i < jtracFiles_1.length)) return [3 /*break*/, 6];
                                    jtrac = jtracFiles_1[_i];
                                    console.log("start copy jtrac: ".concat(jtrac.jtrac_no));
                                    filelist = (_b = jtrac.file_list) === null || _b === void 0 ? void 0 : _b.split(",");
                                    _loop_1 = function (file) {
                                        var result;
                                        return __generator(this, function (_d) {
                                            switch (_d.label) {
                                                case 0: return [4 /*yield*/, (0, fileUtils_1.copy)(file, _config.entry, _config.compileEntry)["catch"](function (error) {
                                                        console.log("error in copy ".concat(file, ": "), error);
                                                        throw error;
                                                    })];
                                                case 1:
                                                    result = _d.sent();
                                                    if (result) {
                                                        console.log("copied: ", file);
                                                    }
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _a = 0, filelist_1 = filelist;
                                    _c.label = 2;
                                case 2:
                                    if (!(_a < filelist_1.length)) return [3 /*break*/, 5];
                                    file = filelist_1[_a];
                                    return [5 /*yield**/, _loop_1(file)];
                                case 3:
                                    _c.sent();
                                    _c.label = 4;
                                case 4:
                                    _a++;
                                    return [3 /*break*/, 2];
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
exports.copyCompileFiles = copyCompileFiles;

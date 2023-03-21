import * as fs from "fs";
import * as path from "path";
import { Dirent } from "fs";
import {
  readJsonFile,
  readdir,
  stat,
  getFileExtension,
  copy,
  mkdir,
  readTxtFile,
} from "./lib/fileUtils";
const SftpClient = require("ssh2-sftp-client");

interface IConfig {
  entry: string; //项目路径
  remote_entry: string; //ftp 目录路径
  ftp_store: string; //ftp配置文件
}

interface IFTP {
  ftp_host_test: string;
  ftp_user_test: string;
  ftp_pw_test: string;
  ftp_host_idc_node1: string;
  ftp_user_idc_node1: string;
  ftp_pw_idc_node1: string;
  ftp_host_idc_node2: string;
  ftp_user_idc_node2: string;
  ftp_pw_idc_node2: string;
}

interface IFile {
  name: string;
  size: number;
  date: number;
}

const _baseDir = process.cwd();
const CONFIG_FILE = "config.json";
let _config = {} as IConfig; //必备参数
let _ftp = {} as IFTP; //必备参数

export async function upload(outerFiles: string) {
  if (!outerFiles) {
    log("error in read file list", "red");
    return;
  }
  _config = await loadConfig<IConfig>(CONFIG_FILE);
  _ftp = await loadAbsoluteConfig(_config.ftp_store);
  const fileList = outerFiles.split(",");

  //开始上传
  log("start upload files to 45", "yellow");
  const clientNode = new SftpClient();
  await clientNode.connect({
    host: _ftp.ftp_host_test,
    port: 22,
    username: _ftp.ftp_user_test,
    password: _ftp.ftp_pw_test,
  });

  for (const uploadFile of fileList) {
    const localFile = path.join(_config.entry, uploadFile);
    const remoteFile = _config.remote_entry + uploadFile;
    const status = await stat(localFile);
    if (status.isDirectory()) {
      const result = await clientNode
        .uploadDir(localFile, remoteFile)
        .catch((err: any) => {
          log("upload dir error: " + err, "red");
        });
      if (result) {
        log("upload dir success: " + remoteFile, "green");
      }
    } else {
      const result = await clientNode
        .put(localFile, remoteFile)
        .catch((err: any) => {
          log("upload file error: " + err, "red");
        });
      if (result) {
        log("upload file success: " + remoteFile, "green");
      }
    }
  }
  log("end upload files to 45", "yellow");
  clientNode.end();
  //上传结束
}

function log(
  info: string,
  color: "green" | "red" | "yellow" | "blue" | "cyan" | "normal" = "normal"
) {
  if (color === "normal") {
    console.log(info);
  } else if (color === "red") {
    console.log("\x1b[31m%s\x1b[0m", info);
  } else if (color === "green") {
    console.log("\x1b[32m%s\x1b[0m", info);
  } else if (color === "yellow") {
    console.log("\x1b[33m%s\x1b[0m", info);
  } else if (color === "blue") {
    console.log("\x1b[34m%s\x1b[0m", info);
  } else if (color === "cyan") {
    console.log("\x1b[36m%s\x1b[0m", info);
  }
}

function loadConfig<T = IConfig>(file = CONFIG_FILE) {
  return readJsonFile<T>(path.resolve(_baseDir, file));
}

function loadAbsoluteConfig<T = IFTP>(paths) {
  return readJsonFile<T>(paths);
}

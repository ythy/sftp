import * as fs from "fs";
import * as path from "path";
import { readJsonFile, stat } from "./lib/fileUtils";
const SftpClient = require("ssh2-sftp-client");

interface IConfig {
  entry: string; //项目路径
  ftp_host: string;
  ftp_user: string;
  ftp_pw: string;
  remote_entry: string; //ftp 目录路径
  buyer: string[];
  supplier: string[];
  gerp: string[];
  buyerExp: string[];
  buyerMenu: string[];
  buyerExpMenu: string[];
  supplierMenu: string[];
}

interface IFile {
  name: string;
  size: number;
  date: number;
}

const _baseDir = process.cwd();
const CONFIG_FILE = "config_main.json";
let _config = {} as IConfig; //必备参数

export async function upload(type: string, version: string) {
  _config = await loadConfig<IConfig>(CONFIG_FILE);
  const paths = _config[type] as string[];
  const dist = path.join(_config.entry, paths[0]);
  const fileList = [paths[1], `static/${type}/${version}/`];

  //开始上传
  log("start upload files to 45", "yellow");
  const clientNode = new SftpClient();
  await clientNode.connect({
    host: _config.ftp_host,
    port: 22,
    username: _config.ftp_user,
    password: _config.ftp_pw,
  });

  for (const uploadFile of fileList) {
    const localFile = path.join(dist, uploadFile);
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
/**
 * 用于Supplier_Vue项目上传测试系统，过程自动
 * @Author maoxin
 *
 */
import * as path from "path";
import { readJsonFile } from "./lib/fileUtils";
import type { IFTPConfig } from "./lib/type";
import { log, dateFormat } from "./lib/tools";
import SFTP from "./lib/SFTP";

interface IConfig {
  entry: string; //项目路径
  remote_entry: string; //ftp 目录路径
  ftp_store: string; //ftp配置文件
  backup_entry: string; //备份入口 绝对路径
  idc_local_entry: string; //IDC 本地路径入口 绝对路径
  remote_idc_entry: string;
}

const _baseDir = process.cwd();
const CONFIG_FILE = "config.json";
let _config = {} as IConfig; //必备参数
let _ftp = {} as IFTPConfig; //必备参数

export async function upload(outerFiles: string) {
  if (!outerFiles) {
    log("error in read file list", "red");
    return;
  }
  _config = await readJsonFile<IConfig>(path.resolve(_baseDir, CONFIG_FILE));
  _ftp = await readJsonFile<IFTPConfig>(_config.ftp_store);
  const fileList = outerFiles.split(",");

  //开始上传
  log("start upload files to 45", "yellow");
  const sftp = new SFTP();
  await sftp.connect(_ftp.ftp_host_test, _ftp.ftp_user_test, _ftp.ftp_pw_test);
  await sftp.upload(fileList, _config.entry, _config.remote_entry);
  await sftp.disconnect();
  log("end upload files to 45", "yellow");
  //上传结束
}

export async function idc(outerFiles: string) {
  if (!outerFiles) {
    log("error in read file list", "red");
    return;
  }
  _config = await readJsonFile<IConfig>(path.resolve(_baseDir, CONFIG_FILE));
  _ftp = await readJsonFile<IFTPConfig>(_config.ftp_store);
  const fileList = outerFiles.split(",");

  const backupEntry = path.join(
    _config.backup_entry,
    dateFormat(new Date().getTime()).replace(/[:\/\s]/g, "-")
  );

  //开始备份
  log("start backup file from idc", "yellow");
  const node1Backup = new SFTP();
  await node1Backup.connect(
    _ftp.ftp_host_idc_node1,
    _ftp.ftp_user_idc_node1,
    _ftp.ftp_pw_idc_node1
  );
  await node1Backup.download(
    ["index.html"],
    backupEntry,
    _config.remote_idc_entry
  );
  await node1Backup.disconnect();
  log("end backup files from idc", "yellow");
  //备份结束

  //开始上传node1
  log("start upload files to Node1", "yellow");
  const node1Upload = new SFTP();
  await node1Upload.connect(
    _ftp.ftp_host_idc_node1,
    _ftp.ftp_user_idc_node1,
    _ftp.ftp_pw_idc_node1
  );
  await node1Upload.upload(
    fileList,
    _config.idc_local_entry,
    _config.remote_idc_entry
  );
  await node1Upload.disconnect();
  log("end upload files to Node1", "yellow");
  //上传结束

  //开始上传node2
  log("start upload files to Node2", "yellow");
  const node2Upload = new SFTP();
  await node2Upload.connect(
    _ftp.ftp_host_idc_node2,
    _ftp.ftp_user_idc_node2,
    _ftp.ftp_pw_idc_node2
  );
  await node2Upload.upload(
    fileList,
    _config.idc_local_entry,
    _config.remote_idc_entry
  );
  await node2Upload.disconnect();
  log("end upload files to Node2", "yellow");
  //上传结束
}

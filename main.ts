import * as path from "path";
import { readJsonFile, copy } from "./lib/fileUtils";
import SFTP from "./lib/SFTP";
import { log, dateFormat } from "./lib/tools";
import type { IFTPConfig } from "./lib/type";
import DBUtils from "./lib/DBUtils";

interface IConfig {
  entry: string; //项目路径
  remote_entry: string; //ftp 目录路径
  buyer: string[];
  supplier: string[];
  gerp: string[];
  buyerExp: string[];
  buyerMenu: string[];
  buyerExpMenu: string[];
  supplierMenu: string[];
  ftp_store: string; //ftp配置文件
  backup_entry: string; //备份入口 绝对路径
  remote_idc_entry: string;

  host: string; //数据库HOST
  user: string; //数据库用户名
  password: string; //数据库密码
  database: string; //数据库名
  compileEntry: string; //项目编译路径
}

const _baseDir = process.cwd();
const CONFIG_FILE = "config_main.json";
let _config = {} as IConfig; //必备参数
let _ftp = {} as IFTPConfig; //必备参数

export async function upload(type: string, version: string) {
  _config = await readJsonFile<IConfig>(path.resolve(_baseDir, CONFIG_FILE));
  _ftp = await readJsonFile<IFTPConfig>(_config.ftp_store);

  const paths = _config[type] as string[];
  const fileList = [paths[1], `static/${type}/${version}/`];

  //开始上传
  log("start upload files to 45", "yellow");
  const sftp = new SFTP();
  await sftp.connect(_ftp.ftp_host_test, _ftp.ftp_user_test, _ftp.ftp_pw_test);
  await sftp.upload(
    fileList,
    path.join(_config.compileEntry, paths[0]),
    _config.remote_entry
  );
  await sftp.disconnect();
  log("end upload files to 45", "yellow");
  //上传结束
}

export async function idc(type: string, version: string) {
  _config = await readJsonFile<IConfig>(path.resolve(_baseDir, CONFIG_FILE));
  _ftp = await readJsonFile<IFTPConfig>(_config.ftp_store);

  const paths = _config[type] as string[];
  const fileList = [paths[1], `static/${type}/${version}/`];
  const backupEntry = path.join(
    _config.backup_entry,
    type,
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
  await node1Backup.download([paths[1]], backupEntry, _config.remote_idc_entry);
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
    path.join(_config.compileEntry, paths[0]),
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
    path.join(_config.compileEntry, paths[0]),
    _config.remote_idc_entry
  );
  await node2Upload.disconnect();
  log("end upload files to Node2", "yellow");
  //上传结束
}

export async function copyCompileFiles(type: string, version: string) {
  _config = await readJsonFile<IConfig>(path.resolve(_baseDir, CONFIG_FILE));
  const dbUtils = new DBUtils(_config);
  dbUtils.getJtracByVersionAndType(version, type).then(async (jtracFiles) => {
    dbUtils.close();
    if (!jtracFiles?.length || jtracFiles?.length === 0) {
      console.log("error in search");
      return;
    }
    for (const jtrac of jtracFiles) {
      console.log(`start copy jtrac: ${jtrac.jtrac_no}`);
      const filelist = jtrac.file_list?.split(",");
      for (const file of filelist) {
        const result = await copy(
          file,
          _config.entry,
          _config.compileEntry
        ).catch((error) => {
          console.log(`error in copy ${file}: `, error);
          throw error;
        });
        if (result) {
          console.log("copied: ", file);
        }
      }
    }
  });
}

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
import DBUtils from "./lib/DBUtils";
import type { IFTPConfig, IFile } from "./lib/type";
import SFTP from "./lib/SFTP";
import { log, dateFormat } from "./lib/tools";

interface IConfig {
  entry: string; //编译文件夹入口
  entry_css: string; //编译CSS文件夹入口
  extension: string[]; //保存记录的文件后缀名
  host: string; //数据库HOST
  user: string; //数据库用户名
  password: string; //数据库密码
  database: string; //数据库名
  updateEntry: string; //更新目录入口
  compileEntry: string; //编译目录入口
  remote_entry_script: string; //ftp script目录路径
  remote_entry_styles: string; //ftp styles目录路径
  remote_entry_jsp: string; //ftp jsp路径
  local_entry_jsp: string[]; //本地 jsp路径
  copiedFiles: string[]; //固定要复制的文件
  ftp_store: string; //ftp配置文件
}

interface IDCConfig {
  entry: string; //IDC上传操作目录
  file_list: string; //需要上传的文件列表
  remote_entry_test: string;
  remote_entry_idc: string;
  ftp_store: string; //ftp配置文件
}

const _baseDir = process.cwd();
const CONFIG_FILE = "upload_check_config.json";
const IDC_CONFIG_FILE = "upload_idc_config.json";
let _config = {} as IConfig; //必备参数
let _IDCConfig = {} as IDCConfig; //必备参数
let _ftp = {} as IFTPConfig; //必备参数

export async function insertVersion(version: string, types: string) {
  const jspTypes = types.split(",");
  console.log("start insertVersion: " + version + " ,types: " + types);

  _config = await readJsonFile<IConfig>(path.resolve(_baseDir, CONFIG_FILE));
  _ftp = await readJsonFile<IFTPConfig>(_config.ftp_store);

  const rootFiles = await readdir(path.resolve(_baseDir, _config.entry));
  const files: IFile[] = [];
  const rootCSSFiles = await readdir(path.resolve(_baseDir, _config.entry_css));
  const cssFiles: IFile[] = [];
  await recordByDir(path.resolve(_baseDir, _config.entry), rootFiles, files);
  await recordByDir(
    path.resolve(_baseDir, _config.entry_css),
    rootCSSFiles,
    cssFiles
  );

  const dbUtils = new DBUtils(_config);
  await dbUtils.addVersion(version, JSON.stringify([...files, ...cssFiles]));
  console.log("end insertVersion: " + version);

  const compares = await dbUtils.getLastTwoFils();
  console.log(
    "start compareVersion : " +
      `${compares[0].version} vs ${compares[1].version}`
  );
  const modules: string[] = [];
  const oldFileList: IFile[] = JSON.parse(compares[1].files);
  const newFileList: IFile[] = JSON.parse(compares[0].files);
  newFileList.forEach((file: IFile) => {
    const old = oldFileList.find((f) => f.name === file.name);
    if (!old || (old && old.date !== file.date)) {
      modules.push(file.name.split("\\").join("/"));
    }
  });

  console.log("start update modules: " + modules.join(","));
  dbUtils
    .updateJtracTo45(version, modules.join(","))
    .then(async (result) => {
      dbUtils.close();
      if (!result.changedRows || result.changedRows < 1) {
        console.log(`error in update jtrac: changedRows < 1`);
      } else {
        console.log(
          `update jtrac status success: changedRows ( ${result?.changedRows} )`
        );
        //开始上传FTP
        let modulesCombinedJS: string[] = [];
        let modulesCombinedCSS: string[] = [];
        modules.forEach((originPath) => {
          if (getFileExtension(originPath) === "js") {
            modulesCombinedJS.push(
              originPath,
              originPath + ".gz",
              originPath + ".map"
            );
          } else {
            //css
            modulesCombinedCSS.push(originPath, originPath + ".gz");
          }
        });
        const jspList = _config.local_entry_jsp.filter((_, i) => {
          return jspTypes.includes(String(i));
        });

        console.log("start upload files to 45");
        const sftp = new SFTP();
        await sftp.connect(
          _ftp.ftp_host_test,
          _ftp.ftp_user_test,
          _ftp.ftp_pw_test
        );
        await sftp.upload(
          modulesCombinedJS,
          _config.entry,
          _config.remote_entry_script
        );

        await sftp.upload(
          modulesCombinedCSS,
          _config.entry_css,
          _config.remote_entry_styles
        );
        await sftp.uploadFlies(jspList, _config.remote_entry_jsp);
        console.log("end upload files to 45");
        await sftp.disconnect();

        console.log("start upload files to 46");
        const sftp2 = new SFTP();
        await sftp2.connect(
          _ftp.ftp_host_test2,
          _ftp.ftp_user_test2,
          _ftp.ftp_pw_test2
        );
        await sftp2.upload(
          modulesCombinedJS,
          _config.entry,
          _config.remote_entry_script
        );

        await sftp2.upload(
          modulesCombinedCSS,
          _config.entry_css,
          _config.remote_entry_styles
        );
        await sftp2.uploadFlies(jspList, _config.remote_entry_jsp);
        console.log("end upload files to 46");
        await sftp2.disconnect();
      }
    })
    .catch((error) => {
      dbUtils.close();
      console.log(`error in in update jtrac: `, error);
      throw error;
    });
}

export async function compareVersion(newVersion: string, oldVersion: string) {
  console.log("start compareVersion : " + `${newVersion} vs ${oldVersion}`);
  _config = await readJsonFile<IConfig>(path.resolve(_baseDir, CONFIG_FILE));
  const dbUtils = new DBUtils(_config);

  const newFiles = await dbUtils.getFilsByVersion(newVersion);
  const oldFiles = await dbUtils.getFilsByVersion(oldVersion);
  dbUtils.close();
  if (!oldFiles?.[0]?.version || !newFiles?.[0]?.version) {
    console.log("invalid version !");
    return;
  }
  const changedFiles: any[] = [];
  const copiedFiles: string[] = [];
  const oldFileList: IFile[] = JSON.parse(oldFiles[0].files);
  const newFileList: IFile[] = JSON.parse(newFiles[0].files);
  newFileList.forEach((file: IFile) => {
    const old = oldFileList.find((f) => f.name === file.name);
    if (!old || (old && old.date !== file.date)) {
      changedFiles.push(
        JSON.stringify({
          name: file.name,
          newDate: dateFormat(file.date),
          oldDate: old?.date ? dateFormat(old?.date) : "",
        })
      );
      copiedFiles.push(file.name.split("\\").join("/"));
    }
  });
  console.log("result:", `\n${changedFiles.join("\n")}`);
  console.log(`  ----------------------------------------------------
  --------------------- Copy↓ -----------------------
  ----------------------------------------------------`);
  console.log(`${copiedFiles.join("\n")}`);
}

export async function compareLastVersion() {
  _config = await readJsonFile<IConfig>(path.resolve(_baseDir, CONFIG_FILE));
  const dbUtils = new DBUtils(_config);
  const files = await dbUtils.getLastTwoFils();
  dbUtils.close();
  if (files?.length !== 2) {
    console.log("invalid row length !");
    return;
  }
  console.log(
    "start compareVersion : " + `${files[0].version} vs ${files[1].version}`
  );
  const changedFiles: any[] = [];
  const copiedFiles: string[] = [];
  const oldFileList: IFile[] = JSON.parse(files[1].files);
  const newFileList: IFile[] = JSON.parse(files[0].files);
  newFileList.forEach((file: IFile) => {
    const old = oldFileList.find((f) => f.name === file.name);
    if (!old || (old && old.date !== file.date)) {
      changedFiles.push(
        JSON.stringify({
          name: file.name,
          newDate: dateFormat(file.date),
          oldDate: old?.date ? dateFormat(old?.date) : "",
        })
      );
      copiedFiles.push(file.name.split("\\").join("/"));
    }
  });
  console.log("result:", `\n${changedFiles.join("\n")}`);
  console.log(`  ----------------------------------------------------
  --------------------- Copy↓ -----------------------
  ----------------------------------------------------`);
  console.log(`${copiedFiles.join("\n")}`);
}

export async function copyCompileFiles(version: string) {
  _config = await readJsonFile<IConfig>(path.resolve(_baseDir, CONFIG_FILE));
  const dbUtils = new DBUtils(_config);
  dbUtils.getJtracByVersion(version).then(async (jtracFiles) => {
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
          _config.updateEntry,
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

    for (const fixedFile of _config.copiedFiles) {
      const result = await copy(
        fixedFile,
        _config.updateEntry,
        _config.compileEntry
      ).catch((error) => {
        console.log(`error in copy ${fixedFile}: `, error);
        throw error;
      });
      if (result) {
        console.log("copied: ", fixedFile);
      }
    }
  });
}

export async function uploadIDC() {
  _IDCConfig = await readJsonFile<IDCConfig>(
    path.resolve(_baseDir, IDC_CONFIG_FILE)
  );
  _ftp = await readJsonFile<IFTPConfig>(_IDCConfig.ftp_store);

  const fileText = await readTxtFile(path.resolve(_IDCConfig.file_list));
  if (!fileText) {
    log("error in read file list", "red");
    return;
  }
  const fileList = fileText.replace(/\r/g, "").split("\n");
  const uploadEntry = path.resolve(
    _IDCConfig.entry,
    "work",
    dateFormat(new Date().getTime()).replace(/:/g, "-")
  );
  const idcRoot = path.resolve(uploadEntry, "backup");
  const testRoot = path.resolve(uploadEntry, "upload");
  await mkdir(idcRoot);
  await mkdir(testRoot);

  fileList.forEach((file, index) => {
    const ext = getFileExtension(file);
    if (ext === "js") {
      fileList[index] = "/static/mp/script/" + file;
      fileList.push(fileList[index] + ".gz", fileList[index] + ".map");
    } else if (ext === "css") {
      //css
      fileList[index] = "/static/mp/styles/" + file;
      fileList.push(fileList[index] + ".gz");
    }
  });

  //开始备份
  log("start backup idc", "yellow");
  const node1Backup = new SFTP();
  await node1Backup.connect(
    _ftp.ftp_host_idc_node1,
    _ftp.ftp_user_idc_node1,
    _ftp.ftp_pw_idc_node1
  );
  await node1Backup.download(fileList, idcRoot, _IDCConfig.remote_entry_idc);
  await node1Backup.disconnect();
  log("end backup idc", "yellow");
  //备份结束
  log("---------------------------------------------------------", "cyan");
  log("---------------------------------------------------------", "cyan");
  //开始下载待传文件
  log("start download files from test server", "yellow");
  const testBackup = new SFTP();
  await testBackup.connect(
    _ftp.ftp_host_test,
    _ftp.ftp_user_test,
    _ftp.ftp_pw_test
  );
  await testBackup.download(fileList, testRoot, _IDCConfig.remote_entry_test);
  await testBackup.disconnect();
  log("end download files from test server", "yellow");
  //下载待传文件结束
  log("---------------------------------------------------------", "cyan");
  log("---------------------------------------------------------", "cyan");
  //开始上传
  log("start upload files to node1", "yellow");
  const node1Upload = new SFTP();
  await node1Upload.connect(
    _ftp.ftp_host_idc_node1,
    _ftp.ftp_user_idc_node1,
    _ftp.ftp_pw_idc_node1
  );
  await node1Upload.upload(fileList, testRoot, _IDCConfig.remote_entry_idc);
  await node1Upload.disconnect();
  log("end upload files to node1", "yellow");
  log("---------------------------------------------------------", "cyan");
  log("---------------------------------------------------------", "cyan");
  log("start upload files to node2", "yellow");
  const node2Upload = new SFTP();
  await node2Upload.connect(
    _ftp.ftp_host_idc_node2,
    _ftp.ftp_user_idc_node2,
    _ftp.ftp_pw_idc_node2
  );
  await node2Upload.upload(fileList, testRoot, _IDCConfig.remote_entry_idc);
  await node2Upload.disconnect();
  log("end upload files to node2", "yellow");
  //上传结束
}

export async function uploadIDCCheck() {
  _IDCConfig = await readJsonFile<IDCConfig>(
    path.resolve(_baseDir, IDC_CONFIG_FILE)
  );
  const fileText = await readTxtFile(path.resolve(_IDCConfig.file_list));
  if (!fileText) {
    log("error in read file list", "red");
    return;
  }
  log(fileText, "yellow");
}

async function recordByDir(rootPath: string, dir: Dirent[], data: IFile[]) {
  return new Promise<any>(async (resolve, reject) => {
    const filesFilter = dir.filter((filefilter) => {
      return (
        (filefilter.isFile() &&
          _config.extension.includes(getFileExtension(filefilter.name))) ||
        filefilter.isDirectory()
      );
    });
    for (const file of filesFilter) {
      const fileName = path.resolve(rootPath, file.name);
      if (file.isDirectory()) {
        const files = await readdir(fileName);
        const record = await recordByDir(fileName, files, data);
      } else {
        const fileStat = await stat(fileName);
        data.push({
          name: fileName.substr(path.resolve(_baseDir, _config.entry).length), //注意这里_config.entry和_config.entry_css长度一致
          size: fileStat.size,
          date: fileStat.mtimeMs,
        });
      }
    }
    resolve(true);
  });
}

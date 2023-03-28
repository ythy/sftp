import * as path from "path";
import * as fs from "fs";
import * as SftpClient from "ssh2-sftp-client";
import { stat, mkdir } from "./fileUtils";
import { log } from "./tools";

export default class FTPUtils {
  client: any;

  connect(host: string, user: string, password: string) {
    this.client = new SftpClient();
    return new Promise<number>(async (resovle) => {
      await this.client.connect({
        host: host,
        port: 22,
        username: user,
        password: password,
      });
      resovle(1);
    });
  }

  upload(fileList: string[], localEntry: string, remoteEntry: string) {
    return new Promise<number>(async (resovle) => {
      for (const uploadFile of fileList) {
        const localFile = path.join(localEntry, uploadFile);
        const remoteFile = remoteEntry + uploadFile;
        const status = await stat(localFile);
        if (status.isDirectory()) {
          const result = await this.client
            .uploadDir(localFile, remoteFile)
            .catch((err: any) => {
              log("upload dir error: " + err, "red");
            });
          if (result) {
            log("upload dir success: " + remoteFile, "green");
          }
        } else {
          const remoteDir = path.dirname(remoteFile);
          const existInRemote = await this.client.exists(remoteDir);
          if (!existInRemote) await this.client.mkdir(remoteDir, true);
          const result = await this.client
            .put(localFile, remoteFile)
            .catch((err: any) => {
              log("upload file error: " + err, "red");
            });
          if (result) {
            log("upload file success: " + remoteFile, "green");
          }
        }
      }
      resovle(1);
    });
  }

  uploadFlies(fileList: string[], remoteEntry: string) {
    return new Promise<number>(async (resovle) => {
      for (const uploadFile of fileList) {
        const localFile = uploadFile;
        const remoteFile = remoteEntry + path.basename(uploadFile);
        const status = await stat(localFile);
        if (status.isDirectory()) {
          const result = await this.client
            .uploadDir(localFile, remoteFile)
            .catch((err: any) => {
              log("upload dir error: " + err, "red");
            });
          if (result) {
            log("upload dir success: " + remoteFile, "green");
          }
        } else {
          const remoteDir = path.dirname(remoteFile);
          const existInRemote = await this.client.exists(remoteDir);
          if (!existInRemote) await this.client.mkdir(remoteDir, true);
          const result = await this.client
            .put(localFile, remoteFile)
            .catch((err: any) => {
              log("upload file error: " + err, "red");
            });
          if (result) {
            log("upload file success: " + remoteFile, "green");
          }
        }
      }
      resovle(1);
    });
  }

  download(fileList: string[], localEntry: string, remoteEntry: string) {
    return new Promise<number>(async (resovle) => {
      for (const uploadFile of fileList) {
        const remoteFile = remoteEntry + uploadFile;
        const localFile = path.join(localEntry, uploadFile);
        await mkdir(path.dirname(localFile));
        const writeStream = fs.createWriteStream(localFile);
        const result = await this.client
          .get(remoteFile, writeStream)
          .catch((err: any) => {
            log("download error: " + err, "red");
          });
        if (result) {
          log("download success: " + remoteFile, "green");
        }
      }
      resovle(1);
    });
  }

  disconnect() {
    return new Promise<number>(async (resovle) => {
      await this.client.end();
      resovle(1);
    });
  }
}

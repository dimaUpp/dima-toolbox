import { error } from '@robot-toolbox/logger';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import ora from 'ora';
import { join, extname } from 'path';
import { existsSync, writeFile } from 'fs';

export = async function iconfont(params: IconfontOptions): Promise<any> {
  const spinner = ora();
  const { dir } = params;

  // const { downloadUrl } = await inquirer.prompt<{ downloadUrl: string }>({
  //   type: 'input',
  //   name: 'downloadUrl',
  //   message: '请输入iconfont线上地址【Font class代码】',
  //   validate: (val: string) => !!val
  // });
  const downloadUrl = '//at.alicdn.com/t/font_2647670_992j4owiywp.css';

  const checkReg = /font_\d+_.+\.css/;
  if (!checkReg.test(downloadUrl)) {
    error('请输入正确的url地址');
    return await iconfont(params);
  }

  spinner.start('下载中...');

  const { filename: cssFileName, code: cssCode } = await downloadFn(downloadUrl);

  const promises: Promise<FileInfo>[] = [];
  const urlCodeArr = cssCode.match(/url\([^\)]+\)/gm);
  if (urlCodeArr) {
    urlCodeArr.forEach((url: string) => {
      promises.push(downloadFn(url.slice(5, -2)));
    });
  }
  const codeArr = await Promise.all(promises);

  spinner.succeed();

  const dirUrl = join(process.cwd(), dir);
  if (!existsSync(dirUrl)) {
    error(`目录不存在：${dirUrl}`);
  }

  spinner.start('生成文件替换中...');
  const writePromises: Promise<void>[] = [];
  [{ filename: cssFileName, code: cssCode }, ...codeArr].forEach(({ filename, code }) => {
    writePromises.push(
      new Promise((resolve, reject) => {
        writeFile(`${dirUrl}/${filename}`, code, { encoding: 'utf8' }, (err) => (err ? reject(err) : resolve()));
      })
    );
  });
  await Promise.all(writePromises);
  spinner.succeed();
};

async function downloadFn(url: string): Promise<FileInfo> {
  const file = await fetch(`https:${url}`);
  const code = await file.text();
  return { filename: `iconfont${extname(url.replace(/\?.*$/, ''))}`, code };
}
interface IconfontOptions extends Options {
  dir: string;
}

interface FileInfo {
  filename: string;
  code: string;
}
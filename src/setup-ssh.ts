import os from "os";
import path from "path";
import fs from "fs";
// import execa from "execa";
import * as exec from "@actions/exec"
import * as core from "@actions/core";
import * as io from "@actions/io";
import tmpDir from "./tmp-helper";
import {v4 as uuid} from 'uuid';
import execa from "execa";

const HOME_DIR = process.env['HOME'] || os.homedir();
const SSH_DIR = path.join(HOME_DIR, ".ssh");

async function ensureDirectoryExists(path: string) {
    if (!fs.existsSync(path)) {
        await io.mkdirP(path);
        core.info(`create directory ${path}`)
    }
}
export default async function setupSSH(privateKey: string, host: string, port: number) {
    try {
        core.startGroup("Setup SSH");
        await ensureDirectoryExists(SSH_DIR);
        await ensureDirectoryExists(tmpDir);
        const sshAgentPath = await io.which("ssh-agent");
        const sshAddPath = await io.which("ssh-add");
        const sshKeyScanPath = await io.which("ssh-keyscan");
        core.info('start ssh-agent');
        // Start the ssh agent
        const authSock = path.join(tmpDir, uuid() + ".sock");

        await exec.exec(sshAgentPath, ['-a', authSock]);
        core.exportVariable('SSH_AUTH_SOCK', authSock);
        core.info('add ssh private key');

        let privateKeyFile = path.join(tmpDir, uuid());
        privateKey = privateKey.replace('/\r/g', '').trim() + '\n'
        fs.writeFileSync(privateKeyFile, privateKey);
        fs.chmodSync(privateKeyFile, '600');
        await exec.exec(sshAddPath, [privateKeyFile]);
        core.info(`add host key of ${host}:${port} to known_hosts`);

        let knowHostInfo: string = ""
        const options = {
            listeners: {
                stdout: (data: Buffer) => {
                    knowHostInfo += data.toString() + "\n";
                }
            }
        }
        await exec.exec(sshKeyScanPath, ['-p', port.toString(), host], options);
        const knownHostsFile = path.join(SSH_DIR, 'known_hosts');
        fs.appendFileSync(knownHostsFile, knowHostInfo);
        fs.chmodSync(knownHostsFile, '644');
        core.endGroup();
    } catch (error) {
        core.setFailed(error.message);
    }
}

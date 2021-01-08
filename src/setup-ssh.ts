import os from "os";
import path from "path";
import fs from "fs";
import execa from "execa";
import * as core from "@actions/core";
import tmpDir from "./tmp-helper";

const HOME_DIR = process.env['HOME'] || os.homedir();
const SSH_DIR = path.join(HOME_DIR, ".ssh");

export default async function setupSSH(privateKey: string, host: string, port: number) {
    try {
        if (!port) {
            port = 22
        }
        core.startGroup("Setup SSH")
        // Create the required directory
        fs.mkdirSync(SSH_DIR, {recursive: true})

        core.info('Starting ssh-agent')

        // Start the ssh agent
        const authSock = '/tmp/ssh-auth.sock'
        await execa('ssh-agent', ['-a', authSock])
        core.exportVariable('SSH_AUTH_SOCK', authSock)

        core.info('Adding private key')

        // Add the private key
        const key = privateKey.replace('/\r/g', '').trim() + '\n'
        await execa('ssh-add', ['-'], {input: key})

        core.info(`Adding host to known_hosts for ${host}:${port}`)

        // Add the host to the known_hosts file
        const {stdout} = await execa('ssh-keyscan', ['-p', port.toString(), host])
        const knownHostsFile = SSH_DIR + '/known_hosts'
        fs.appendFileSync(knownHostsFile, stdout)
        fs.chmodSync(knownHostsFile, '644')
        core.endGroup()
    } catch (error) {
        core.setFailed(error.message);
    }
}

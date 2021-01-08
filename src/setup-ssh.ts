import os from "os";
import path from "path";
import fs from "fs/promises";
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

        // Create the required directory
        await fs.mkdir(SSH_DIR, {recursive: true})

        console.log('Starting ssh-agent')

        // Start the ssh agent
        const authSock = '/tmp/ssh-auth.sock'
        await execa('ssh-agent', ['-a', authSock])
        core.exportVariable('SSH_AUTH_SOCK', authSock)

        console.log('Adding private key')

        // Add the private key
        const key = privateKey.replace('/\r/g', '').trim() + '\n'
        await execa('ssh-add', ['-'], {input: key})

        console.log('Adding host to known_hosts')

        // Add the host to the known_hosts file
        const {stdout} = await execa('ssh-keyscan', ['-p', port.toString(), host])
        const knownHostsFile = SSH_DIR + '/known_hosts'
        await fs.appendFile(knownHostsFile, stdout)
        await fs.chmod(knownHostsFile, '644')
    } catch (error) {
        core.setFailed(error.message);
    }
}

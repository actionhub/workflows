import os from "os";
import path from "path";

const HOME_DIR = process.env['HOME'] || os.homedir();
const SSH_DIR = path.join(HOME_DIR, ".ssh");

export function setSSHKey() {

}

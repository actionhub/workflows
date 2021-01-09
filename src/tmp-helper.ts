import {v4 as uuid} from 'uuid';
import os from "os";
import path from "path";
import fs from "fs";
import * as io from "@actions/io";
import * as core from "@actions/core";

const TMP_DIR = os.tmpdir();
const tmpDir = path.join(TMP_DIR, uuid())
export default tmpDir;

export async function ensureDirectoryExists(path: string) {
    if (!fs.existsSync(path)) {
        await io.mkdirP(path);
        core.info(`create directory ${path}`)
    }
}

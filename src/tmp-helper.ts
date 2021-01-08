import {v4 as uuid} from 'uuid';
import os from "os";
import path from "path";
const TMP_DIR = os.tmpdir();
const tmpDir = path.join(TMP_DIR, uuid())
export default tmpDir;

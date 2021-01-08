import * as core from "@actions/core";
import * as params from "./parse-params";
import * as gitCommandManager from "./third-party/checkout/git-command-manager";
import {v4 as uuid} from 'uuid';
import setupSSH from "./setup-ssh";
import gitUrlParse from "git-url-parse";

const sshKey = params.get("ssh-key");
const repoUrl = params.get("repo-url");
const lfs = params.getBoolean("lfs");
const includeBranches = params.getArray("include-branches", ";", []);
const excludeBranches = params.getArray("exclude-branches", ";", []);

const REMOTE_BRANCH_PREFIX = "origin/";
const remote = uuid();
(async() => {
    try {
        let url = gitUrlParse(repoUrl);
        await setupSSH(sshKey, url.resource, url.port || 22);
        const git = await gitCommandManager.createCommandManager(process.cwd(), lfs);
        let branches = await git.branchList(true);
        core.info(branches.join(","));
        const finalPush = [];
        for (let b of branches) {
            if (!b.startsWith(REMOTE_BRANCH_PREFIX)) {
                continue;
            }
            const branch = b.substr(REMOTE_BRANCH_PREFIX.length);
            let exclude = excludeBranches.includes(branch);
            let include = includeBranches.length == 0 || includeBranches.includes(branch);
            if (include) {
                if (exclude) {
                    if (includeBranches.length == 0) {
                        continue;
                    } else {
                        core.warning(`branch ${branch} in include branches and exclude branches. it will be include`);
                    }
                }
                finalPush.push(branch);
                await git.createBranch(branch, true, branch);
            }
        }
        branches = await git.branchList(false);
        core.info(branches.join(","));
        await git.remoteAdd(remote, repoUrl);
        await git.fetch(finalPush)
        await git.push(remote, true, finalPush);

    } catch (e) {
        core.setFailed(e);
    }
})();


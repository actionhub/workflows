import * as core from "@actions/core";
import * as params from "./parse-params";
import simpleGit from "simple-git";
import path from "path";

const sshKey = params.get("ssh-key");
const repoUrl = params.get("repo-url");
const includeBranches = params.getArray("include-branches", ";", []);
const excludeBranches = params.getArray("exclude-branches", ";", []);

const REMOTE_BRANCH_PREFIX = "remotes/origin/";

(async() => {
    try {
        const options = {
            baseDir: process.cwd(),
            binary: 'git',
            maxConcurrentProcesses: 6
        }
        const git = simpleGit(options);
        let branchSummary = await git.branch()
        // const branches = branchSummary.all.filter(b => b.startsWith(REMOTE_BRANCH_PREFIX)).map(b => b.substr(REMOTE_BRANCH_PREFIX.length))
        const finalPush = [];
        for (let b of branchSummary.all) {
            if (!b.startsWith(REMOTE_BRANCH_PREFIX)) {
                continue;
            }
            let branch = b.substr(REMOTE_BRANCH_PREFIX.length);
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
                await git.branch([branch, b])
            }
        }
        branchSummary = await git.branch()
        core.info(finalPush.join(","));
        core.info(branchSummary.all.join(","));
    } catch (e) {
        core.setFailed(e);
    }
})();


core.info("size：" + includeBranches.length);
includeBranches.forEach(b => {
    core.info("idx:" + b.indexOf("a"));
})

console.log("HelloWorld git-sync!", sshKey, repoUrl, includeBranches, excludeBranches);

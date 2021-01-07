import * as core from "@actions/core";
import * as params from "./parse-params";
import simpleGit from "simple-git";
import path from "path";

const sshKey = params.get("ssh-key");
const repoUrl = params.get("repo-url");
const includeBranches = params.getArray("include-branches", ";", []);
const excludeBranches = params.getArray("exclude-branches", ";", []);

(async() => {
    try {
        const options = {
            baseDir: path.join(process.cwd()),
            binary: 'git',
            maxConcurrentProcesses: 6
        }
        const git = simpleGit(options);
        let branchSummary = await git.branch()
        // const branches = branchSummary.all.filter(b => b.startsWith("remotes/"))
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

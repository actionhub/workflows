import * as core from "@actions/core";
import * as params from "./parse-params";
import * as gitCommandManager from "./third-party/checkout/git-command-manager";
import {v4 as uuid} from 'uuid';

const sshKey = params.get("ssh-key");
const repoUrl = params.get("repo-url");
const lfs = params.getBoolean("lfs");
const includeBranches = params.getArray("include-branches", ";", []);
const excludeBranches = params.getArray("exclude-branches", ";", []);

const REMOTE_BRANCH_PREFIX = "origin/";
const remote = uuid();
(async() => {
    try {
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



        // const options = {
        //     baseDir: process.cwd(),
        //     binary: 'git',
        //     maxConcurrentProcesses: 6
        // }
        // const git = simpleGit(options);
        // let branchSummary = await git.branch()
        // // const branches = branchSummary.all.filter(b => b.startsWith(REMOTE_BRANCH_PREFIX)).map(b => b.substr(REMOTE_BRANCH_PREFIX.length))
        // const finalPush = [];
        // for (let b of branchSummary.all) {
        //     if (!b.startsWith(REMOTE_BRANCH_PREFIX)) {
        //         continue;
        //     }
        //     let branch = b.substr(REMOTE_BRANCH_PREFIX.length);
        //     let exclude = excludeBranches.includes(branch);
        //     let include = includeBranches.length == 0 || includeBranches.includes(branch);
        //     if (include) {
        //         if (exclude) {
        //             if (includeBranches.length == 0) {
        //                 continue;
        //             } else {
        //                 core.warning(`branch ${branch} in include branches and exclude branches. it will be include`);
        //             }
        //         }
        //         finalPush.push(branch);
        //         await git.branch([branch, b])
        //     }
        // }
        // branchSummary = await git.branch()
        // core.info(finalPush.join(","));
        // core.info(branchSummary.all.join(","));
        //
        // await git.addRemote(remote, repoUrl);
        // await git.push(["--all", "-u", remote, "-f"]);
        // await git.deleteLocalBranches(finalPush);
    } catch (e) {
        core.setFailed(e);
        // console.error(e);
    }
})();


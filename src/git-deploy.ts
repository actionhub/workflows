import * as core from "@actions/core";
import * as github from "@actions/github";
import * as params from "./parse-params";
import * as gitCommandManager from "./third-party/checkout/git-command-manager";
import {v4 as uuid} from 'uuid';
import setupSSH from "./setup-ssh";
import gitUrlParse from "git-url-parse";
import tmpDir, {ensureDirectoryExists} from "./tmp-helper";
import * as gitHelper from "./git-helper";
import path from "path";
import * as io from "@actions/io";
import * as fs from "fs";

const sshKey = params.get("ssh-key", "");
const src = params.get("src-dir", "");
const branch = params.get("branch", "master");
const des = params.get("des-dir", "");
const repoUrl = params.get("repo-url");
const keepFiles = params.getBoolean("keep-files", false);
const lfs = params.getBoolean("lfs", false);
const force = params.getBoolean("force-orphan", false);
let userName = params.get("user-name", "");
let userEmail = params.get("user-email", "");
const commitMessage = params.get("commit-message", "");

const gitTmp = path.join(tmpDir, uuid());

const publishDir = path.isAbsolute(src)
    ? src
    : path.join(`${process.env.GITHUB_WORKSPACE}`, src);

(async () => {
    if (sshKey == "") {
        if ((github.context.payload as any).repository.fork) {
            core.warning('This action runs on a fork and not found auth token, Skip deployment');
            return
        } else {
            throw new Error("ssh-key require!");
        }
    }

    if((!userName?1:0) ^ (!userEmail?1:0)) {
        throw new Error("please configure user-name and user-email at the same time");
    }
    userName = userName || `${process.env.GITHUB_ACTOR}`;
    userEmail = userEmail || `${process.env.GITHUB_ACTOR}@users.noreply.github.com`;
    let url = gitUrlParse(repoUrl);
    await setupSSH(sshKey, url.resource, url.port || 22);
    await ensureDirectoryExists(gitTmp);
    const git = await gitCommandManager.createCommandManager(gitTmp, lfs);
    await git.init();

    if (force) {
        await git.execGit(["checkout", "--orphan", branch]);
    } else {
        await git.remoteAdd("origin", repoUrl);

        const exists = await gitHelper.remoteBranchExists(git, branch);
        core.info("[" + exists + "]")
        if (exists) {
            await git.fetch([]);
            await git.checkout(branch, "");
        }

        if (keepFiles) {
            core.info('Keep existing files');
        } else {
            process.chdir(publishDir);
            await git.execGit(["rm", "-r", "--ignore-unmatch", "*"]);
        }
    }

    const targetDir = path.join(gitTmp, des);
    await ensureDirectoryExists(targetDir);
    // await exec.exec("ls", [publishDir])
    // await exec.exec("cp", ["-arf", path.join(publishDir, "*"), targetDir]);
    const files = fs.readdirSync(publishDir);
    for (let file of files) {
        await io.cp(path.join(publishDir, file), targetDir, {recursive: true});
    }

    await git.execGit(["add", "--all"])

    await git.config("user.name", userName)
    await git.config("user.email", userEmail)

    const message = commitMessage || `deploy: ${github.context.repo.owner}/${github.context.repo.repo}@${process.env.GITHUB_SHA}`

    await git.execGit(['commit', '--allow-empty', '-m', message])

    const {stdout} = await git.execGit(["name-rev", "--name-only", "HEAD"]);
    const out = stdout.endsWith("\n") ? stdout.substr(0,  stdout.length - 1): stdout;

    await git.push("origin", force, [out]);
})().catch(e => {
    core.setFailed(e);
})


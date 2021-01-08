const simpleGit = require('simple-git');
const options = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6
}
const git = simpleGit(options);
const GIT_SSH_COMMAND = "ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no";
git.env("GIT_SSH_COMMAND", GIT_SSH_COMMAND);

(async () => {
    try {
        let a = await git.branch(/*["test", "remotes/origin/test"]*/);
        let b = await git.push(["--all", "-u", "gitee", "-f"]);
        console.log(a);
        console.log(b)
    } catch (e) {
        console.error(e);
    }
})();

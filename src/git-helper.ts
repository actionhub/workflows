import IGitCommandManager from "./third-party/checkout/IGitCommandManager";

export async function remoteBranchExists(git: IGitCommandManager, branch: string, remoteName: string = "origin"): Promise<boolean> {
    const {stdout} = await git.execGit(["ls-remote", "--refs", remoteName, branch]);
    const out = stdout.endsWith("\n") ? stdout.substr(0, stdout.length - 1): stdout;
    const rs = out.split("\n");
    return rs.length > 0
}

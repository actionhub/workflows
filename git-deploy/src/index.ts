import * as core from "@actions/core";

(async (): Promise<void> => {
    try {
        core.info("[INFO] Usage https://github.com/okou19900722/git-sync");

        const deploy_key = core.getInput("deploy_key");
        const src_dir = core.getInput("src_dir");
        const branch = core.getInput("branch");
        const des_dir = core.getInput("des_dir");
        const repo_url = core.getInput("repo_url");
        const user_name = core.getInput("user_name");
        const user_email = core.getInput("user_email");
        const commit_message = core.getInput("commit_message");

    } catch (e) {
        core.setFailed(`Failed.\n  Cause of ${e}`);
    }
})()

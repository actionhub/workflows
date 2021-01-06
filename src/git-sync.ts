// import * as core from "@actions/core";
// import {get} from "./parse-ints";
// import * as os from "os";
import * as params from "./parse-params";

const sshKey = params.get("ssh-key");
const repoUrl = params.get("repo-url");
const includeBranches = params.getArray("include-branches", ";", []);
const excludeBranches = params.getArray("exclude-branches", ";", []);

console.log("HelloWorld git-sync!", sshKey, repoUrl, includeBranches, excludeBranches);

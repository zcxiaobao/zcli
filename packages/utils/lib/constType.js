export const DEFAULT_CLI_HOME = ".zcli";
export const GIT_SERVER = ".git_server";
export const CLI_TOKEN = ".token";
export const GIT_OWNER = ".git_own";
export const REPO_OWNER = {
  USER: "user",
  ORG: "org",
};

export const GIT_OWNER_TYPE = [
  {
    name: "个人",
    value: REPO_OWNER.USER,
  },
  {
    name: "组织",
    value: REPO_OWNER.ORG,
  },
];

export const GIT_OWNER_TYPE_ONLY = [
  {
    name: "个人",
    value: REPO_OWNER.USER,
  },
];

export const STORE_FILES = {
  GIT_SERVER_FILE: ".git_server",
  GIT_TOKEN_FILE: ".git_token",
  GIT_OWNER_FILE: ".git_own",
  GIT_LOGIN_FILE: ".git_login",
  GIT_BRANCH_FILE: ".git_branch",
};

## commit 指令

```js
// 具体使用
zcli commit [-m]
```

提供 `-m` 配置项，使用该配置项，可以在本地发起 `pull requests` 请求。

commit 指令运行依据 gitflow 机制，可实现多人协作，具体流程可分为 5 个阶段，见下图。

![](./docs/images/zcli-commit.png)

commit 指令几乎复刻了开发中的代码提交工作，可以实现代码提交的全流程自动化。目前仅支持 github 托管平台，gitee 后续开发中。

更详细的请参考 [zcli](https://www.npmjs.com/package/@zcxiaobao-cli/cli)

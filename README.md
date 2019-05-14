# 定制Sche

## 如何执行

* 创建一个 `config.ENV.json` ENV 为 stage
```shell
sls deploy --aws-profile default --stage <ENV>
```
* 在自动创建的 **SNS Topic** 中添加 **邮件 Subscription** 

* 修改 `emr.js` 中的 **TODO** 部分来提交 **EMR Step**

* 在执行 Step 执行完毕的脚本中调用 `scale-in` lambda 来缩小 EMR Group


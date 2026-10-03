# jAutoVenue 本地完善版

当前新增 Edge 扩展，位于 edge-extension/，详细安装及验证范围请阅读其中 README.md。
此版本提供偏好保存、场次定位、明确时间/场地对应关系、空位高亮、页面变化提醒和日志。
官网须知禁止“外挂”预约，因此不执行原脚本的自动订单和付款，也不使用旧验证码识别服务。

原 Python 文件仅保留历史参考，请勿直接运行 sport.py：它使用过时 Selenium API、eval 参数解析、明文密码配置和旧下单支付逻辑。
原说明已保存在 README.legacy.md。


## 原仓库与来源

本仓库基于 [ifarewell/jAutoVenue](https://github.com/ifarewell/jAutoVenue)，保留原项目提交历史。本账号提供本地部署改进及 Edge 扩展；原作者与本地修改的来源分别注明，使用时遵守上游许可及平台规则。

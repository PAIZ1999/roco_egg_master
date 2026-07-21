# roco-helper-web 后端 API 与 SSE 契约

## 文档范围

本文档整理 `roco-helper-web` 当前实际使用的后端接口，并以以下源码为事实来源：

本文档只详述 Web 已使用的接口。主项目还向插件等客户端提供系统状态和地图标注接口，见文末“Web 当前未使用的后端接口”。

## 基础约定

### 地址与请求格式

- 默认服务地址：`http://127.0.0.1:4939`
- API 前缀：`/api`
- REST 响应：`application/json`
- SSE 响应：`text/event-stream`
- Web 开发模式由 Vite 把 `/api` 代理到本地服务；生产环境使用同源 `/api`。

### UID 规则

玩家 UID 应作为十进制字符串传递，避免 JavaScript 大整数精度丢失。

```http
GET /api/pet-info?uid=123456789
```

以下接口不依赖选中用户：

- `GET /api/users`

用户数据接口没有有效 UID 时的行为并不完全相同：

- `pet-info`、`box-info`、`home-pet`、`room-plane`、`handbook` 返回空数组。
- `pet-history`、`throw-history` 返回 HTTP `400`。

### 成功与错误

成功响应直接返回业务对象或数组，没有统一的 `{ code, data }` 外层包装。

错误响应：

```json
{
  "error": "错误说明"
}
```

## Web 使用接口总览

| 方法 | 路径 | UID | 使用页面/模块 | 用途 |
| --- | --- | --- | --- | --- |
| `GET` | `/api/users` | 不需要 | 全局布局 | 获取已识别用户 |
| `GET` | `/api/pet-info` | 必需 | 宠物、孵蛋、图鉴、小窝 | 获取宠物快照 |
| `GET` | `/api/box-info` | 必需 | 宠物、孵蛋 | 获取仓库快照和位置 |
| `GET` | `/api/home-pet` | 必需 | 小窝地图 | 获取家园宠物与家具绑定 |
| `GET` | `/api/room-plane` | 必需 | 小窝地图 | 获取房间家具布局 |
| `GET` | `/api/handbook` | 必需 | 宠物图鉴 | 获取图鉴进度 |
| `GET` | `/api/pet-history` | 必需 | 捕捉统计 | 查询捕捉历史 |
| `GET` | `/api/throw-history` | 必需 | 捕捉统计 | 查询投球历史 |
| `GET` | `/api/memory/egg_time.updated` | 全局 `0` | 产蛋时间 | 获取产蛋时间初始快照 |
| `GET` | `/api/events` | 必需 | 全局布局 | 接收所有实时增量 |

## REST 接口

### `GET /api/users`

获取数据库中已识别的用户，按最近出现时间倒序排列。

```json
[
  {
    "uid": "123456789",
    "name": "玩家名",
    "avatar": 1001
  }
]
```

字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `uid` | string | 玩家 UID |
| `name` | string | 玩家名 |
| `avatar` | number | 头像配置 ID；无值时为 `0` |

Web 启动时先调用本接口，再恢复本地保存的选中 UID。收到 `user.login` 后会重新请求，并优先切换到事件对应 UID。

### `GET /api/pet-info?uid=<uid>`

返回当前用户的全部宠物。每项是 `PetData` protobuf 转成的 JSON 对象，数据库按宠物 `gid` 保存。

```json
[
  {
    "gid": 10001,
    "base_conf_id": 2001,
    "level": 50,
    "nature": 3,
    "add_time": 1750000000,
    "...": "..."
  }
]
```

`PetData` 字段较多，Web 的完整消费类型位于 `src/types/pet.ts` 的 `PetInfo`。字段命名沿用 protobuf JSON 的 snake_case；新增字段应对照当前生成类型和脚本实际入库数据，不应根据页面展示名推断。

Web 用途：

- 启动或切换用户时作为宠物初始快照。
- `pet_info.reload` 到达后重新拉取。
- 宠物筛选、孵蛋配对/蛋窝、图鉴拥有状态和小窝详情共享同一份宠物状态。

### `GET /api/box-info?uid=<uid>`

返回宠物仓库列表。

```json
[
  {
    "id": 0,
    "data": [0, 10001, 0]
  }
]
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 箱子编号，0-based |
| `data` | array | 每格的宠物 GID，索引为 0-based；`0` 表示空格 |

Web 将其转换为 `gid -> { box_id, index }` 的位置映射。收到 `box.reload`、`box.changed` 或 `box.replaced` 后，当前实现统一重新请求完整仓库列表，没有直接合并事件载荷。

### `GET /api/home-pet?uid=<uid>`

返回放置在自己家园中的宠物及其家具绑定。

```json
[
  {
    "gid": 10001,
    "furniture_guid": "987654321"
  }
]
```

`furniture_guid` 使用字符串，Web 用它关联 `/api/room-plane` 中的家具。

### `GET /api/room-plane?uid=<uid>`

返回自己家园的房间与家具布局。

```json
[
  {
    "id": 1,
    "data": [
      {
        "plane_guid": "plane-1",
        "furniture_list": [
          {
            "config_id": 1001,
            "furniture_guid": "987654321",
            "position": {
              "pos": { "x": 100, "y": 200, "z": 0 },
              "dir": { "x": 0, "y": 0, "z": 0 }
            }
          }
        ]
      }
    ]
  }
]
```

| 字段 | 说明 |
| --- | --- |
| `id` | 游戏房间 ID |
| `data` | `room_plane_list` 的 protobuf JSON 数组 |
| `furniture_list[].furniture_guid` | 家具实例标识，与 `home-pet` 关联 |
| `furniture_list[].position.pos` | 游戏坐标；Web 使用 `x/y` 投影到小窝地图 |

脚本会产生 `room_plane.reload`，但 Web 当前没有订阅该事件；页面首次进入、切换用户或手动刷新时同时拉取 `room-plane` 与 `home-pet`。

### `GET /api/handbook?uid=<uid>`

返回宠物图鉴进度，数据库每行按 `handbook_id` 保存。

```json
[
  {
    "id": 11,
    "data": {
      "handbook_id": 11,
      "record": [
        {
          "pet_base_id": 2001,
          "status": 1,
          "add_time": 1750000000
        }
      ],
      "topic_list": [
        {
          "topic_type": 1,
          "topic_id": 101,
          "finish_cnt": 2,
          "get_award": false
        }
      ],
      "complete_node_num": 4,
      "status": 3
    }
  }
]
```

Web 类型定义允许响应项直接是 `HandbookRecordCollection`，但当前脚本实际返回 `{ id, data }` 数据库行结构。收到 `handbook.reload` 后，Web 重新请求本接口，不直接合并事件中的 `records`。

### `GET /api/pet-history?uid=<uid>`

查询宠物捕捉历史。

查询参数：

| 参数 | 必填 | 类型 | 说明 |
| --- | --- | --- | --- |
| `uid` | 是 | string | 玩家 UID |
| `start_ts` | 否 | number | 秒时间戳，包含边界：`catch_time >= start_ts` |
| `end_ts` | 否 | number | 秒时间戳，包含边界：`catch_time <= end_ts` |

结果按 `catch_time DESC` 排列：

```json
[
  {
    "id": 10001,
    "data": {
      "gid": 10001,
      "base_conf_id": 2001,
      "add_time": 1750000000
    },
    "catch_time": 1750000000
  }
]
```

`start_ts` 或 `end_ts` 不是有效的非负数字时返回 HTTP `400`。Web 会对界面时间取整为秒，并把开始、结束分钟扩展到对应分钟边界。

### `GET /api/throw-history?uid=<uid>`

查询咕噜球投掷历史。查询参数及校验规则与 `pet-history` 相同，结果按 `throw_time DESC` 排列。

```json
[
  {
    "id": 1,
    "ball_id": 100982,
    "throw_time": 1750000000
  }
]
```

### `GET /api/memory/egg_time.updated`

读取 `egg_time.updated` 的全局运行时快照。`/api/memory/<name>` 是 `/api/runtime/<name>` 的兼容别名，当前 Web 仍调用前者。

```json
{
  "kind": "egg_time.updated",
  "uid": "0",
  "value": {
    "pets": [
      {
        "name": "宠物名",
        "predicted_egg_time": 1750000000
      }
    ]
  },
  "count": 1,
  "mode": "latest",
  "latest": {
    "pets": [
      {
        "name": "宠物名",
        "predicted_egg_time": 1750000000
      }
    ]
  }
}
```

Web 读取 `latest`。没有状态时 `latest`/`value` 可能为空，`count` 为 `0`。`predicted_egg_time` 是秒级 Unix 时间戳。

## SSE

### 连接

```http
GET /api/events?uid=<uid>
Accept: text/event-stream
```

Web 在获取到选中用户后只建立一条统一连接；切换用户时关闭旧连接并使用新 UID 重连。连接错误后等待 5 秒重连。

连接成功时服务端先发送：

```text
event: ready
data: {"ok":true}

```

Web 当前没有注册 `ready` 处理器。服务端不提供历史事件回放，所以页面必须先通过 REST/运行时接口取得快照，再用 SSE 合并增量。

### UID 投递规则

| 事件 UID | `?uid=0` | `?uid=123` |
| --- | --- | --- |
| `0`（全局事件） | 收到 | 收到 |
| `123` | 收到 | 收到 |
| `456` | 收到 | 不收到 |

Web 正常使用选中 UID 连接，因此会收到该用户事件以及 `uid=0` 的全局事件。

### 业务消息格式

脚本产生的事件对象：

```json
{
  "uid": "123456789",
  "event": "pet_info.changed",
  "data": {
    "id": 10001,
    "data": { "gid": 10001 }
  }
}
```

主项目广播为：

```text
event: pet_info.changed
data: {"uid":"123456789","event":"pet_info.changed","data":{"id":10001,"data":{"gid":10001}}}

```

注意 `MessageEvent.data` 是完整事件信封，不是内层业务 `data`。Web 的 `parseLiveSseData<T>()` 会解析信封、取出内层 `data`，并把外层 `uid` 合并进对象载荷。因此页面处理器通常收到：

```json
{
  "id": 10001,
  "data": { "gid": 10001 },
  "uid": "123456789"
}
```

### Web 订阅事件总览

| 事件 | 作用域 | Web 处理方式 |
| --- | --- | --- |
| `user.login` | 用户 | 刷新用户列表 |
| `pet_info.reload` | 用户 | 重拉全部宠物 |
| `pet_info.changed` | 用户 | 本地插入或替换单只宠物 |
| `pet_info.deleted` | 用户 | 本地删除宠物 |
| `pet_info.catch` | 用户 | 捕捉统计实时增量 |
| `throw_ball` | 用户 | 投球统计实时增量 |
| `box.reload` | 用户 | 重拉全部仓库 |
| `box.changed` | 用户 | 重拉全部仓库 |
| `box.replaced` | 用户 | 重拉全部仓库 |
| `home_pet.reload` | 用户 | 替换小窝宠物列表 |
| `home_pet.placed` | 用户 | 本地新增/更新小窝宠物，并重拉宠物 |
| `home_pet.unplaced` | 用户 | 本地移除小窝宠物，并重拉宠物 |
| `handbook.reload` | 用户 | 重拉图鉴数据 |
| `egg_time.updated` | 全局 `0` | 替换产蛋时间列表 |

`AppLayout.vue` 实际注册 14 个事件名。页面内部通过事件总线继续消费其中 7 个实时事件；同一条 SSE 不会按页面重复建立连接。

### 事件载荷

#### `user.login`

```json
{
  "flow_id": "连接标识",
  "name": "玩家名",
  "avatar": 1001
}
```

玩家 UID 位于外层事件信封，由 `parseLiveSseData()` 合并为载荷的 `uid`。

#### `pet_info.reload`

```json
{
  "page_no": 1,
  "total_page": 3,
  "data": [
    { "gid": 10001, "base_conf_id": 2001 }
  ]
}
```

当前脚本按宠物分页响应产生事件，Web 不使用事件内的分页和宠物数据，而是在每次事件到达时重新请求 `/api/pet-info`。

#### `pet_info.changed`

```json
{
  "id": 10001,
  "data": {
    "gid": 10001,
    "base_conf_id": 2001
  }
}
```

`id` 为宠物 GID，`data` 为完整或可供覆盖的 `PetData` JSON。

#### `pet_info.deleted`

```json
{
  "ids": [10001, 10002]
}
```

#### `pet_info.catch`

```json
{
  "id": 10001,
  "data": {
    "gid": 10001,
    "base_conf_id": 2001
  },
  "catch_time": 1750000000
}
```

捕捉统计页只在实时模式处理该事件，并按 `id` 去重。当前脚本会在捕捉奖励进入 `goods_reward.rewards` 时写入历史并发送事件；普通 `goods_change_info.changes` 分支中的同类捕捉历史逻辑目前被注释，因此该事件能否覆盖所有捕捉路径取决于实际协议流量。

#### `throw_ball`

```json
{
  "ball_id": 100982,
  "time": 1750000000
}
```

仅在捕捉投掷类型、存在目标且物品属于脚本维护的捕捉球集合时产生。历史 REST 字段名为 `throw_time`，SSE 字段名为 `time`。

#### `box.reload`

```json
{
  "boxes": [
    {
      "id": 0,
      "data": [0, 10001, 0]
    }
  ]
}
```

#### `box.changed`

```json
{
  "id": 0,
  "pos": 1,
  "pet_gid": 10001
}
```

`id` 与 `pos` 均为 0-based。

#### `box.replaced`

```json
{
  "id": 0,
  "data": [0, 10001, 0]
}
```

#### `home_pet.reload`

```json
{
  "pets": [
    {
      "gid": 10001,
      "furniture_guid": "987654321"
    }
  ]
}
```

#### `home_pet.placed`

```json
{
  "gid": 10001,
  "furniture_guid": "987654321"
}
```

#### `home_pet.unplaced`

```json
{
  "gids": [10001, 10002]
}
```

#### `handbook.reload`

增量通知示例：

```json
{
  "records": [
    {
      "handbook_id": 11,
      "record": [],
      "topic_list": []
    }
  ],
  "incremental": true
}
```

## 页面数据流

| 页面/共享模块 | 初始快照 | SSE 增量 |
| --- | --- | --- |
| 全局用户 | `/api/users` | `user.login` 后重拉 |
| 宠物筛选、孵蛋 | `/api/pet-info`、`/api/box-info` | 宠物本地合并或重拉；仓库统一重拉 |
| 宠物图鉴 | `/api/handbook`，并复用全局宠物 | `handbook.reload` 后重拉 |
| 捕捉统计历史模式 | `/api/pet-history`、`/api/throw-history` | 不合并 SSE |
| 捕捉统计实时模式 | 先查询最近时间窗历史 | `pet_info.catch`、`throw_ball` 本地追加 |
| 小窝地图 | `/api/room-plane`、`/api/home-pet`，并复用全局宠物 | `home_pet.*` 本地合并；未订阅 `room_plane.reload` |
| 产蛋时间 | `/api/memory/egg_time.updated` | `egg_time.updated` 替换列表 |

## Web 当前未使用的后端接口

脚本/主项目还提供以下接口，但当前 `roco-helper-web/src/api` 没有调用：

- `GET /api/health`
- `GET /api/state`
- `GET /api/version`
- `GET /api/devices`
- `GET /api/runtime/<name>`，Web 仍使用其 `/api/memory/<name>` 兼容别名
- `GET /api/map-markers`
- `POST /api/map-markers`
- `PUT /api/map-markers/<id>`
- `DELETE /api/map-markers/<id>`

脚本还会产生 `room_plane.reload`、`map.*` 等事件，但 Web 当前统一 SSE 没有为它们注册处理器。不要仅因为后端存在某个路由或事件，就将其视为 Web 已接入能力。

## 联调注意事项

- SSE `data:` 必须按完整信封解析；直接把它当作业务载荷会多一层 `{ uid, event, data }`。
- SSE 不回放。页面首次加载、刷新和断线期间的数据一致性必须依赖 REST/运行时快照。
- Web 当前在开发模式用 `fetch` 手动解析 SSE 并打印事件，生产模式使用原生 `EventSource`；两者都依赖标准的空行分帧。
- `uid=0` 表示订阅全部用户，不表示某个真实用户；普通 Web 页面应使用当前选中 UID。
- `room_plane.reload` 尚未被 Web 消费，游戏内房间布局变化后需要页面手动刷新才能确保更新。
- 捕捉历史与 `pet_info.catch` 的完整性依赖脚本识别到的奖励协议路径，不能仅凭 `pet_info.changed` 推断一次捕捉。

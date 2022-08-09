---
title: 人菜瘾大，用python监控羽毛球场余票
date: 2022-05-12 11:10
permalink: /posts/%E4%BA%BA%E8%8F%9C%E7%98%BE%E5%A4%A7%EF%BC%8C%E7%94%A8python%E7%9B%91%E6%8E%A7%E7%BE%BD%E6%AF%9B%E7%90%83%E5%9C%BA%E4%BD%99%E7%A5%A8
categories:
- posts
tags: 
---
　　![](https://image.ztianzeng.com/uPic/20220512111453.png)

　　人到中年，迷上了羽毛球，苦于所住的地方周边球场着实火爆，票出秒没。

　　有必要通过一些技术手段，扒拉出余票数，将有票的场地给提取出来，发送通知到手机上。

　　因为球场都是下单减库存的，所以为了尽快实现这套逻辑则不去对接支付相关的东西，通过及时通知到手机上手动下单。

　　代码是这样：

```python
import time
from threading import Timer

import requests

productDetail = ""

id1 = 7



def getDay(id, date):
    # 先转换为时间数组
    timeArray = time.strptime(date, "%Y-%m-%d %H:%M:%S")
    # 转换为时间戳
    timeStamp = int(time.mktime(timeArray))
    href = productDetail % (id, timeStamp)
    response = requests.get(href)
    return parseDayJSON(response.json())


def parseDayJSON(dayJson):
    table_data = dayJson['data']['table_data']
    playground = {}
    for x in table_data:
        for y in x:
            if y['hall_name'] not in playground:
                playground[y['hall_name']] = []
            if y['used'] == 0:
                playground[y['hall_name']].append(
                    {
                        'start': y['start'],
                        'end': y['end'],
                        'price': y['price'],

                    }
                )
    playgroundNew = {}
    for site in playground:
        if site not in playgroundNew:
            playgroundNew[site] = []
        siteTime = playground[site]
        if len(siteTime) > 0:
            playgroundNew[site] = merge(siteTime)
    return analyze(playgroundNew)


def analyze(playground):
    count = 0
    consumingDict = {}
    oneHour = 0
    twoHour = 0
    for site in playground:
        if len(playground[site]) > 0:
            count = count + 1
        consuming = 0
        price = 0
        for siteTime in playground[site]:
            price += siteTime['price']
            consuming = int(siteTime['end'].split(':')[0]) - int(siteTime['start'].split(':')[0])
            if siteTime['price'] >= 200:
                consuming = 0
        consumingDict[consuming] = consumingDict.get(consuming, 0) + 1
        if consuming == 1:
            oneHour = oneHour + 1
        if consuming > 1:
            twoHour = twoHour + 1
    print(f'发现 {count} 片场地，一小时: {oneHour} 片 一小时以上: {twoHour} 片  晚上有 {count - oneHour - twoHour} 片')
    night = count - oneHour - twoHour
    return {
        'count': count,
        'oneHour': oneHour,
        'twoHour': twoHour,
        'night': night,
        'playground': playground
    }


def merge(intervals):
    # 目标区间索引值
    target_idx = 0
    # 开始选取候选区间，和目标区间进行对比
    for i in range(1, len(intervals)):
        # 候选区间的开始值小于等于目标区间的结束值，则说明两区间有重合部分
        if intervals[i]['start'] == intervals[target_idx]['end']:
            intervals[target_idx]['end'] = intervals[i]['end']
            intervals[target_idx]['occupy'] = intervals[target_idx].get('occupy', 1) + 1
            intervals[i] = []
        # 否则，两区间不重合
        else:
            # 更新目标区间索引值（设置新的目标区间为当前的候选区间）
            intervals[target_idx]['occupy'] = intervals[target_idx].get('occupy', 1)
            target_idx = i
    # 返回原数组集合中不为空数组的集合
    return [interval for interval in intervals if interval]


def notify(content):
    if content:
        requests.get(f'https://api.day.app/xxxxxxxxxxxx/{content}')


def getNotifyContent(name, data):
    count = data['count']
    oneHour = data['oneHour']
    twoHour = data['twoHour']
    night = data['night'],
    playground = data['playground']
    if twoHour == 0:
        return None
    return f'{name} \n ' \
           f'发现 {count} 片场地 \n ' \
           f'一小时: {oneHour} 片 ' \
           f'一小时以上: {twoHour} 片 ' \
           f'晚上有 {night} 片'


def monitor():
    day = '2022-05-15 00:00:00'
    场地 = getDay(id1, day)
    content = getNotifyContent('场地', 场地)
    notify(content)
    print('--------------------------------------------------------------\n')

    Timer(600, monitor).start()


if __name__ == '__main__':
    sTimer = Timer(600, monitor)
    sTimer.start()
    # monitor()
```

　　每间隔10分钟，启动一次。

　　发现2小时以上的连续场地，就发送通知。。。

　　

　　目前已经抢到了周日的票，完美

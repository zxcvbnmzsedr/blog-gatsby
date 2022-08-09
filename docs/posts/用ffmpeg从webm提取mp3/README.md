---
title: 用ffmpeg从webm提取mp3
date: 2022-06-14 13:55
permalink: /posts/%E7%94%A8ffmpeg%E4%BB%8Ewebm%E6%8F%90%E5%8F%96mp3
categories:
- posts
tags: 
---
如果需要将音频从.webm电影文件提取到.MP3音频文件，可以执行以下操作:

```bash
FILE="要处理的webm文件.webm";
ffmpeg -i "${FILE}" -vn -ab 128k -ar 44100 -y "${FILE%.webm}.mp3";
```

　　第一个命令将文件名分配给一个变量，这样做是为了避免在第二个命令中输入错误，因为我们希望对音频文件使用相同的名称。

　　第二个命令用`ffmpeg`命令从webm文件中提取出音频。

* `-i`，表示输入的文件名
* `-vn`，`ffmpeg`禁用视频录制
* `-ab`，设置比特率为128k
* `-ar`，设置音频采样率为441000hz
* `-y`，如果文件重复，直接覆盖，不进行询问

　　如果我们想处理在同一个文件夹下的`webm`文件列表，则可以通过下面这个脚本:

　　这个脚本会从文件夹下找出所有后缀名为`webm`的文件，并一个一个取进行处理

```bash
for FILE in *.webm; do
    echo -e "Processing video '\e[32m$FILE\e[0m'";
    ffmpeg -i "${FILE}" -vn -ab 128k -ar 44100 -y "${FILE%.webm}.mp3";
done;
```

　　不过这个脚本也能够换一种写法，更为简洁，通过linux的管道进行处理:

```bash
find . -type f -iname "*.webm" -exec bash -c 'FILE="$1"; ffmpeg -i "${FILE}" -vn -ab 128k -ar 44100 -y "${FILE%.webm}.mp3";' _ '{}' \;
```

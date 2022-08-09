---
title: RocketMQ持久化原理
date: 2022-05-07 10:17
permalink: /posts/RocketMQ/RocketMQ%E6%8C%81%E4%B9%85%E5%8C%96%E5%8E%9F%E7%90%86
categories:
- posts
tags: 
---
消息的持久化是RocketMQ中最为复杂和重要的一部分，由于持久化机制的存在才能够实现RocketMQ的高可靠性。

　　**图1**展示了RocketMQ的整体的工作逻辑

　　![](https://image.ztianzeng.com/uPic/20220507104147.png "图1 整体工作流程")

1. Productor按照顺序写入`CommitLog`
2. Consumer顺序读取`ConsumeQueue`进行消费, `ConsumeQueue`是`CommitLog`基于`Topic`的索引文件

　　RocketMQ通过文件来作为中介，来衔接Productor和Consumer之间的消息传递，其流程还是比较简单的。

# ComitLog

　　comitLog是RocketMQ存储消息的地方，Productor的发送消息都会写入到这个文件里面。

　　对应的实现类就叫做CommitLog。

　　CommitLog是通过MMAP的方式来操作文件，以加快文件处理速度，代码在`asyncPutMessages`

```java
// CommitLog.java
public CompletableFuture<PutMessageResult> asyncPutMessages(final MessageExtBatch messageExtBatch) {
        	// .....
            MappedFile mappedFile = this.mappedFileQueue.getLastMappedFile();

		// 如果文件为空，或者文件已经满了，则整一个新的文件出来
            if (null == mappedFile || mappedFile.isFull()) {
                mappedFile = this.mappedFileQueue.getLastMappedFile(0); // Mark: NewFile may be cause noise
            }
		// 创建出来的文件为空，就返回异常
            if (null == mappedFile) {
                log.error("Create mapped file1 error, topic: {} clientAddr: {}", messageExtBatch.getTopic(), messageExtBatch.getBornHostString());
                return CompletableFuture.completedFuture(new PutMessageResult(PutMessageStatus.CREATE_MAPEDFILE_FAILED, null));
            }
            // 向文件中追加消息信息
            result = mappedFile.appendMessages(messageExtBatch, this.appendMessageCallback, putMessageContext);

            switch (result.getStatus()) {
		// 如果正常处理，则相安无事
                case PUT_OK:
                    break;
		// 如果正好到了文件的末尾，则新建一个文件追加到新的文件中去
                case END_OF_FILE:
                    unlockMappedFile = mappedFile;
                    // Create a new file, re-write the message
                    mappedFile = this.mappedFileQueue.getLastMappedFile(0);
                    if (null == mappedFile) {
                        // XXX: warn and notify me
                        log.error("Create mapped file2 error, topic: {} clientAddr: {}", messageExtBatch.getTopic(), messageExtBatch.getBornHostString());
                        return CompletableFuture.completedFuture(new PutMessageResult(PutMessageStatus.CREATE_MAPEDFILE_FAILED, result));
                    }
                    result = mappedFile.appendMessages(messageExtBatch, this.appendMessageCallback, putMessageContext);
                    break;
                case MESSAGE_SIZE_EXCEEDED:
                case PROPERTIES_SIZE_EXCEEDED:
                    return CompletableFuture.completedFuture(new PutMessageResult(PutMessageStatus.MESSAGE_ILLEGAL, result));
                case UNKNOWN_ERROR:
                default:
                    return CompletableFuture.completedFuture(new PutMessageResult(PutMessageStatus.UNKNOWN_ERROR, result));
            }
	// .....
    }
```

　　`asyncPutMessages` 追加msg信息还是比较好理解的，会调用到一个自己封装的`MappedFile`

　　在`MappedFile`的构造函数中，通过JDK提供的文件NIO，初始化了`mappedByteBuffer`

```java
// MappedFile.java
private void init(final String fileName, final int fileSize) throws IOException {
        // .... 
            this.fileChannel = new RandomAccessFile(this.file, "rw").getChannel();
	    // 用mmap的技术来获取文件的句柄
            this.mappedByteBuffer = this.fileChannel.map(MapMode.READ_WRITE, 0, fileSize);
            TOTAL_MAPPED_VIRTUAL_MEMORY.addAndGet(fileSize);
            TOTAL_MAPPED_FILES.incrementAndGet();
            ok = true;
   // .....
    
```

　　然后调用`MappedFile`的`appendMessagesInner`来进行文件的追加，最终又会回到`CommitLog`中的内部类`DefaultAppendMessageCallback`完成文件的写入。

# ComitLog结构

　　启动一个Productor，向着Broker中发送一条msg，msg结构如下

```java
Message msg = new Message("TopicTest",
                    "TagA",
                    "OrderID188",
                    "Hello world".getBytes(RemotingHelper.DEFAULT_CHARSET));
```

　　然后我们用UltraEdit查看一下位于`${home}/store/commitlog`下的`00000000000000000000` 文件

　　![](https://image.ztianzeng.com/uPic/20220507160040.png)

　　可以明显的看到这个CommitLog文件里面明显有我们上传的msg信息。它具体的写入逻辑在`CommitLog`中的内部类`DefaultAppendMessageCallback#doAppend`。

　　这个代码非常的长，主要盯住`byteBuffer` 这个对象，看看往里面`put`了什么东西

```java
/**
* 追加逻辑
* @param fileFromOffset 文件偏移量，也就是具体的文件
* @param byteBuffer 字节缓冲区，需要通过这个对象，完成文件的追加
* @param maxBlank  可以写入的文件的所剩空间
* @param msgInner 内部消息，就是msg对象
* @param putMessageContext 写入消息的上下文
* @return
*/
public AppendMessageResult doAppend(final long fileFromOffset, final ByteBuffer byteBuffer, final int maxBlank,
	// ...先省略        
}
```

## 第一个put

　　通过IDEA工具，可以看到第一个`byteBuffer`的`put`处理，是用于判断文件是否结束的

```java
// 如果消息的长度+用于控制文件结束的8个空白字符 > 剩余胡亮
if ((msgLen + END_FILE_MIN_BLANK_LENGTH) > maxBlank) {
                this.msgStoreItemMemory.clear();
                // 1 TOTALSIZE
                this.msgStoreItemMemory.putInt(maxBlank);
                // 2 MAGICCODE
                this.msgStoreItemMemory.putInt(CommitLog.BLANK_MAGIC_CODE);
                // 3 The remaining space may be any value
                // Here the length of the specially set maxBlank
                final long beginTimeMills = CommitLog.this.defaultMessageStore.now();
		// 加入最后8个空白字符，并且返回文件已经写满的标记
                byteBuffer.put(this.msgStoreItemMemory.array(), 0, 8);
                return new AppendMessageResult(AppendMessageStatus.END_OF_FILE, wroteOffset,
                        maxBlank, /* only wrote 8 bytes, but declare wrote maxBlank for compute write position */
                        msgIdSupplier, msgInner.getStoreTimestamp(),
                        queueOffset, CommitLog.this.defaultMessageStore.now() - beginTimeMills);
}
```

## 第二个put

　　第二个Put的时候，`put`了一个`preEncodeBuffer` 进去

```java
byteBuffer.put(preEncodeBuffer);
```

　　所以，重点就回到了`preEncodeBuffer`是怎么构造出来的

```java
// CommitLog.java
// 发现就一行代码，通过内部msgInner获取到byteBuffer
ByteBuffer preEncodeBuffer = msgInner.getEncodedBuff();
```

　　继续倒过来看，可以看到`MessageExtEncoder`中设置有`encode`方法来对进来的消息体进行设置

```java
// 1 TOTALSIZE
this.encoderBuffer.putInt(msgLen);
// 2 MAGICCODE
this.encoderBuffer.putInt(CommitLog.MESSAGE_MAGIC_CODE);
// 3 BODYCRC
this.encoderBuffer.putInt(msgInner.getBodyCRC());
// 4 QUEUEID
this.encoderBuffer.putInt(msgInner.getQueueId());
// 5 FLAG
this.encoderBuffer.putInt(msgInner.getFlag());
// 6 QUEUEOFFSET, need update later
this.encoderBuffer.putLong(0);
{
   // DefaultAppendMessageCallback.class 中
   preEncodeBuffer.putLong(pos, queueOffset);
}
// 7 PHYSICALOFFSET, need update later
this.encoderBuffer.putLong(0);
{
   // DefaultAppendMessageCallback.class 中
    preEncodeBuffer.putLong(pos, fileFromOffset + byteBuffer.position());

}

// 8 SYSFLAG
this.encoderBuffer.putInt(msgInner.getSysFlag());
// 9 BORNTIMESTAMP
this.encoderBuffer.putLong(msgInner.getBornTimestamp());
// 10 BORNHOST
socketAddress2ByteBuffer(msgInner.getBornHost() ,this.encoderBuffer);
// 11 STORETIMESTAMP
this.encoderBuffer.putLong(msgInner.getStoreTimestamp());
// 12 STOREHOSTADDRESS
socketAddress2ByteBuffer(msgInner.getStoreHost() ,this.encoderBuffer);
// 13 RECONSUMETIMES
this.encoderBuffer.putInt(msgInner.getReconsumeTimes());
// 14 Prepared Transaction Offset
this.encoderBuffer.putLong(msgInner.getPreparedTransactionOffset());
// 15 BODY
this.encoderBuffer.putInt(bodyLength);
if (bodyLength > 0)
    this.encoderBuffer.put(msgInner.getBody());
// 16 TOPIC
this.encoderBuffer.put((byte) topicLength);
this.encoderBuffer.put(topicData);
// 17 PROPERTIES
this.encoderBuffer.putShort((short) propertiesLength);
if (propertiesLength > 0)
    this.encoderBuffer.put(propertiesData);
```

> ![](https://image.ztianzeng.com/uPic/20220507163411.png)
>
> 1. TOTALSIZE: 该消息条目总长度，4字节
> 2. MAGICCODE: 魔法值，固定0xdaa320a7，4字节
> 3. BODYCRC: 消息体crc校验码，4字节
> 4. QUEUEID: ComsumeQueue消息消费队列ID，4字节
> 5. FLAG: 消息FLAG，预留给消费者的标识位，4字节
> 6. QUEUEOFFSET: 消息在ComsumeQueue的偏移量，8字节
> 7. PHYSICALOFFSET: 消息在CommitLog文件中的偏移量，8字节
> 8. SYSFLAG: 消息系统FLAG，例如是否压缩、是否有事务消息，4字节
> 9. BORNTIMESTAMP: 消息产生者调用消息发送API的时间戳，8字节
> 10. BORNHOST: 消息发送者IP、端口号，8字节
> 11. STORETIMESTAMP: 消息存储时间戳，8字节
> 12. STOREHOSPTADDRESS: Broker服务器IP+端口号，8字节
> 13. RECONSUMETIMES: 消息重试次数，4字节
> 14. Prepare Transaction Offset: 事务消息物理偏移量，8字节
> 15. BodyLength: 消息体长度，4字节
> 16. Body: 消息体内容
> 17. TopicLength: 主题存储长度，主题名称不能超过255个字符，1字节
> 18. Topic: 主题内容
> 19. PropertiesLength: 消息属性长度，表示消息属性长度不能超过65536个字符，2字节
> 20. Properties: 消息属性
>

　　最后把这个消息体给put到byteBuffer中去，就完成了文件的写入。

# 消息丢失

　　为了加快读写速度，RocketMQ采用了MMAP来进行写入

1. 将数据文件通过MMAP技术，映射文件到OS的虚拟内存中
2. MMAP技术在写入消息时，会写入到PageCache中，然后异步刷盘到实际的磁盘中

　　写入PageCache的时候，假如说这个时候发生了断电，导致数据没有及时刷到磁盘中就会发生消息丢失

## 解决方案

* 修改配置

  修改 Broker 端配置，默认刷盘方式是通过异步刷盘，修改为同步刷盘

  ```java
  ## 默认情况为 ASYNC_FLUSH 
  flushDiskType = SYNC_FLUSH
  ```

* 集群部署

  为了保证可用性，Broker 通常采用一主（ `master` ）多从（ `slave` ）部署方式。为了保证消息不丢失，消息还需要复制到 slave 节点。

  默认方式下，消息写入 `master` 成功，就可以返回确认响应给生产者，接着消息将会异步复制到 `slave` 节点。

  > 注：master 配置：flushDiskType = SYNC_FLUSH
  >

  此时若 master 突然` 宕机且不可恢复` ，那么还未复制到 `slave` 的消息将会丢失。

  为了进一步提高消息的可靠性，我们可以采用同步的复制方式，`master` 节点将会同步等待 `slave` 节点复制完成，才会返回确认响应

　　虽然上述配置提高消息的高可靠性，但是会降低性能 ，生产实践中需要综合选择。

　　

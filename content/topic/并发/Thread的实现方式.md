# Thread的实现方式

## 实现Runable接口

+ 实现Runable接口
+ 实现run方法
+ 然后通过实现了Runable的实例传递到Thread中，就能实现线程

```java
public RunableThread implements Runable {
  @Override
  public void run(){
    System.out.println("实现Runable接口来实现线程");
  }
}
```

## 直接继承Thread

```java
public ExtentsThread extend Threaad {
	 @Override
  public void run(){
    System.out.println("用Thread类实现线程");
  }
}
```

## 用线程池创建线程

会给我们线程创建设置一些默认的值，比如名字，是不是守护线程，以及优先级 

```java
private static class DefaultThreadFactory implements ThreadFactory {
    ....
    ....
    DefaultThreadFactory() {
        SecurityManager s = System.getSecurityManager();
        group = (s != null) ? s.getThreadGroup() :
                              Thread.currentThread().getThreadGroup();
        namePrefix = "pool-" +
                      poolNumber.getAndIncrement() +
                     "-thread-";
    }

    public Thread newThread(Runnable r) {
        Thread t = new Thread(group, r,
                              namePrefix + threadNumber.getAndIncrement(),
                              0);
        if (t.isDaemon())
            t.setDaemon(false);
        if (t.getPriority() != Thread.NORM_PRIORITY)
            t.setPriority(Thread.NORM_PRIORITY);
        return t;
    }
}
```

## 使用Callable方式创建

有返回值的callable也是新建线程的一种方式。

```java
		public class CallableTask implements Callable<Integer> {
      	@Override
       	public Integer call() throw Exception {
          	return new Random().nextInt();
        }
    }
```

## 使用Timer

TimerTask实现了Runable的接口，Timer中有个TimerThread继承了Thread，本质他还是Thread



## 本质?

Thread的实现的方式从本质上来看只有一种。

来看下Thread的run是如何实现的。

```java
    .......
		private Runnable target;		
    @Override
    public void run() {
        if (target != null) {
            target.run();
        }
    }
		.....
```

+ 方式1: 最终调用target.run() 方法

+ 方式2: 整个run方法被重写

  因此，创建线程只有一种方法：`构造Thread类`

实现方式有两种: 

1. 使用Runable的方式，最后调用target.run方法进行启动

2. 直接继承Thread类，重写run方法

   
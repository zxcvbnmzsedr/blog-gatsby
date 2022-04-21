

# Future主要功能

> Future 最主要的作用是，比如当做一定运算的时候，运算过程可能比较耗时，有时会去查数据库，或是繁重的计算，比如压缩、加密等。
>
> 在这种情况下，如果我们一直在原地等待方法返回，显然是不明智的，整体程序的运行效率会大大降低。
>
> 我们可以把运算的过程放到子线程去执行，再通过 Future 去控制子线程执行的计算过程，最后获取到计算结果。
>
> 这样一来就可以把整个程序的运行效率提高，是一种异步的思想。

## Future接口

Future代表着未来的计算结果。

有一系列方法，比如检查检查计算结果是否完成，或者获取计算的结果。

```java
public interface Future<V> {

    boolean cancel(boolean mayInterruptIfRunning);

    boolean isCancelled();

    boolean isDone();

    V get() throws InterruptedException, ExecutionException;

    V get(long timeout, TimeUnit unit)

        throws InterruptedException, ExecutionException, TimeoutExceptio

}
```

### cancel方法: 取消任务执行

调用cancel方法有三种情况:

1. 任务还没有开始，直接取消
2. 任务已经完成，或者已经被取消过了会返回false。
3. 如果任务正在执行，会根据mayInterruptIfRunning的状态来判断
   + 如果为true，会强制将任务结束，执行任务会收到中断信号
   + 如果为false，会在任务结束之后进行取消

### isCancelled() 方法:判断是否被取消

和cancel配合使用，比较简单

### isDown():判断是否执行完毕

返回有两种情况:

1. 返回值为false代表未完成
2. 返回值为true,有两种情况
   + 任务抛出了异常
   + 任务正常执行完毕

最特殊的就是返回为true的情况，不代表任务是成功执行的，只代表执行完毕了。

### get(): 获取结果

get 方法最主要的作用就是获取任务执行的结果，该方法在执行时的行为取决于 Callable 任务的状态，可能会发生以下 5 种情况。

1. **执行get的时候，任务已经执行完毕**

   可以立刻返回，获取到任务执行结果

2. **任务还没有结果**

   线程池积压了很多任务，执行get的时候任务还没有开始

   或者，任务开始执行了，但是执行时间较长，调用get的时候会将当前线程阻塞，直到任务完成再把结果返回回来

3. **任务执行过程中抛出异常**

   在调用get的时候，会抛出ExecutionException异常。不管执行的call方法里面抛出的异常类型是什么，执行get方法所获得的异常都是ExecutionException

4. **任务被取消了**

   如果任务被取消，我们用 get 方法去获取结果时则会抛出 CancellationException。

5. **任务超时**

   get 方法有一个重载方法，那就是带延迟参数的，调用了这个带延迟参数的 get 方法之后，如果 call 方法在规定时间内正常顺利完成了任务，那么 get 会正常返回；但是如果到达了指定时间依然没有完成任务，get 方法则会抛出 TimeoutException，代表超时了。



## 基础实现

FutureTask为Future提供了基础实现。FutureTask常用来封装Callable和Runable，也可以作为一个任务提交到线程池中执行。

来看一下代码实现:

传入callable作为构造函数，实际的执行逻辑在callable中

```java
public class FutureTask<V> implements RunnableFuture<V>{
  ...
  public FutureTask(Callable<V> callable) {
        if (callable == null)
            throw new NullPointerException();
        this.callable = callable;
        this.state = NEW;       // ensure visibility of callable
    }
}
```

可以看到，它实现了一个接口，这个接口叫作 **RunnableFuture**。我们再来看一下 RunnableFuture 接口的代码实现：

```java
public interface RunnableFuture<V> extends Runnable, Future<V> {
    void run();
}
```

他们的关系入下图所示:

![image-20211207205138417](https://www.shiyitopo.tech/uPic/image-20211207205138417.png)

从此可以看出，FutureTask既可以作为Runable被线程执行，又可以作为Future得到Callable的返回值。

### FutureTask示例

直接使用: 

```java
public class FutureDemo {
      public static void main(String[] args) {
          ExecutorService executorService = Executors.newCachedThreadPool();
          Future future = executorService.submit(new Callable<Object>() {
              @Override
              public Object call() throws Exception {
                  Long start = System.currentTimeMillis();
                  while (true) {
                      Long current = System.currentTimeMillis();
                     if ((current - start) > 1000) {
                         return 1;
                     }
                 }
             }
         });
  
         try {
             Integer result = (Integer)future.get();
             System.out.println(result);
         }catch (Exception e){
             e.printStackTrace();
         }
     }
}
```



还有配合线程的使用: 

+ 第一种方式: Future + ExecutorService
+ 第二种方式: FutureTask + ExecutorService
+ 第三种方式: FutureTask + Thread

```java
import java.util.concurrent.*;
public class CallDemo {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
 
        /**
         * 第一种方式:Future + ExecutorService
         * Task task = new Task();
         * ExecutorService service = Executors.newCachedThreadPool();
         * Future<Integer> future = service.submit(task1);
         * service.shutdown();
         */
 
 
        /**
         * 第二种方式: FutureTask + ExecutorService
         * ExecutorService executor = Executors.newCachedThreadPool();
         * Task task = new Task();
         * FutureTask<Integer> futureTask = new FutureTask<Integer>(task);
         * executor.submit(futureTask);
         * executor.shutdown();
         */
 
        /**
         * 第三种方式:FutureTask + Thread
         */
 
        // 2. 新建FutureTask,需要一个实现了Callable接口的类的实例作为构造函数参数
        FutureTask<Integer> futureTask = new FutureTask<Integer>(new Task());
        // 3. 新建Thread对象并启动
        Thread thread = new Thread(futureTask);
        thread.setName("Task thread");
        thread.start();
 
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
 
        System.out.println("Thread [" + Thread.currentThread().getName() + "] is running");
 
        // 4. 调用isDone()判断任务是否结束
        if(!futureTask.isDone()) {
            System.out.println("Task is not done");
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        int result = 0;
        try {
            // 5. 调用get()方法获取任务结果,如果任务没有执行完成则阻塞等待
            result = futureTask.get();
        } catch (Exception e) {
            e.printStackTrace();
        }
 
        System.out.println("result is " + result);
 
    }
 
    // 1. 继承Callable接口,实现call()方法,泛型参数为要返回的类型
    static class Task  implements Callable<Integer> {
        @Override
        public Integer call() throws Exception {
            System.out.println("Thread [" + Thread.currentThread().getName() + "] is running");
            int result = 0;
            for(int i = 0; i < 100;++i) {
                result += i;
            }
 
            Thread.sleep(3000);
            return result;
        }
    }
}

```


---
title: 原子类的作用概览
date: 2022-04-21 19:40
permalink: /topic/Java%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7%E5%8C%85/%E5%B9%B6%E5%8F%91%E5%B7%A5%E5%85%B7/%E5%8E%9F%E5%AD%90%E7%B1%BB/%E5%8E%9F%E5%AD%90%E7%B1%BB%E7%9A%84%E4%BD%9C%E7%94%A8%E6%A6%82%E8%A7%88
topic: 
  - topic
tags: null
categories: 
  - topic
  - Java并发工具包
  - 并发工具
  - 原子类
  - 原子类的作用概览
---
## 什么是原子类，有什么作用

　　在计算机中，原子性代表着**一组操作要么全部成功，要么全部失败，不能只操作成功的其中一部分**。

　　老掉牙的案例: 银行转账操作。扣钱和加钱的操作必须得同时成功，加钱成功扣钱失败，亦或是加钱失败扣钱成功，都会导致账目的不一致。

　　而**java.util.concurrent.atomic**下的类，就是具有原子性的类，可以原子性的执行添加、递增、递减等操作。

　　就比如，众所周知的i++在多线程环境下不安全的问题，就可以采用getAndIncrement方法来处理。

　　**原子类**的作用和*锁*都有类似之处，都是为了保证并发情况下的线程安全。

　　相比于锁,原子类的优势体现在两个方面:

1. 粒度更细

   原子变量可以把竞争缩小到变量级别，通常情况下，锁的粒度都要大于变量的粒度
2. 效率更高

   如果和同步互斥锁相比，原子类底层使用了CAS操作，不会阻塞线程。

   但是，在高度竞争的情况下，谁更优则是看业务代码的水平了，非绝对。

## 原子类概览

|类型|具体类|
| :---------------------------------| :-----------------------------------------------------------------------------|
|Atomic* 基本类型原子类|AtomicInteger、AtomicLong、AtomicBoolean|
|Atomic*Array 数组类型原子类|AtomicIntegerArray、AtomicLongArray、AtomicReferenceArray|
|Atomic*Reference 引用类型原子类|AtomicReference、AtomicStampedReference、AtomicMarkableReference|
|Atomic*FieldUpdater 升级类型原子类|AtomicIntegerfieldupdater、AtomicLongFieldUpdater、AtomicReferenceFieldUpdater|
|Adder 累加器|LongAdder、DoubleAdder|
|Accumulator 积累器|LongAccumulator、DoubleAccumulator|

### 原子更新基本类型

- AtomicBoolean: 原子更新布尔类型。
- AtomicInteger: 原子更新整型。
- AtomicLong: 原子更新长整型。

　　我们来介绍一下最为典型的 AtomicInteger。对于这个类型而言，它是对于 int 类型的封装，并且提供了原子性的访问和更新。也就是说，我们如果需要一个整型的变量，并且这个变量会被运用在并发场景之下，我们可以不用基本类型 int，也不使用包装类型 Integer，而是直接使用 AtomicInteger，这样一来就自动具备了原子能力，使用起来非常方便。

　　以 AtomicInteger 为例，常用 API：

```java
public final int get()：获取当前的值
public final int getAndSet(int newValue)：获取当前的值，并设置新的值
public final int getAndIncrement()：获取当前的值，并自增
public final int getAndDecrement()：获取当前的值，并自减
public final int getAndAdd(int delta)：获取当前的值，并加上预期的值
void lazySet(int newValue): 最终会设置成newValue,使用lazySet设置值后，可能导致其他线程在之后的一小段时间内还是可以读到旧的值。
```

　　相比 Integer 的优势，多线程中让变量自增：

```java
private volatile int count = 0;
// 若要线程安全执行执行 count++，需要加锁
public synchronized void increment() {
    count++;
}
public int getCount() {
    return count;
}
    
```

　　使用 AtomicInteger 后：

```java
private AtomicInteger count = new AtomicInteger();
public void increment() {
    count.incrementAndGet();
}
// 使用 AtomicInteger 后，不需要加锁，也可以实现线程安全
public int getCount() {
    return count.get();
}

  
```

### 原子更新数组

　　下面我们来看第二大类 Atomic\*Array 数组类型原子类，数组里的元素，都可以保证其原子性，比如 AtomicIntegerArray 相当于把 AtomicInteger 聚合起来，组合成一个数组。这样一来，我们如果想用一个每一个元素都具备原子性的数组的话， 就可以使用 Atomic\*Array。

　　它一共分为 3 种，分别是：

- AtomicIntegerArray：整形数组原子类；
- AtomicLongArray：长整形数组原子类；
- AtomicReferenceArray ：引用类型数组原子类。

```java
public static void main(String[] args) throws InterruptedException {
        AtomicIntegerArray array = new AtomicIntegerArray(new int[] { 0, 0 });
        System.out.println(array);
        System.out.println(array.getAndAdd(1, 2));
        System.out.println(array);
}
```

　　输出:

```java
[0, 0]
0
[0, 2]
```

### 原子更新引用类型

　　Atomic包提供了以下三个类：

- AtomicReference: 原子更新引用类型。
- AtomicStampedReference: 原子更新引用类型, 内部使用Pair来存储元素值及其版本号。
- AtomicMarkableReferce: 原子更新带有标记位的引用类型。

　　这三个类提供的方法都差不多，首先构造一个引用对象，然后把引用对象set进Atomic类，然后调用compareAndSet等一些方法去进行原子操作，原理都是基于Unsafe实现，但AtomicReferenceFieldUpdater略有不同，更新的字段必须用volatile修饰。

```java
import java.util.concurrent.atomic.AtomicReference;
public class AtomicReferenceTest {
    public static void main(String[] args){
        // 创建两个Person对象，它们的id分别是101和102。
        Person p1 = new Person(101);
        Person p2 = new Person(102);
        // 新建AtomicReference对象，初始化它的值为p1对象
        AtomicReference ar = new AtomicReference(p1);
        // 通过CAS设置ar。如果ar的值为p1的话，则将其设置为p2。
        ar.compareAndSet(p1, p2);
        Person p3 = (Person)ar.get();
        System.out.println("p3 is "+p3);
        System.out.println("p3.equals(p1)="+p3.equals(p1));
    }
}

class Person {
    volatile long id;
    public Person(long id) {
        this.id = id;
    }
    public String toString() {
        return "id:"+id;
    }
}
```

　　结果输出：

```java
p3 is id:102
p3.equals(p1)=false
```

### 原子更新字段

　　Atomic包提供了四个类进行原子字段更新：

- AtomicIntegerFieldUpdater: 原子更新整型的字段的更新器。
- AtomicLongFieldUpdater: 原子更新长整型字段的更新器。
- AtomicStampedFieldUpdater: 原子更新带有版本号的引用类型。
- AtomicReferenceFieldUpdater: 原子更新包装类型字段的更新器。

　　这四个类的使用方式都差不多，是基于反射的原子更新字段的值。要想原子地更新字段类需要两步:

- 第一步，因为原子更新字段类都是抽象类，每次使用的时候必须使用静态方法newUpdater()创建一个更新器，并且需要设置想要更新的类和属性。
- 第二步，更新类的字段必须使用public volatile修饰。

　　举个例子：

```java
public class TestAtomicIntegerFieldUpdater {
    public static void main(String[] args){
        TestAtomicIntegerFieldUpdater tIA = new TestAtomicIntegerFieldUpdater();
        tIA.doIt();
    }
    public AtomicIntegerFieldUpdater<DataDemo> updater(String name){
        return AtomicIntegerFieldUpdater.newUpdater(DataDemo.class,name);
    }

    public void doIt(){
        DataDemo data = new DataDemo();
        System.out.println("publicVar = "+updater("publicVar").getAndAdd(data, 2));
        /*
            * 由于在DataDemo类中属性value2/value3,在TestAtomicIntegerFieldUpdater中不能访问
            * */
        //System.out.println("protectedVar = "+updater("protectedVar").getAndAdd(data,2));
        //System.out.println("privateVar = "+updater("privateVar").getAndAdd(data,2));

        //System.out.println("staticVar = "+updater("staticVar").getAndIncrement(data));//报java.lang.IllegalArgumentException
        /*
            * 下面报异常：must be integer
            * */
        //System.out.println("integerVar = "+updater("integerVar").getAndIncrement(data));
        //System.out.println("longVar = "+updater("longVar").getAndIncrement(data));
    }

}

class DataDemo{
    public volatile int publicVar=3;
    protected volatile int protectedVar=4;
    private volatile  int privateVar=5;

    public volatile static int staticVar = 10;
    //public  final int finalVar = 11;

    public volatile Integer integerVar = 19;
    public volatile Long longVar = 18L;

}    
```

　　再说下对于AtomicIntegerFieldUpdater 的使用稍微有一些限制和约束，约束如下：

- 字段必须是volatile类型的，在线程之间共享变量时保证立即可见.eg:volatile int value = 3
- 字段的描述类型(修饰符public/protected/default/private)是与调用者与操作对象字段的关系一致。也就是说调用者能够直接操作对象字段，那么就可以反射进行原子操作。但是对于父类的字段，子类是不能直接操作的，尽管子类可以访问父类的字段。
- 只能是实例变量，不能是类变量，也就是说不能加static关键字。
- 只能是可修改变量，不能使final变量，因为final的语义就是不可修改。实际上final的语义和volatile是有冲突的，这两个关键字不能同时存在。
- 对于AtomicIntegerFieldUpdater和AtomicLongFieldUpdater只能修改int/long类型的字段，不能修改其包装类型(Integer/Long)。如果要修改包装类型就需要使用AtomicReferenceFieldUpdater。

### Adder 加法器和Accumulator积累器

#### Adder介绍

　　我们以LongAdder为例。

　　LongAdder相比于AtomicLong效率更高，因为对于AtomicLong而言，LongAdder引入了分段锁，当竞争不激烈的时候所有的线程都是通过CAS对同一个BASE进行变量修改，当竞争激烈的时候,LongAdder会把不同的线程对应到不同的Cell上进行修改，降低了冲突的概率，从而提高了并发性。

#### Accumulator介绍

　　Accumulator 和 Adder 非常相似，**实际上 Accumulator 就是一个更通用版本的 Adder**，比如 LongAccumulator 是 LongAdder 的功能增强版，因为 LongAdder 的 API 只有对数值的加减，而 LongAccumulator 提供了自定义的函数操作。

　　代码如下：

```java
public static void main(String[] args) throws InterruptedException {
        LongAccumulator accumulator = new LongAccumulator((x, y) -> x * y, 1);
        ExecutorService executor = Executors.newFixedThreadPool(8);
        IntStream.range(1, 10).forEach(i -> executor.submit(() -> accumulator.accumulate(i)));
        Thread.sleep(2000);
        System.out.println(accumulator.getThenReset());
}
```

　　在这段代码中：

- 首先新建了一个 LongAccumulator，同时给它传入了两个参数；
- 然后又新建了一个 8 线程的线程池，并且利用整形流也就是 IntStream 往线程池中提交了从 1 ~ 9 这 9 个任务；
- 之后等待了两秒钟，这两秒钟的作用是等待线程池的任务执行完毕；
- 最后把 accumulator 的值打印出来。

　　这段代码的运行结果是 120960，代表 1\*2\*3\*...\*8\*9=120960 的结果，这个结果怎么理解呢？我们先重点看看新建的 LongAccumulator 的这一行语句：

```java
LongAccumulator accumulator = new LongAccumulator((x, y) -> x * y, 1);
```

　　在这个语句中，我们传入了两个参数：LongAccumulator 的构造函数的第一个参数是二元表达式；第二个参数是 x 的初始值，传入的是 1。在二元表达式中，x 是上一次计算的结果（除了第一次的时候需要传入），y 是本次新传入的值。

　　这里需要指出的是，这里的乘的顺序是不固定的，并不是说会按照顺序从 1 开始逐步往上累乘，它也有可能会变，比如说先乘 5、再乘3、再乘 6。但总之，由于乘法有交换律，所以最终加出来的结果会保证是 120960。这就是这个类的一个基本的作用和用法。

#### 拓展功能

　　我们继续看一下它的功能强大之处。举几个例子，刚才我们给出的表达式是 x * y，其实同样也可以传入 x + y，或者写一个 Math.min(x, y)，相当于求 x 和 y 的最小值。同理，也可以去求 Math.max(x, y)，相当于求一个最大值。根据业务的需求来选择就可以了。代码如下：

```java
LongAccumulator counter = new LongAccumulator((x, y) -> x + y, 0);

LongAccumulator result = new LongAccumulator((x, y) -> x * y, 0);

LongAccumulator min = new LongAccumulator((x, y) -> Math.min(x, y), 0);

LongAccumulator max = new LongAccumulator((x, y) -> Math.max(x, y), 0);
```

　　这时你可能会有一个疑问：在这里为什么不用 for 循环呢？比如说我们之前的例子，从 0 加到 9，我们直接写一个 for 循环不就可以了吗？

　　确实，用 for 循环也能满足需求，但是用 for 循环的话，它执行的时候是串行，它一定是按照 0+1+2+3+...+8+9 这样的顺序相加的，但是 LongAccumulator 的一大优势就是可以利用线程池来为它工作。**一旦使用了线程池，那么多个线程之间是可以并行计算的，效率要比之前的串行高得多**。这也是为什么刚才说它加的顺序是不固定的，因为我们并不能保证各个线程之间的执行顺序，所能保证的就是最终的结果是确定的。

#### 适用场景

　　接下来我们说一下 LongAccumulator 的适用场景。

　　第一点需要满足的条件，就是需要大量的计算，并且当需要并行计算的时候，我们可以考虑使用 LongAccumulator。

　　当计算量不大，或者串行计算就可以满足需求的时候，可以使用 for 循环；如果计算量大，需要提高计算的效率时，我们则可以利用线程池，再加上 LongAccumulator 来配合的话，就可以达到并行计算的效果，效率非常高。

　　第二点需要满足的要求，就是计算的执行顺序并不关键，也就是说它不要求各个计算之间的执行顺序，也就是说线程 1 可能在线程 5 之后执行，也可能在线程 5 之前执行，但是执行的先后并不影响最终的结果。

　　一些非常典型的满足这个条件的计算，就是类似于加法或者乘法，因为它们是有交换律的。同样，求最大值和最小值对于顺序也是没有要求的，因为最终只会得出所有数字中的最大值或者最小值，无论先提交哪个或后提交哪个，都不会影响到最终的结果。

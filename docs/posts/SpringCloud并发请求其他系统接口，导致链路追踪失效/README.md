---
title: SpringCloud并发请求其他系统接口，导致链路追踪失效
date: 2022-04-25 18:46
permalink: /posts/SpringCloud%E5%B9%B6%E5%8F%91%E8%AF%B7%E6%B1%82%E5%85%B6%E4%BB%96%E7%B3%BB%E7%BB%9F%E6%8E%A5%E5%8F%A3%EF%BC%8C%E5%AF%BC%E8%87%B4%E9%93%BE%E8%B7%AF%E8%BF%BD%E8%B8%AA%E5%A4%B1%E6%95%88
categories:
- posts
tags: 
---
　　在有一次使用线程池调用feign接口请求下游接口，下游接口拿不到系统的spanId和traceId，导致多线程下的链路追踪就不起作用，以致于难以排查问题

## 分析

　　由于项目中重写了`Feigin`中的`RequestInterceptor`，在重写方法中会通过`RequestContextHolder`提取header头做了一些对应的属性设置，在多线程开启的子线程下 `RequestContextHolder` 拿到的`request`是null，应该是这边导致的问题。

## 原理分析

　　`RequestContextHolder`是`Spring-Web`提供，用于方便的获取当前请求的信息。

　　其内部中有两个ThreadLocal，一个是用于当前线程的`requestAttributesHolder`，另一个是作用于子线程的`inheritableRequestAttributesHolder`，在不做任何设置的情况下，是通过当前线程的`requestAttributesHolder`来存储对象的.

```java
public abstract class RequestContextHolder  {
	private static final ThreadLocal<RequestAttributes> requestAttributesHolder =
			new NamedThreadLocal<>("Request attributes");

	private static final ThreadLocal<RequestAttributes> inheritableRequestAttributesHolder =
			new NamedInheritableThreadLocal<>("Request context");
}
```

　　在`Spring-Web`的实现中，是在`FrameworkServlet#processRequest`中，在进入请求处理之前，会将`Request`的信息设置到`requestAttributesHolder`中去

```java
protected final void processRequest(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
​
   RequestAttributes previousAttributes = RequestContextHolder.getRequestAttributes();
   ServletRequestAttributes requestAttributes = buildRequestAttributes(request, response, previousAttributes);
​
   initContextHolders(request, localeContext, requestAttributes);
​
   try {
      doService(request, response);
   }
}
​
private void initContextHolders(HttpServletRequest request,
      @Nullable LocaleContext localeContext, @Nullable RequestAttributes requestAttributes) {
​
    if (requestAttributes != null) {
      RequestContextHolder.setRequestAttributes(requestAttributes, this.threadContextInheritable);
    }
}
```

　　在从`RequestContextHolder`中取出数据的时候，则会从`requestAttributesHolder`中取，如果取不到则会从

　　`inheritableRequestAttributesHolder`取。

```java
public static RequestAttributes getRequestAttributes() {
	RequestAttributes attributes = requestAttributesHolder.get();
	if (attributes == null) {
		attributes = inheritableRequestAttributesHolder.get();
	}
	return attributes;
}
```

## 解决方案

### 修改`ServletRegistrationBean`配置

　　我们可以通过设置`threadContextInheritable`来修改存储位置，存储到`inheritableRequestAttributesHolder`中

```java
 @Bean
    public ServletRegistrationBean apiServlet(DispatcherServlet dispatcherServlet) {
	// 设置到子线程
        dispatcherServlet.setThreadContextInheritable(true);
        ServletRegistrationBean bean = new ServletRegistrationBean(dispatcherServlet);
        return bean;
    }
```

### 新开子线程之前手动设置子线程共享

```java
ServletRequestAttributes sra = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
RequestContextHolder.setRequestAttributes(sra, true);
```

　　‍

# InheritableThreadLocal是怎么做到主子线程共享的

　　`InheritableThreadLocal`是在创建`Thread`的时候初始化进去的。

　　来看`Thread`构造方法:

```java
public Thread() {
    this(null, null, "Thread-" + nextThreadNum(), 0);
}

public Thread(ThreadGroup group, Runnable target, String name,
                  long stackSize) {
    this(group, target, name, stackSize, null, true);
}

private Thread(ThreadGroup g, Runnable target, String name,
                   long stackSize, AccessControlContext acc,
                   boolean inheritThreadLocals) {
     ......
    Thread parent = currentThread();
    if (inheritThreadLocals && parent.inheritableThreadLocals != null)
            this.inheritableThreadLocals =
                ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
     ......
}
```

　　最后在创建`Thread` 的时候，会调用一个带`inheritThreadLocals`标记的构造方法

　　如果`inheritThreadLocals`为true，并且当前线程`inheritableThreadLocals`不为空，就将`inheritableThreadLocals`设置成父类的`inheritableThreadLocals`

　　继续点进去看:

```java
 private ThreadLocalMap(ThreadLocalMap parentMap) {
            Entry[] parentTable = parentMap.table;
            int len = parentTable.length;
            setThreshold(len);
            table = new Entry[len];

            for (Entry e : parentTable) {
                if (e != null) {
                    @SuppressWarnings("unchecked")
                    ThreadLocal<Object> key = (ThreadLocal<Object>) e.get();
                    if (key != null) {
                        Object value = key.childValue(e.value);
                        Entry c = new Entry(key, value);
                        int h = key.threadLocalHashCode & (len - 1);
                        while (table[h] != null)
                            h = nextIndex(h, len);
                        table[h] = c;
                        size++;
                    }
                }
            }
        }
```

　　就是通过`ThreadLocalMap`的构造方法，将父类的值一个一个拷贝到子线程中,然后新创建的`inheritableThreadLocals`就有了值，我们也就能通过这个对象，将父线程的值给拿过来了，自然也就完成了主子线程的传递

　　‍

---
title: 345.反转字符串中的元音字母
date: 2022-05-30 11:29
permalink: /topic/LeetCode/%E5%8F%8C%E6%8C%87%E9%92%88/345.%E5%8F%8D%E8%BD%AC%E5%AD%97%E7%AC%A6%E4%B8%B2%E4%B8%AD%E7%9A%84%E5%85%83%E9%9F%B3%E5%AD%97%E6%AF%8D
topic: 
  - topic
tags: null
categories: 
  - topic
  - LeetCode
  - 双指针
  - 反转字符串中的元音字母
---
LeetCode链接:[ https://leetcode.cn/problems/reverse-string/](https://leetcode.cn/problems/reverse-string/)

　　题目描述: 反转字符串中的元音字母。元音字母包括 `'a'`、`'e'`、`'i'`、`'o'`、`'u'`，且可能以大小写两种形式出现。

> 输入：s = "hello"  
> 输出："holle"
>

　　这道题的题型和[125.验证回文串](../125.验证回文串)类似，区别就是一个是反转另一个是比较。

* 声明左右指针
* 将左右指针移动到有效的符号位置
* 开始交换元素

```java
public String reverseVowels(String s) {
    char[] chars = s.toCharArray();
    int left = 0;
    int right = chars.length - 1;

    while (left < right){
        while (left < right && !isV(chars[left])){
            left++;
        }
        while(left < right && !isV(chars[right])){
            right--;
        }
        char t = chars[left];
        chars[left] = chars[right];
        chars[right] = t;
        left++;
        right--;
    }
    return new String(chars);
}
public boolean isV(char ch) {
    return "aeiouAEIOU".indexOf(ch) >= 0;
}
```

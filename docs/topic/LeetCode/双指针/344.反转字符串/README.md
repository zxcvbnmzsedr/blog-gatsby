---
title: 344.反转字符串
date: 2022-05-25 11:30
permalink: /topic/LeetCode/%E5%8F%8C%E6%8C%87%E9%92%88/344.%E5%8F%8D%E8%BD%AC%E5%AD%97%E7%AC%A6%E4%B8%B2
topic: 
  - topic
tags: null
categories: 
  - topic
  - LeetCode
  - 双指针
  - 反转字符串
---
# 344.反转字符串

LeetCode链接:[ https://leetcode.cn/problems/reverse-string/](https://leetcode.cn/problems/reverse-string/)

题目描述: 原地反转字符数组char[s]

> 输入：s = ["h","e","l","l","o"]  
> 输出：["o","l","l","e","h"]

* 申明左右指针，左边代表首字母，右边代表位字母
* 首字母与倒数第一个字母交换
* 第二个字母与倒数第二个字母交换
* 重复以上过程，直到走到中间位置的字母为止

```java
public void reverseString(char[] s) {
        int left = 0;
        int right = s.length - 1;
        while (left < right){
            char tmp = s[left];
            s[left] = s[right];
            s[right] = tmp;
            left++;
            right--;
        }
    }
```

---
title: 125.验证回文串
date: 2022-05-30 11:01
permalink: /topic/LeetCode/%E5%8F%8C%E6%8C%87%E9%92%88/125.%E9%AA%8C%E8%AF%81%E5%9B%9E%E6%96%87%E4%B8%B2
topic: 
  - topic
tags: null
categories: 
  - topic
  - LeetCode
  - 双指针
  - 验证回文串
---
# 125.验证回文串

LeetCode: [https://leetcode.cn/problems/valid-palindrome/](https://leetcode.cn/problems/valid-palindrome/)

题目描述: 验证只考虑字母和数字字符的回文串

> 输入: "A man, a plan, a canal: Panama"  
> 输出: true  
> 解释："amanaplanacanalpanama" 是回文串

* 声明左右指针
* 将左右指针移动到有效的符号位置
* 开始比较

```java
public boolean isPalindrome(String s) {
    char[] chars = s.toLowerCase().toCharArray();
    int left = 0;
    int right = chars.length - 1;
    while (left < right){
        while (left < right && !Character.isLetterOrDigit(chars[left])) {
            left++;
        }
        while (left < right  && !Character.isLetterOrDigit(chars[right])) {
            right--;
        }
        if (chars[left] == chars[right]){
            left++;
            right--;
        }else {
            return false;
        }
    }
    return true;
}
```

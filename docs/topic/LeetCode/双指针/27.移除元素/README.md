---
title: 27.移除元素
date: 2022-05-25 15:32
permalink: /topic/LeetCode/%E5%8F%8C%E6%8C%87%E9%92%88/27.%E7%A7%BB%E9%99%A4%E5%85%83%E7%B4%A0
topic: 
  - topic
tags: null
categories: 
  - topic
  - LeetCode
  - 双指针
  - 移除元素
---
# 27.移除元素

LeetCode链接: [https://leetcode.cn/problems/remove-element/](https://leetcode.cn/problems/remove-element/)

题目描述: 移除指定元素

> 输入：nums = [3,2,2,3], val = 3  
> 输出：2, nums = [2,2]  
> 解释：函数应该返回新的长度 2, 并且 nums 中的前两个元素均为 2。你不需要考虑数组中超出新长度后面的元素。例如，函数返回的新长度为 2 ，而 nums = [2,2,3,3] 或 nums = [2,2,0,0]，也会被视作正确答案。

这道题目和26题类似。

* 声明slow和fast ，指向头部第一个元素
* 如果fast向前走的过程中没有遇到val，则将fast值赋值给slow
* 这样就能够确保，slow和slow之前的元素都是不包含val元素的

```java
public int removeElement(int[] nums, int val) {
        int n = nums.length;
        int slow = 0;
        int fast = 0;
        while (fast < n){
            if (nums[fast] != val){
                nums[slow] = nums[fast];
                slow++;
            }
            fast++;
        }
        return slow;
}
```

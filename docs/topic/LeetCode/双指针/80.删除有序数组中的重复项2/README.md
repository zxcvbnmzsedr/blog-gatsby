---
title: 80.删除有序数组中的重复项2
date: 2022-05-27 15:29
permalink: /topic/LeetCode/%E5%8F%8C%E6%8C%87%E9%92%88/80.%E5%88%A0%E9%99%A4%E6%9C%89%E5%BA%8F%E6%95%B0%E7%BB%84%E4%B8%AD%E7%9A%84%E9%87%8D%E5%A4%8D%E9%A1%B92
topic: 
  - topic
tags: null
categories: 
  - topic
  - LeetCode
  - 双指针
  - 删除有序数组中的重复项2
---
# 80.删除有序数组中的重复项2

LeetCode链接: [https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/](https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/)

题目描述：升序数组，删除重复元素（允许元素最多重复两次）

> 输入：nums = [1,1,1,2,2,3]  
> 输出：5, nums = [1,1,2,2,3]  
> 解释：函数应返回新长度 length = 5, 并且原数组的前五个元素被修改为 1, 1, 2, 2, 3 。 不需要考虑数组中超出新长度后面的元素。

* 如果nums[fast] != nums[slow], 则slow++，将fast的值赋值于slow
* 否则fast自顾自往前走即可
* 在[26题](../26.删除有序数组中的重复项)的基础上加上重复两次的限制

  1. slow可以从1开始，fast从2开始
  2. slow往前走的条件限制放宽

      在nums[fast] != nums[slow]的时候可以往前走

      nums[fast-1] != nums[slow]的时候也可往前走

```java
public int removeDuplicates(int[] nums) {
        int n = nums.length;
        int slow = 1;
        int fast = 2;
        while (fast < n){
            if (nums[slow] != nums[fast] || nums[slow-1] != nums[fast]){
                slow++;
                nums[slow] = nums[fast];
            }
            fast++;
        }
        return slow+1;
    }
```

**复杂度分析**

* 时间复杂度：$O(n﻿)$，其中 $n$ 是数组的长度。快指针和慢指针最多各移动 $n$ 次。
* 空间复杂度：$O(1﻿)$。只需要使用常数的额外空间。

‍

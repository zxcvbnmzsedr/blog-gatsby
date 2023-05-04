---
title: 26.删除有序数组中的重复项
date: 2022-05-25 10:20
permalink: /topic/LeetCode/%E5%8F%8C%E6%8C%87%E9%92%88/26.%E5%88%A0%E9%99%A4%E6%9C%89%E5%BA%8F%E6%95%B0%E7%BB%84%E4%B8%AD%E7%9A%84%E9%87%8D%E5%A4%8D%E9%A1%B9
topic: 
  - topic
tags: null
categories: 
  - topic
  - LeetCode
  - 双指针
  - 删除有序数组中的重复项
---
# 26.删除有序数组中的重复项

LeetCode链接: [https://leetcode.cn/problems/remove-duplicates-from-sorted-array/](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/)

题目描述：升序数组，删除重复元素

> 输入：nums = [1,1,2]  
> 输出：2, nums = [1,2,_]  
> 解释：函数应该返回新的长度 2 ，并且原数组 nums 的前两个元素被修改为 1, 2 。不需要考虑数组中超出新长度后面的元素。

这道题可以采用快慢指针。

* 如果nums[fast] != nums[slow], 则slow++，将fast的值赋值于slow
* 否则fast自顾自往前走即可

```java
public int removeDuplicates(int[] nums) {
        int n = nums.length;
        int slow = 0;
        int fast = 0;
        while (fast < n){
            if (nums[slow] != nums[fast]){
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

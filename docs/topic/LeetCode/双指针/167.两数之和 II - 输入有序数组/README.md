---
title: 167.两数之和 II - 输入有序数组
date: 2022-05-25 10:23
permalink: /topic/LeetCode/%E5%8F%8C%E6%8C%87%E9%92%88/167.%E4%B8%A4%E6%95%B0%E4%B9%8B%E5%92%8C%20II%20-%20%E8%BE%93%E5%85%A5%E6%9C%89%E5%BA%8F%E6%95%B0%E7%BB%84
topic: 
  - topic
tags: null
categories: 
  - topic
  - LeetCode
  - 双指针
  - 两数之和 II - 输入有序数组
---
LeetCode链接: [https://leetcode.cn/problems/two-sum-ii-input-array-is-sorted/solution/yi-zhang-tu-gao-su-ni-on-de-shuang-zhi-zhen-jie-fa/](https://leetcode.cn/problems/two-sum-ii-input-array-is-sorted/solution/yi-zhang-tu-gao-su-ni-on-de-shuang-zhi-zhen-jie-fa/)

　　题目描述：在有序数组中找出两个数，使它们的和为 target。

> 输入：numbers = [2,7,11,15], target = 9  
> 输出：[1,2]  
> 解释：2 与 7 之和等于目标数 9 。因此 index1 = 1, index2 = 2 。返回 [1, 2] 。
>

　　一个指针指向值较小的元素，一个指针指向值较大的元素。

　　指向较小元素的指针从头向尾遍历，指向较大元素的指针从尾向头遍历。

* 如果两个指针指向元素的和 sum == target，那么得到要求的结果；
* 如果 sum > target，移动较大的元素，使 sum 变小一些；
* 如果 sum < target，移动较小的元素，使 sum 变大一些。

　　数组中的元素最多遍历一次，时间复杂度为 O(N)。只使用了两个额外变量，空间复杂度为 O(1)。

```java
public int[] twoSum(int[] numbers, int target) {
        int start = 0;
        int end = numbers.length - 1;
        while (start < end){
            if (numbers[start] + numbers[end] == target){
                return new int[]{start+1,end+1};
            }
            if (numbers[start] + numbers[end] < target){
                start ++;
            }else {
                end --;
            }
        }
        return new int[]{};
    }
```

　　**复杂度分析**

* 时间复杂度：$O(n)$，其中 $n$ 是数组的长度。两个指针移动的总次数最多为 $n$ 次。
* 空间复杂度：$O(1)﻿$。

　　

---
title: 283.移动零
date: 2022-05-27 15:02
permalink: /topic/LeetCode/%E5%8F%8C%E6%8C%87%E9%92%88/283.%E7%A7%BB%E5%8A%A8%E9%9B%B6
topic: 
  - topic
tags: null
categories: 
  - topic
  - LeetCode
  - 双指针
  - 移动零
---
LeetCode链接: [https://leetcode.cn/problems/move-zeroes/submissions/](https://leetcode.cn/problems/move-zeroes/submissions/)

　　题目描述: 将数组中的零，移动到数组的最后，同时保持数组相对顺序不变

> 输入: nums = [0,1,0,3,12]  
> 输出: [1,3,12,0,0]
>

　　使用双指针，左指针指向当前已经处理好的序列的尾部，右指针指向待处理序列的头部。

　　右指针不断向右移动，每次右指针指向非零数，则将左右指针对应的数交换，同时左指针右移。

　　因此每次交换，都是将左指针的零与右指针的非零数交换，且非零数的相对顺序并未改变。

```java
public void moveZeroes(int[] nums) {
    int slow = 0;
    int fast = 0;
    while (fast < nums.length){
        if (nums[fast] != 0 ){
            nums[slow] = nums[fast];
            slow++;
        }
        fast++;
    }
    for (int i = slow;i<nums.length;i++){
        nums[i] = 0;
    }
}
```

　　**复杂度分析**

* 时间复杂度：O(n)**O**(**n**)，其中 n**n** 为序列长度。每个位置至多被遍历两次。
* 空间复杂度：O(1)**O**(**1**)。只需要常数的空间存放若干变量。

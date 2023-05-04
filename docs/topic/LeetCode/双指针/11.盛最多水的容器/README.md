---
title: 11.盛最多水的容器
date: 2022-05-30 13:09
permalink: /topic/LeetCode/%E5%8F%8C%E6%8C%87%E9%92%88/11.%E7%9B%9B%E6%9C%80%E5%A4%9A%E6%B0%B4%E7%9A%84%E5%AE%B9%E5%99%A8
topic: 
  - topic
tags: null
categories: 
  - topic
  - LeetCode
  - 双指针
  - 盛最多水的容器
---
# 11.盛最多水的容器

LeetCode: [https://leetcode.cn/problems/container-with-most-water/](https://leetcode.cn/problems/container-with-most-water/)

题目描述: 

给定一个长度为 n 的整数数组 height 。有 n 条垂线，第 i 条线的两个端点是 (i, 0) 和 (i, height[i]) 。

找出其中的两条线，使得它们与 x 轴共同构成的容器可以容纳最多的水。

返回容器可以储存的最大水量。

> 输入：[1,8,6,2,5,4,8,3,7]  
> 输出：49  
> 解释：图中垂直线代表输入数组 [1,8,6,2,5,4,8,3,7]。在此情况下，容器能够容纳水（表示为蓝色部分）的最大值为 49。

决定一个容器容纳的水的大小，是由最短的那根木板决定。

所以，这道题目本质上寻找一个，底部长度和高度都相对较长的。

* 声明左右指针，作为桶的左右边界
* 按照双指针的思路向内部迭代
* 如果左边的高度比右边小，则左边向右移；反之，右边向左移

  若向内 移动短板 ，水槽的短板 min(h[i], h[j])min(h[i],h[j]) 可能变大，因此下个水槽的面积 可能增大  
  若向内 移动长板 ，水槽的短板 min(h[i], h[j])min(h[i],h[j]) 不变或变小，因此下个水槽的面积一定变小
* 在迭代过程中，计算最大值，即可

```java
public int maxArea(int[] height) {
    int left = 0;
    int right = height.length - 1;
    int max = -1;
    while (left < right){
        int leftHeight = height[left];
        int rightHeight = height[right];
        int cur = Math.min(leftHeight,rightHeight) * (right - left);
        max = Math.max(cur,max);
        if (leftHeight < rightHeight){
            left++;
        }else {
            right--;
        }

    }
    return max;
}
```

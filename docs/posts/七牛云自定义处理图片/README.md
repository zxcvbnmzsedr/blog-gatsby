---
title: 七牛云自定义处理图片
date: 2022-04-21 15:48
permalink: /posts/%E4%B8%83%E7%89%9B%E4%BA%91%E8%87%AA%E5%AE%9A%E4%B9%89%E5%A4%84%E7%90%86%E5%9B%BE%E7%89%87
categories:
- posts
tags: 
---
由于七牛云提供的图片处理服务无法满足业务需求，因此是需要，自定义数据处理服务，对图片进行处理。
目前支持两种类型的处理:

+ 将图片置灰 <ufop>/grey
+ png图片加上背景颜色 <ufop>/background/<颜色16进制代码>

```go
package main

import (
	"bytes"
	"fmt"
	"image"
	_ "image"
	"image/color"
	"image/draw"
	"image/png"
	_ "image/png"
	"io/ioutil"
	"log"
	"net/http"
	url2 "net/url"
	"os"
	"strings"
)

// HTTPGetMaxSize 最大处理的文件长度
const HTTPGetMaxSize = 2 * 1024 * 1024

func httpGet(url string) (body []byte, err error, res *http.Response) {
	res, err = http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("httpGet error: %s", err), res
	}
	defer res.Body.Close()
	body, err = ioutil.ReadAll(http.MaxBytesReader(nil, res.Body, HTTPGetMaxSize))
	if err != nil {
		return nil, fmt.Errorf("httpGet read body error: %s", err), res
	}
	return
}

func handler(rw http.ResponseWriter, req *http.Request) {
	log.Println("获取到请求", req.URL.RawQuery)
	println("获取到请求", req.URL.RawQuery)
	var err error
	defer func() {
		if err != nil {
			http.Error(rw, err.Error(), 500)
		}
	}()

	defer req.Body.Close()
	var body []byte
	var res *http.Response

	cmd, _ := url2.QueryUnescape(req.URL.Query().Get("cmd"))
	op := strings.Split(cmd, "/")

	url := req.URL.Query().Get("url")
	if url != "" {
		body, err, res = httpGet(url)
		if err != nil {
			log.Println("handler http get error:", err.Error())
		}
	} else {
		body, err = ioutil.ReadAll(req.Body)
		if err != nil {
			log.Printf("handler body read error: %s\n", err.Error())
			return
		}
	}

	img, err := png.Decode(bytes.NewReader(body))
	switch op[1] {
	// handler/grey
	case "grey":
		img = greyImage(img)
		break
	// handler/background
	case "background":
		img = backGroundImage(img, op[2])
		break

	}
	write(rw, img, res)

}

/**
 * 给图片增加背景颜色
 */
func backGroundImage(srcImage image.Image, color string) image.Image {
	bounds := srcImage.Bounds()
	newRgba := image.NewRGBA(bounds)
	c, _ := ParseHexColor(color)
	for x := 0; x < newRgba.Bounds().Dx(); x++ { // 将背景图涂黑
		for y := 0; y < newRgba.Bounds().Dy(); y++ {
			newRgba.Set(x, y, c)
		}
	}
	// 在中间贴图
	draw.Draw(newRgba, newRgba.Bounds(), srcImage, image.Pt(0, 0), draw.Over)
	return newRgba
}
func ParseHexColor(s string) (c color.RGBA, err error) {
	c.A = 0xff
	switch len(s) {
	case 6:
		_, err = fmt.Sscanf(s, "%02x%02x%02x", &c.R, &c.G, &c.B)
	case 3:
		_, err = fmt.Sscanf(s, "%1x%1x%1x", &c.R, &c.G, &c.B)
		// Double the hex digits:
		c.R *= 17
		c.G *= 17
		c.B *= 17
	case 5:
		s = "0" + s
		_, err = fmt.Sscanf(s, "%02x%02x%02x", &c.R, &c.G, &c.B)
	default:
		err = fmt.Errorf("invalid length, must be 7 or 4")

	}
	return
}

/**
 * 图片灰化处理
 */
func greyImage(m image.Image) *image.RGBA {
	bounds := m.Bounds()
	dx := bounds.Dx()
	dy := bounds.Dy()
	newRgba := image.NewRGBA(bounds)
	for i := 0; i < dx; i++ {
		for j := 0; j < dy; j++ {
			colorRgb := m.At(i, j)
			_, g, _, a := colorRgb.RGBA()
			gUint8 := uint8(g >> 8)
			aUint8 := uint8(a >> 8)
			newRgba.SetRGBA(i, j, color.RGBA{R: gUint8, G: gUint8, B: gUint8, A: aUint8})
		}
	}
	return newRgba
}
func write(rw http.ResponseWriter, img image.Image, res *http.Response) {
	if res != nil {
		rw.Header().Set("content-type", res.Header.Get("content-type"))
		rw.Header().Set("Content-Disposition", res.Header.Get("Content-Disposition"))
	}
	png.Encode(rw, img)
}

func health(rw http.ResponseWriter, req *http.Request) {
	rw.Write([]byte("ok"))
}

func main() {
	port := os.Getenv("PORT_HTTP")
	if port == "" {
		port = "9100"
	}
	http.HandleFunc("/handler", handler)
	http.HandleFunc("/health", health)
	log.Fatalln(http.ListenAndServe("0.0.0.0:"+port, nil))
}
```

　　github: https://github.com/zxcvbnmzsedr/ufop-golang-demo

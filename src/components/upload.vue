<template>
    <div class="uploadWrap">
        <!-- 按钮 -->
        <div class="upload">
            <input type="file" class="fileUp" @change="uploadChange" multiple :accept="acceptTypes">
            <button>点击上传</button>
        </div>
        <!-- 提示文字 -->
        <span class="tips">
            只能上传小于{{maxSize}}M的
            <span v-for="type in fileTypes" :key="type">
                {{type}}
            </span>
            格式图片,自动过滤
        </span>
        <transition-group appear tag="ul">
            <!-- 上传标签 -->
            <li class="imgWrap" v-for="item in fileList" :key="item.src">
                <!-- 图片 -->
                <div class="left">
                    <img :src="item.src" @load="revokeSrc(item.src)">
                </div>
                <!-- 右边文字和进度 -->
                <div class="right">
                    <span class="name">{{item.name}} </span>
                    <span class="num">
                        <span>{{item.progress}} %</span>
                        <span class="continue" v-if="item.isFail" @click="continueUpload(item)">重试</span>
                    </span>
                    <div class="bar" :style="`width:${item.progress}%`"></div>
                </div>
                <!-- 取消上传标签 -->
                <span class="cancle" @click="removeImg(item)">×</span>
                <!-- 上传成功和失败tips -->
                <span v-if="item.isFinished||item.isFail"
                    :class="['flag',item.isFail?'redBd':(item.isFinished?'greenBd':'')]">
                    <span>{{item.isFail?'✗':(item.isFinished?'✓':'')}}</span>
                </span>
            </li>
        </transition-group>
    </div>
</template>

<script scoped>
    // 请求队列
    let cbList = [], map = new WeakMap;
    // 过滤不符合条件的文件
    function filterFiles(files, fileTypes, maxSize) {
        return files.filter(file => {
            let index = file.name.lastIndexOf('.');
            let ext = file.name.slice(index + 1).toLowerCase();
            // 处理jepg各种格式
            if (['jfif', 'pjpeg', 'jepg', 'pjp', 'jpg'].includes(ext))
                ext = 'jpeg';
            if (fileTypes.includes(ext) && file.size <= maxSize * 1024 * 1024) {
                return true;
            } else {
                return false;
            }
        })
    }
    // 格式化文件名
    function formatName(filename) {
        let lastIndex = filename.lastIndexOf('.');
        let suffix = filename.slice(0, lastIndex);
        let fileName = suffix + new Date().getTime() + filename.slice(lastIndex);
        return fileName;
    }
    // 请求
    function Ajax(options) {
        // 合并
        options = Object.assign({
            url: 'http://127.0.0.1:4000',
            method: 'POST',
            progress: Function.prototype
        }, options);
        // 返回Promise
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest;
            xhr.upload.onprogress = e => {
                options.progress(e, xhr);
            }
            xhr.open(options.method, options.url);
            xhr.send(options.data);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (/^(2|3)\d{2}$/.test(xhr.status)) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject({ msg: "请求已中断" });
                    }
                }
            }
        })
    }
    export default {
        name: 'upload',
        props: {
            maxSize: {
                type: Number,
                default: 2
            },
            fileTypes: {
                type: Array,
                default: () => ['img', 'png', 'jpeg']
            },
            uploadUrl: {
                type: String,
                default: 'http://127.0.0.1:4000/multi'
            },
            reqCnt: {
                default: 4,
                validator: val => {
                    return val > 0 && val <= 6;
                }
            }
        },
        data() {
            return {
                fileList: [],/* 文件列表 */
                maxLen: 6,/* 请求并发数量 */
                finishCnt: 0/* 已完成请求数 */
            }
        },
        mounted() {
            this.maxLen = this.reqCnt;
        },
        methods: {
            //上传
            uploadChange(e) {
                console.log(this.maxLen)
                let files = filterFiles([...e.target.files], this.fileTypes, this.maxSize);//过滤
                this.fileList = this.fileList.concat(files.map((file) => {
                    // 创建
                    let newFile = {};
                    newFile.name = formatName(file.name);
                    newFile.src = window.URL.createObjectURL(file);
                    newFile.progress = 0;
                    newFile.abort = false;
                    newFile.imgSrc = "";
                    // 成功和失败标记
                    newFile.isFinished = false;
                    newFile.isFail = false;
                    // 起始和结束点
                    newFile.start = 0;
                    newFile.total = file.size;
                    // 存入队列后发起上传
                    cbList.push(() => this.handleUpload(file, newFile));
                    this.request();
                    return newFile;
                }));
            },
            handleUpload(file, newFile) {
                let chunkSize = 1 * 2048 * 1024;// 切片大小2M
                // 设置文件上传范围
                let fd = new FormData();
                let start = newFile.start;
                let total = newFile.total;
                let end = (start + chunkSize) > total ?
                    total : (newFile.start + chunkSize);
                // 上传文件信息
                let fileName = newFile.name;
                fd.append('chunk', file.slice(start, end));
                fd.append('fileInfo', JSON.stringify({
                    fileName, start
                }));
                return Ajax({
                    url: this.uploadUrl,
                    data: fd,
                    progress: (e, xhr) => {
                        // 因为会加上文件名和文件夹信息占用字节,还要等待响应回来，所以取小于等于95
                        let proNum = Math.floor((newFile.start + e.loaded) / newFile.total * 100);
                        newFile.progress = Math.min(proNum, 95);
                        // 手动中断上传
                        if (newFile.abort) {
                            xhr.abort();
                        }
                    }
                }).then(res => {
                    if (end >= total) {
                        // 跳至100
                        newFile.progress = 100;
                        // 存url
                        newFile.imgSrc = res.imgSrc;
                        // 状态改变通知
                        newFile.isFinished = true;
                        this.finishCnt++;
                        this.fileListChange();
                    } else {
                        // 新的起始点
                        newFile.start = end + 1;
                        // 发送剩余资源
                        cbList.push(() => this.handleUpload(file, newFile));
                    }
                }, (err) => {
                    newFile.isFail = true;
                    console.log(err);
                    // 建立映射，点击重传使用
                    map.set(newFile, file);
                }).finally(() => {
                    this.maxLen++;
                    this.request();
                });
            },
            //请求
            request() {
                while (this.maxLen > 0 && cbList.length) {
                    let cb = cbList.shift();
                    this.maxLen--;
                    cb();
                }
            },
            // 移除url缓存
            revokeSrc(url) {
                window.URL.revokeObjectURL(url);
            },
            // 删除图片
            removeImg(item) {
                item.abort = true;
                let index = this.fileList.indexOf(item);
                if (index !== -1) {
                    this.fileList.splice(index, 1);
                    this.fileListChange();
                }
            },
            // 上传成功数量变化
            fileListChange() {
                this.$emit('fileListChange', this.fileList);
                if (this.finishCnt && this.finishCnt === this.fileList.length) {
                    this.$emit('finishUpload', this.fileList);
                }
            },
            // 续传
            continueUpload(newFile) {
                newFile.isFail = false;
                let file = map.get(newFile);
                cbList.push(() => this.handleUpload(file, newFile));
                this.request();
            }
        },
        computed: {
            // 设置文件类型
            acceptTypes() {
                return this.fileTypes.map(type => ("image/" + type)).join(',');
            }
        }
    }
</script>

<!-- <style lang="less">
    上传
    .uploadWrap {
        -webkit-user-select: none;
        /*webkit浏览器*/
        -ms-user-select: none;
        /*IE10*/
        -khtml-user-select: none;
        /*早期浏览器*/
        user-select: none;
        position: relative;
        box-sizing: border-box;
        padding: 5px;
    }

    .fileUp {
        opacity: 0;
        position: absolute;
        width: 73px;
        height: 27px;
    }

    .upload {
        padding: 5px 5px 5px 0px;

        button {
            background-color: #409eff;
            border: none;
            border-radius: 2px;
            box-sizing: border-box;
            padding: 5px 10px;
            color: white;
            outline: none;
            cursor: pointer;
        }
    }

    /* 提示 */
    .tips {
        display: inline-block;
        font-size: 10px;
        color: #6b6972;
    }

    /* 标签 */
    .imgWrap {
        list-style: none;
        margin: 10px 0;
        width: 400px;
        min-width: 400px;
        box-sizing: border-box;
        border: 1px solid #c4d0dc;
        position: relative;
        border-radius: 5px;
        display: flex;
        overflow: hidden;
        padding: 10px;

        .left {
            margin-right: 10px;

            img {
                width: 80px;
                height: 80px;
                object-fit: cover;
                border-radius: 5px;
            }
        }

        .right {
            width: 310px;
            color: #647090;
            font-size: 14px;
            /* 垂直元素排列 */
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            box-sizing: border-box;
            overflow: hidden;

            .name {
                width: 90%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .num {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
            }

            .bar {
                height: 5px;
                background-color: #409eff;
                border-radius: 5px;
            }
        }

        .cancle {
            color: #999;
            font-size: 25px;
            position: absolute;
            right: 4px;
            top: -4px;
        }

        &:hover .flag {
            display: none;
        }
    }

    /* 勾 */
    .flag {
        position: absolute;
        width: 0px;
        height: 0px;
        border: 20px solid #13ce66;
        top: 0;
        right: 0;
        font-size: 14px;
        color: white;
        cursor: pointer;

        span {
            position: absolute;
            font-size: 20px;
            right: -16px;
            top: -22px;
        }
    }

    .redBd {
        border-color: orangered orangered transparent transparent;
    }

    .greenBd {
        border-color: #15d169 #15d169 transparent transparent;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    // 淡入淡出效果
    .v-enter,
    .v-leave-to {
        opacity: 0;
        transform: translate(150, 180);
        transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
    }

    .v-enter-active,
    .v-leave-active {
        transition: all 0.7s cubic-bezier(0.55, 0, 0.1, 1);
    }

    .v-move {
        transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
    }

    .v-leave-active {
        position: absolute;
    }
</style> -->
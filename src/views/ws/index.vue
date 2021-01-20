<template>
    <div class="login-container">
        <!-- <img :src=img alt=""> -->
        <vue-qr :text="img" :size="200"></vue-qr>
        <el-button @click="sendMsg">发送消息</el-button>
    </div>
</template>

<script>
    // import { wsUrl } from "../../config/env";
    import { qrCode } from '../../http/home';
    import vueQr from 'vue-qr'
    import configBase from '../../http/configBase'

    export default {
        data() {
            return {
                img: '',
                websock: null,
                tokenV: ''
            }
        },
        components: {
            vueQr
        },
        created() {
            //页面刚进入时开启长连接
            this.initWebSocket()
        },
        destroyed: function () {
            //页面销毁时关闭长连接
            this.websocketclose();
        },
        methods: {
            sendMsg() {
                // console.log(this.tokenV);
                this.websock.send("#anyone#" + this.tokenV);
            },
            initWebSocket() { //初始化weosocket
                qrCode()
                    .then(data => {
                        this.tokenV = data.data.r
                        this.img = JSON.stringify(data.data)
                        let wsUrl = configBase.apiUrl.replace(/http:/, '')
                        this.websock = new WebSocket(`ws://${wsUrl}/websocket/socketServer?uid=${this.tokenV}`);
                        this.websock.onopen = this.websocketonopen;
                        this.websock.onerror = this.websocketonerror;
                        this.websock.onmessage = this.websocketonmessage;
                        this.websock.onclose = this.websocketclose;
                    })
                    .catch(err => {
                        this.$message.error(err.message);
                    });
            },
            websocketonopen() {
                console.log("WebSocket连接成功");
            },
            websocketonerror(e) { //错误
                console.log("WebSocket连接发生错误");
            },
            websocketonmessage(e) { //数据接收
                const redata = JSON.parse(e.data);
                if (redata.code === 200) {
                    this.$router.push({ path: 'Product', query: { userId: redata.userId } })
                }
            },
            websocketsend(agentData) {//数据发送
                this.websock.send(agentData);
            },

            websocketclose(e) { //关闭
                console.log("connection closed (" + e.code + ")");
            },
        },
    }
</script>
<style lang="stylus" scoped>
.login-container
        display flex
        justify-content center
        align-items center
        width 100%
        height 100%
        background: url('~@/assets/imgs/index-bg.jpg')
        background-size 100% 100%
</style>
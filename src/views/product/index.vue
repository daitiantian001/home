<template>
    <div class="product">
        <el-row :gutter="20">
            <div>
                <el-col :span="12">
                    订单:
                    <el-select v-model="orderId" placeholder="请选择" size="medium" @change="changeOrder">
                        <el-option v-for="item in orders" :key="item.ordercode" :label="item.ordertitle"
                            :value="item.ordercode">
                        </el-option>
                    </el-select>
                </el-col>
                <el-col :span="6">
                    类别:
                    <el-select v-model="cnodeCode" placeholder="请选择" size="medium" @change="changeCategory">
                        <el-option v-for="item in category" :key="item.cnodeCode" :label="item.cname"
                            :value="item.cnodeCode">
                        </el-option>
                    </el-select>
                </el-col>
            </div>
            <el-col :span="6">
                <div class="avatar">
                    <!-- <img src="../../assets/imgs/index-bg.jpg" alt=""> -->
                    <img src="userInfo.avatar" alt="">
                    <p>{{userInfo.name}}</p>
                </div>
            </el-col>
        </el-row>
        <el-card class="box-card">
            <div class="title-bar">
                <p>温馨提示：</p>
                <p>已添加的文件提交成功并且被老师确认之后，当前节点不允许再操作上件，可联系老师后台添加！</p>
            </div>
            <div class="item" v-for="(o,index) in taskFiles" :key="o.mid">
                <!-- <el-row :gutter="20" v-if="o.onlyRead == 0"> -->
                <el-row>
                    <el-col :span="6">
                        <!-- <img v-if="o.implUrl" :src="o.implUrl"> -->
                        <input type="file" name="photo" ref="uploadInput" @change="handleChange(o,index)">
                        <p>支持格式为(jpg,png,jpeg,pdf,dox,docx)，图片最大20M</p>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="6">
                        <!-- {{o.mid}} -->
                        {{o.materialDesc}}
                    </el-col>
                    <el-col :span="6">
                        {{o.tempName}}
                    </el-col>
                    <el-col :span="6">
                        <button @click="handlePreview(o.tempUrl)">模板下载</button>
                    </el-col>
                </el-row>
            </div>
        </el-card>
        <button class="submit" @click="subFileInfo">提交</button>
    </div>
</template>
<script>
    import { order, getFile, upFile, subFile, getUserInfo } from '../../http/product.js'
    const qs = require('qs');

    const canSubmitMsg = '没有收到该订单邮件,无法上传!'
    export default {
        name: 'product',
        data() {
            return {
                dialogImageUrl: '',
                dialogVisible: false,
                disabled: false,
                orderInfo: {},
                categoryInfo: {},
                userInfo: {
                    // userId: 'W00V41D1QNN4P9XL'
                    userId: '',
                    avatar: '',
                    name: ''
                },
                canSubmit: false,
                orderId: '',
                orderTitle: '',
                cnodeCode: '',
                cname: '',
                category: [],
                orders: [],
                taskFiles: [
                    {},
                    {},
                    {}
                ],
                taskFileInfo: {
                    studentNo: '',
                    materialType: '',
                    nodeTaskName: '',
                    materialManage: [

                    ]
                }
            }
        },
        created() {
            this.userInfo.userId = this.$route.query.userId

            getUserInfo(this.userInfo.userId).then((result) => {
                if (result && result.code === 1) {
                    // console.log(result);
                    this.userInfo.avatar = result.data.avatar
                    this.userInfo.name = result.data.name
                }
            }).catch((err) => {

            });

            order({
                userId: this.userInfo.userId,
                orderId: "",
                resourceNo: "",
                signType: 0
            }).then((result) => {
                if (result && result.code === 1) {
                    this.orders = result.data.orderList
                    // console.log(result.data)
                }
            }).catch((err) => {

            });

        },
        mounted() {
        },
        methods: {
            changeOrder() {
                let orderInfo = this.findOne(this.orders, this.orderId);
                this.orderInfo = orderInfo;
                order({
                    orderId: orderInfo.ordercode,
                    userId: this.userInfo.userId,
                    resourceNo: orderInfo.clueid,
                    signType: orderInfo.signtype
                }).then((result) => {
                    if (result && result.code === 1) {
                        if (result.data.plist) {
                            this.findCategory(result.data.plist)
                        }
                    }
                }).catch((err) => {

                });
            },
            findOne(orders, value) {
                for (let i = 0; i < orders.length; i++) {
                    if (orders[i].ordercode == value) {
                        return orders[i];
                    }
                }
                return -1;
            },
            findCategory(data) {
                let catagory = []
                if (data) {
                    data.forEach(element => {
                        if (element && element.clist) {
                            element.clist.forEach(e => {
                                if (["5", "8", "13"].includes(e.cnodeCode)) {
                                    catagory.push(e)
                                }
                            });
                        }
                    });
                }
                this.category = catagory || []
            },
            changeCategory() {
                this.canSubmit = false
                let category = this.findOneCategory(this.category, this.cnodeCode);
                this.categoryInfo = category;
                getFile({
                    orderId: this.orderInfo.ordercode,
                    nodeCode: this.categoryInfo.cnodeCode,
                    countryId: this.orderInfo.countryid
                }).then((result) => {
                    if (result && result.code === 1) {
                        this.taskFiles = result.data.plist || []
                        console.log(111, result.data.orderId);
                        if (result.data.orderId && result.data.orderId == this.orderInfo.ordercode) {
                            this.canSubmit = true
                        }
                        this.taskFileInfo.studentNo = this.orderInfo.ordercode
                        this.taskFileInfo.nodeTaskName = this.categoryInfo.cname
                        this.taskFileInfo.materialType = this.cnodeCode
                        // this.taskFileInfo.materialManage = this.taskFiles
                        // console.log();
                    }
                }).catch((err) => {

                });
                // console.log(category);
            },
            findOneCategory(category, cnodeCode) {
                for (let i = 0; i < category.length; i++) {
                    if (category[i].cnodeCode == cnodeCode) {
                        return category[i];
                    }
                }
                return -1;
            },
            handlePreview(url) {
                var link = document.createElement('a');
                try {
                    link.href = url;
                } catch (error) {
                    link.href = window.URL.createObjectURL(url);
                }
                link.click();
            },
            handleChange(o, index) {
                // let url = window.URL.createObjectURL(this.files[0])
                let posterData = new FormData()
                let file = this.$refs.uploadInput[index].files[0]
                // console.log(file);
                // let sizeLimit = 1024 * 1024 * 2
                // if (file.size > sizeLimit) {
                //     return layer.msg('图片不能超过2MB')
                // }
                if (!this.canSubmit) {
                    this.$message({
                        message: canSubmitMsg,
                        type: 'warning'
                    });
                    return
                }
                posterData.append('file', file)
                upFile(posterData).then(res => {
                    if (res && res.head && res.head.code === 0) {
                        o.implUrl = res.body.path
                        o.flag = true
                        // console.log(o);
                        //更新
                    }
                })
            },
            subFileInfo() {
                // console.log(this.taskFiles);
                this.taskFileInfo.materialManage = this.taskFiles.map(k => {
                    let itemInfo = new Object();
                    itemInfo.emailMaterialId = k.mid
                    itemInfo.materialUrl = k.implUrl
                    if (k.maid && k.maid != 0 && !k.flag) {
                        itemInfo.id = k.maid
                    }
                    return itemInfo;
                })
                if (!this.canSubmit) {
                    this.$message({
                        message: canSubmitMsg,
                        type: 'warning'
                    });
                    return
                }
                subFile(this.taskFileInfo).then((result) => {
                    // console.log(result);
                }).catch((err) => {

                });

            }
        }

    }
</script>
<style lang="scss" scoped>
    // .avatar-uploader .el-upload {
    //     border: 1px dashed #d9d9d9;
    //     border-radius: 6px;
    //     cursor: pointer;
    //     position: relative;
    //     overflow: hidden;
    // }

    // .avatar-uploader .el-upload:hover {
    //     border-color: #409EFF;
    // }

    // .avatar-uploader-icon {
    //     font-size: 28px;
    //     color: #8c939d;
    //     width: 178px;
    //     height: 178px;
    //     line-height: 178px;
    //     text-align: center;
    // }

    // .avatar {
    //     width: 178px;
    //     height: 178px;
    //     display: block;
    // }
    .title-bar {
        p {
            text-align: left;
            font-weight: bold;
        }

        p:nth-of-type(2) {
            font-size: 14px;
            font-weight: normal;
        }
    }

    .item {
        margin-top: 80px;
        display: flex;
        justify-content: space-between;

        .el-row {
            width: 400px;

            button {
                width: 100px;
            }

            p {
                margin-top: 6px;
                width: 100%;
                text-align: left;
                font-size: 12px;
                color: #999;
            }
        }

        .el-row:first-of-type {
            .el-col {
                display: flex;
                flex-direction: column;
                width: 100%;
            }
        }
    }

    .submit {
        margin-top: 50px;
        width: 120px;
        height: 40px;
        line-height: 40px;
        color: #fff;
        font-size: 16px;
        border: none;
        background: rgba(0, 150, 200, 1);
        border-radius: 4px;
    }

    .avatar {
        display: flex;
        align-items: center;

        img {
            margin-right: 10px;
            width: 60px;
            height: 60px;
            border-radius: 4px;
        }

        p {
            font-size: 16px;
            color: #ddd;
        }
    }

    .product {
        >.el-row:first-of-type {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            height: 100px;

            div {
                .el-col {
                    width: auto;
                    min-width: 260px;
                    max-width: 460px;
                }
            }

            >.el-col {
                width: auto;
            }

        }

        >.el-row::after,
        .el-row::before {
            display: none;
        }
    }
</style>
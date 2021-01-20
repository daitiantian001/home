/*
 * @Description: '首页'所有的路由
 * @Author: 任录
 * @Date: 2019-07-22 16:47:39
 * @LastEditTime: 2019-07-25 10:11:20
 * @LastEditors: Please set LastEditors
*/

export default [
    {
        path: '',
        component: resolve => require(['@/views/ws'], resolve),
        name: 'WS',
        meta: {
            nav: '首页'
        }
    }, 
]
